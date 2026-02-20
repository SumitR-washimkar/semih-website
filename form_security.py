import requests
import os
from functools import wraps
from flask import request, jsonify

class TurnstileVerifier:
    def __init__(self, secret_key=None):
        self.secret_key = secret_key or os.getenv('TURNSTILE_SECRET_KEY')
        self.verify_url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    
    def verify_token(self, token, remote_ip=None):
        if not token:
            return {
                'success': False,
                'error': 'No token provided'
            }
        
        if not self.secret_key:
            return {
                'success': False,
                'error': 'Turnstile secret key not configured'
            }
        
        payload = {
            'secret': self.secret_key,
            'response': token
        }
        
        if remote_ip:
            payload['remoteip'] = remote_ip
        
        try:
            response = requests.post(
                self.verify_url,
                data=payload,
                timeout=10
            )
            
            result = response.json()
            
            return {
                'success': result.get('success', False),
                'challenge_ts': result.get('challenge_ts'),
                'hostname': result.get('hostname'),
                'error_codes': result.get('error-codes', []),
                'action': result.get('action'),
                'cdata': result.get('cdata')
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'Verification request failed: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }

def require_turnstile(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method != 'POST':
            return f(*args, **kwargs)
        
        verifier = TurnstileVerifier()
        
        if request.is_json:
            token = request.json.get('cf-turnstile-response')
        else:
            token = request.form.get('cf-turnstile-response')
        
        remote_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ',' in remote_ip:
            remote_ip = remote_ip.split(',')[0].strip()
        
        verification = verifier.verify_token(token, remote_ip)
        
        if not verification['success']:
            error_message = 'Security verification failed. Please try again.'
            
            if verification.get('error_codes'):
                print(f"Turnstile verification failed: {verification['error_codes']}")
            elif verification.get('error'):
                print(f"Turnstile error: {verification['error']}")
            
            if request.is_json:
                return jsonify({
                    'success': False,
                    'message': error_message
                }), 403
            else:
                from flask import flash, redirect, url_for
                flash(error_message, 'error')
                return redirect(url_for(request.endpoint))
        
        return f(*args, **kwargs)
    
    return decorated_function

def verify_turnstile_token(token, remote_ip=None):
    verifier = TurnstileVerifier()
    result = verifier.verify_token(token, remote_ip)
    return result['success']