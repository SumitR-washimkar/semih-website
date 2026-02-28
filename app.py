from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from google.cloud import firestore
from google.oauth2 import service_account
import os
import re
import random
import string
from datetime import datetime
from dotenv import load_dotenv
from form_security import require_turnstile
from courses import get_courses_by_category, get_course_by_id, get_course_stats, format_price, set_db
from video_config import get_video_urls

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your_secret_key_here')

def initialize_firestore():
    try:
        cred_dict = {
            "type": "service_account",
            "project_id": os.getenv('FIREBASE_PROJECT_ID'),
            "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
            "private_key": os.getenv('FIREBASE_PRIVATE_KEY').replace('\\n', '\n'),
            "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
            "client_id": os.getenv('FIREBASE_CLIENT_ID'),
            "auth_uri": os.getenv('FIREBASE_AUTH_URI'),
            "token_uri": os.getenv('FIREBASE_TOKEN_URI'),
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv('FIREBASE_CLIENT_EMAIL')}"
        }

        credentials = service_account.Credentials.from_service_account_info(cred_dict)
        client = firestore.Client(credentials=credentials, project=os.getenv('FIREBASE_PROJECT_ID'))
        print("Firestore initialized successfully!")
        return client
    except Exception as e:
        print(f"Error initializing Firestore: {e}")
        return None

db = initialize_firestore()
set_db(db)

@app.route('/')
def index():
    try:
        # Fetch latest 3 blog posts for homepage
        blog_posts_ref = db.collection('blogs').where('status', '==', 'published').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(3)
        posts = []
        
        for doc in blog_posts_ref.stream():
            post_data = doc.to_dict()
            post_data['id'] = doc.id
            posts.append(post_data)
        
        return render_template('index.html', recent_posts=posts, **get_video_urls())
    except Exception as e:
        print(f"Error fetching data for homepage: {e}")
        return render_template('index.html', recent_posts=[], **get_video_urls())

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/courses')
def courses():
    try:
        # Fetch courses from database
        courses_ref = db.collection('courses').where('status', '==', 'active').get()
        courses_list = []
        
        for doc in courses_ref:
            course_data = doc.to_dict()
            course_data['id'] = doc.id
            courses_list.append(course_data)
        
        return render_template('courses.html', courses=courses_list)
    except Exception as e:
        print(f"Error fetching courses: {e}")
        return render_template('courses.html', courses=[])

@app.route('/contact', methods=['GET', 'POST'])
@require_turnstile
def contact():
    if request.method == 'POST':
        try:
            contact_data = {
                'name': request.form.get('name'),
                'email': request.form.get('email'),
                'phone': request.form.get('phone'),
                'subject': request.form.get('subject'),
                'message': request.form.get('message'),
                'timestamp': firestore.SERVER_TIMESTAMP,
                'status': 'new'
            }
            
            db.collection('contact_submissions').add(contact_data)
            
            flash('Thank you for contacting us! We will get back to you soon.', 'success')
            return redirect(url_for('contact'))
        except Exception as e:
            flash('An error occurred. Please try again later.', 'error')
            print(f"Error saving contact form: {e}")
    
    # Pass Turnstile site key to template
    turnstile_site_key = os.getenv('TURNSTILE_SITE_KEY', '')
    return render_template('contact.html', turnstile_site_key=turnstile_site_key)

@app.route('/team')
def team():
    try:
        # Fetch team members from database
        team_ref = db.collection('team_members').where('status', '==', 'active').get()
        team_members = []
        
        for doc in team_ref:
            member_data = doc.to_dict()
            member_data['id'] = doc.id
            team_members.append(member_data)
        
        return render_template('team.html', team_members=team_members)
    except Exception as e:
        print(f"Error fetching team members: {e}")
        return render_template('team.html', team_members=[])

@app.route('/programs/doctalks')
def doctalks():
    try:
        # Fetch courses for doctalks category
        courses = get_courses_by_category('doctalks')

        # Add formatted stats and price to each course
        for course in courses:
            course['stats'] = get_course_stats(course)
            course['formatted_actual_price'] = format_price(course.get('actual_price', 0))
            course['formatted_discounted_price'] = format_price(course.get('discounted_price', 0))

        # Fetch latest blog posts
        blog_posts = []
        try:
            posts_ref = db.collection('blogs').where('status', '==', 'published').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(3)
            for doc in posts_ref.stream():
                post_data = doc.to_dict()
                post_data['id'] = doc.id
                if 'slug' not in post_data:
                    post_data['slug'] = doc.id
                blog_posts.append(post_data)
        except Exception as blog_err:
            print(f"Error fetching blog posts for doctalks: {blog_err}")

        return render_template('programs/doctalks.html', courses=courses, blog_posts=blog_posts, **get_video_urls())
    except Exception as e:
        print(f"Error fetching doctalks courses: {e}")
        return render_template('programs/doctalks.html', courses=[], blog_posts=[], **get_video_urls())

@app.route('/programs/denttalks')
def denttalks():
    try:
        # Fetch courses for denttalks category
        courses = get_courses_by_category('denttalks')

        # Add formatted stats and price to each course
        for course in courses:
            course['stats'] = get_course_stats(course)
            course['formatted_actual_price'] = format_price(course.get('actual_price', 0))
            course['formatted_discounted_price'] = format_price(course.get('discounted_price', 0))

        # Fetch latest blog posts
        blog_posts = []
        try:
            posts_ref = db.collection('blogs').where('status', '==', 'published').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(3)
            for doc in posts_ref.stream():
                post_data = doc.to_dict()
                post_data['id'] = doc.id
                if 'slug' not in post_data:
                    post_data['slug'] = doc.id
                blog_posts.append(post_data)
        except Exception as blog_err:
            print(f"Error fetching blog posts for denttalks: {blog_err}")

        return render_template('programs/denttalks.html', courses=courses, blog_posts=blog_posts, **get_video_urls())
    except Exception as e:
        print(f"Error fetching denttalks courses: {e}")
        return render_template('programs/denttalks.html', courses=[], blog_posts=[], **get_video_urls())

@app.route('/programs/nursetalks')
def nursetalks():
    try:
        # Fetch courses for nursetalks category
        courses = get_courses_by_category('nursetalks')

        # Add formatted stats and price to each course
        for course in courses:
            course['stats'] = get_course_stats(course)
            course['formatted_actual_price'] = format_price(course.get('actual_price', 0))
            course['formatted_discounted_price'] = format_price(course.get('discounted_price', 0))

        # Fetch latest blog posts
        blog_posts = []
        try:
            posts_ref = db.collection('blogs').where('status', '==', 'published').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(3)
            for doc in posts_ref.stream():
                post_data = doc.to_dict()
                post_data['id'] = doc.id
                if 'slug' not in post_data:
                    post_data['slug'] = doc.id
                blog_posts.append(post_data)
        except Exception as blog_err:
            print(f"Error fetching blog posts for nursetalks: {blog_err}")

        return render_template('programs/nursetalks.html', courses=courses, blog_posts=blog_posts, **get_video_urls())
    except Exception as e:
        print(f"Error fetching nursetalks courses: {e}")
        return render_template('programs/nursetalks.html', courses=[], blog_posts=[], **get_video_urls())

@app.route('/programs/pharmatalks')
def pharmatalks():
    try:
        # Fetch courses for pharmatalks category
        courses = get_courses_by_category('pharmatalks')

        # Add formatted stats and price to each course
        for course in courses:
            course['stats'] = get_course_stats(course)
            course['formatted_actual_price'] = format_price(course.get('actual_price', 0))
            course['formatted_discounted_price'] = format_price(course.get('discounted_price', 0))

        # Fetch latest blog posts
        blog_posts = []
        try:
            posts_ref = db.collection('blogs').where('status', '==', 'published').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(3)
            for doc in posts_ref.stream():
                post_data = doc.to_dict()
                post_data['id'] = doc.id
                if 'slug' not in post_data:
                    post_data['slug'] = doc.id
                blog_posts.append(post_data)
        except Exception as blog_err:
            print(f"Error fetching blog posts for pharmatalks: {blog_err}")

        return render_template('programs/pharmatalks.html', courses=courses, blog_posts=blog_posts, **get_video_urls())
    except Exception as e:
        print(f"Error fetching pharmatalks courses: {e}")
        return render_template('programs/pharmatalks.html', courses=[], blog_posts=[], **get_video_urls())

@app.route('/course/<course_id>')
def course_detail(course_id):
    """Dynamic course detail page for all courses."""
    try:
        # Fetch course by ID
        course = get_course_by_id(course_id)
        
        if not course:
            flash('Course not found.', 'error')
            return redirect(url_for('courses'))
        
        # Add formatted stats and price
        course['stats'] = get_course_stats(course)
        course['formatted_actual_price'] = format_price(course.get('actual_price', 0))
        course['formatted_discounted_price'] = format_price(course.get('discounted_price', 0))
        
        # Get category info for breadcrumb and styling
        category = course.get('category', '')
        category_info = {
            'denttalks': {'name': 'DentTALKS', 'url': '/programs/denttalks', 'icon': '🦷', 'color': '#0e415b'},
            'doctalks': {'name': 'DocTALKS', 'url': '/programs/doctalks', 'icon': '🩺', 'color': '#0e415b'},
            'nursetalks': {'name': 'NurseTALKS', 'url': '/programs/nursetalks', 'icon': '👩‍⚕️', 'color': '#0e415b'},
            'pharmatalks': {'name': 'PharmaTALKS', 'url': '/programs/pharmatalks', 'icon': '💊', 'color': '#0e415b'}
        }
        
        course['category_info'] = category_info.get(category, {
            'name': 'Courses',
            'url': '/courses',
            'icon': '📚',
            'color': '#0e415b'
        })
        
        return render_template('course-detail.html', course=course)
    except Exception as e:
        print(f"Error fetching course detail: {e}")
        flash('An error occurred while loading the course.', 'error')
        return redirect(url_for('courses'))

@app.route('/products/dr-meddy')
def dr_meddy():
    return render_template('products/dr-meddy.html', **get_video_urls())

@app.route('/products/mr-brown')
def mr_brown():
    return render_template('products/mr-brown.html', **get_video_urls())

@app.route('/products/oet-agents')
def oet_agents():
    return render_template('products/oet-agents.html', **get_video_urls())

@app.route('/products/coursebooks')
def coursebooks():
    return render_template('products/coursebooks.html', **get_video_urls())

@app.route('/partnerships')
def partnerships():
    return render_template('partnerships.html')

@app.route('/partnership-application')
def partnership_application():
    turnstile_site_key = os.getenv('TURNSTILE_SITE_KEY', '')
    return render_template('partnership-application.html', turnstile_site_key=turnstile_site_key)

@app.route('/api/newsletter/subscribe', methods=['POST'])
def newsletter_subscribe():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        existing = db.collection('newsletter_subscribers').where('email', '==', email).limit(1).get()
        
        if len(list(existing)) > 0:
            return jsonify({'success': False, 'message': 'This email is already subscribed'}), 400
        
        subscriber_data = {
            'email': email,
            'subscribed_at': firestore.SERVER_TIMESTAMP,
            'status': 'active',
            'source': data.get('source', 'website')
        }
        
        db.collection('newsletter_subscribers').add(subscriber_data)
        
        return jsonify({'success': True, 'message': 'Successfully subscribed to newsletter!'}), 200
    except Exception as e:
        print(f"Error subscribing to newsletter: {e}")
        return jsonify({'success': False, 'message': 'An error occurred. Please try again.'}), 500

@app.route('/blog')
def blog():
    try:
        # Fetch published blogs from 'blogs' collection
        blog_posts_ref = db.collection('blogs').where('status', '==', 'published').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(20)
        posts = []
        
        for doc in blog_posts_ref.stream():
            post_data = doc.to_dict()
            post_data['id'] = doc.id
            
            # Add slug if it doesn't exist
            if 'slug' not in post_data:
                post_data['slug'] = doc.id
            
            # Use updatedByPhotoURL for author avatar
            if 'updatedByPhotoURL' in post_data and post_data['updatedByPhotoURL']:
                if 'author' not in post_data:
                    post_data['author'] = {}
                post_data['author']['avatar'] = post_data['updatedByPhotoURL']
            
            posts.append(post_data)
        
        print(f"Fetched {len(posts)} blog posts from database")
        return render_template('blog.html', posts=posts)
    except Exception as e:
        print(f"Error fetching blog posts: {e}")
        return render_template('blog.html', posts=[])

@app.route('/blog/<slug>')
def blog_post(slug):
    try:
        # Try to find by slug first
        blog_ref = db.collection('blogs').where('slug', '==', slug).limit(1)
        docs = list(blog_ref.stream())
        
        # If not found by slug, try by document ID
        if not docs:
            doc_ref = db.collection('blogs').document(slug)
            doc = doc_ref.get()
            if doc.exists:
                docs = [doc]
        
        if docs:
            post = docs[0].to_dict()
            post['id'] = docs[0].id
            
            # Add slug if missing
            if 'slug' not in post:
                post['slug'] = docs[0].id
            
            # Transform data to match template expectations
            if 'featuredImage' in post and 'url' in post['featuredImage']:
                post['image'] = post['featuredImage']['url']
            elif 'image' not in post:
                post['image'] = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop'
            
            if 'createdAt' in post and post['createdAt']:
                post['date'] = post['createdAt'].strftime('%b %d, %Y')
            elif 'date' not in post:
                post['date'] = 'Recent'
            
            if 'reading_time' not in post:
                post['reading_time'] = '5 min read'
            
            if 'category' not in post:
                post['category'] = 'Medical'
            
            # Ensure author data exists with updatedByPhotoURL
            if 'author' not in post:
                post['author'] = {
                    'name': post.get('updatedByName') or post.get('createdByName', 'MedTalks Team'),
                    'avatar': post.get('updatedByPhotoURL', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop'),
                    'bio': 'Part of the MedTalks academic team'
                }
            else:
                # If author exists but doesn't have avatar, use updatedByPhotoURL
                if 'avatar' not in post['author'] and 'updatedByPhotoURL' in post:
                    post['author']['avatar'] = post['updatedByPhotoURL']
            
            # Process expertSection if it exists
            if 'expertSection' in post and post['expertSection']:
                # expertSection is already in the correct format from Firebase
                pass
            
            return render_template('blog-post.html', post=post, slug=slug)
        else:
            flash('Blog post not found', 'error')
            return redirect(url_for('blog'))
            
    except Exception as e:
        print(f"Error fetching blog post: {e}")
        flash('An error occurred while loading the blog post', 'error')
        return redirect(url_for('blog'))
    
@app.route('/api/course/enroll', methods=['POST'])
def course_enroll():
    try:
        data = request.get_json()
        
        enrollment_data = {
            'name': data.get('name'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'course': data.get('course'),
            'program': data.get('program'),
            'enrolled_at': firestore.SERVER_TIMESTAMP,
            'status': 'pending'
        }
        
        db.collection('course_enrollments').add(enrollment_data)
        
        return jsonify({'success': True, 'message': 'Enrollment successful!'}), 200
    except Exception as e:
        print(f"Error enrolling in course: {e}")
        return jsonify({'success': False, 'message': 'An error occurred. Please try again.'}), 500

# --- Partnership Application Schema ---
PARTNERSHIP_SCHEMA = {
    'allowed_job_titles': [
        'Director / Founder', 'Academic Coordinator', 'Faculty / Trainer',
        'Business Development', 'Consultant', 'Other'
    ],
    'allowed_countries': [
        'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
        'New Zealand', 'Ireland', 'South Africa', 'Singapore', 'Philippines',
        'Turkey', 'United Arab Emirates', 'Saudi Arabia', 'Germany', 'France',
        'Japan', 'South Korea', 'Nepal', 'Sri Lanka', 'Bangladesh',
        'Pakistan', 'Nigeria', 'Other'
    ],
    'allowed_org_types': [
        'Medical College', 'Nursing College', 'Hospital', 'EdTech Company',
        'Study Abroad Consultancy', 'Individual Trainer', 'Other'
    ],
    'allowed_student_volumes': ['0-100', '100-500', '500-1000', '1000+', 'Not Applicable'],
    'allowed_partnership_types': [
        'Authorized Training Partner', 'Campus Program Partner',
        'Reseller / Referral Partner', 'Corporate Hospital Training Partner',
        'Faculty Representative'
    ],
    'allowed_timelines': ['Immediately', '1-3 months', '3-6 months', 'Not sure yet'],
    'allowed_target_segments': [
        'MBBS Students', 'Nursing Students', 'Doctors / Clinicians',
        'IELTS/OET Aspirants', 'International Placement'
    ],
}

def validate_partnership_application(data):
    """Validate all fields of the partnership application against the schema.
    Returns (is_valid, errors_dict, sanitized_data)."""
    errors = {}
    clean = {}

    # --- Step 1: Personal Information ---
    # First Name
    first_name = (data.get('firstName') or '').strip()
    if not first_name:
        errors['firstName'] = 'First name is required.'
    elif len(first_name) < 2 or len(first_name) > 50:
        errors['firstName'] = 'First name must be 2-50 characters.'
    elif not re.match(r"^[A-Za-z\s\-'.]+$", first_name):
        errors['firstName'] = 'First name contains invalid characters.'
    else:
        clean['first_name'] = first_name

    # Last Name (optional)
    last_name = (data.get('lastName') or '').strip()
    if last_name:
        if len(last_name) > 50:
            errors['lastName'] = 'Last name must be at most 50 characters.'
        elif not re.match(r"^[A-Za-z\s\-'.]+$", last_name):
            errors['lastName'] = 'Last name contains invalid characters.'
        else:
            clean['last_name'] = last_name
    else:
        clean['last_name'] = ''

    # Email
    email = (data.get('email') or '').strip().lower()
    email_regex = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    if not email:
        errors['email'] = 'Email address is required.'
    elif not re.match(email_regex, email):
        errors['email'] = 'Please enter a valid email address.'
    else:
        clean['email'] = email

    # Country Code (accept any non-empty value since we have 50+ codes)
    country_code = (data.get('countryCode') or '').strip()
    if not country_code:
        errors['countryCode'] = 'Country code is required.'
    elif not re.match(r'^\+\d{1,4}(-[A-Z]{2})?$', country_code):
        errors['countryCode'] = 'Invalid country code format.'
    else:
        clean['country_code'] = country_code

    # Phone
    phone = (data.get('phone') or '').strip()
    phone_digits = re.sub(r'[\s\-()]+', '', phone)
    if not phone:
        errors['phone'] = 'Phone number is required.'
    elif not re.match(r'^\d{7,15}$', phone_digits):
        errors['phone'] = 'Phone must be 7-15 digits.'
    else:
        clean['phone'] = phone_digits

    # isWhatsapp (optional boolean)
    clean['is_whatsapp'] = bool(data.get('isWhatsapp', False))

    # Job Title
    job_title = (data.get('jobTitle') or '').strip()
    if not job_title:
        errors['jobTitle'] = 'Role in organization is required.'
    elif job_title not in PARTNERSHIP_SCHEMA['allowed_job_titles']:
        errors['jobTitle'] = 'Invalid role selected.'
    else:
        clean['job_title'] = job_title

    # LinkedIn
    linkedin = (data.get('linkedin') or '').strip()
    if not linkedin:
        errors['linkedin'] = 'LinkedIn profile URL is required.'
    elif not re.match(r'^https?://(www\.)?linkedin\.com/in/.+', linkedin):
        errors['linkedin'] = 'Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/your-profile).'
    else:
        clean['linkedin'] = linkedin

    # --- Step 2: Institution Details ---
    # Company
    company = (data.get('company') or '').strip()
    if not company:
        errors['company'] = 'Institution/company name is required.'
    elif len(company) < 2 or len(company) > 100:
        errors['company'] = 'Institution name must be 2-100 characters.'
    else:
        clean['company'] = company

    # Website (optional)
    website = (data.get('website') or '').strip()
    if website:
        if not re.match(r'^https?://.+\..+', website):
            errors['website'] = 'Please enter a valid URL starting with http:// or https://.'
        else:
            clean['website'] = website
    else:
        clean['website'] = ''

    # Country
    country = (data.get('country') or '').strip()
    if not country:
        errors['country'] = 'Country is required.'
    elif country not in PARTNERSHIP_SCHEMA['allowed_countries']:
        errors['country'] = 'Invalid country selected.'
    else:
        clean['country'] = country

    # Organization Type
    org_type = (data.get('orgType') or '').strip()
    if not org_type:
        errors['orgType'] = 'Organization type is required.'
    elif org_type not in PARTNERSHIP_SCHEMA['allowed_org_types']:
        errors['orgType'] = 'Invalid organization type selected.'
    else:
        clean['org_type'] = org_type

    # Student Volume
    student_volume = (data.get('studentVolume') or '').strip()
    if not student_volume:
        errors['studentVolume'] = 'Student volume is required.'
    elif student_volume not in PARTNERSHIP_SCHEMA['allowed_student_volumes']:
        errors['studentVolume'] = 'Invalid student volume selected.'
    else:
        clean['student_volume'] = student_volume

    # Current English Training
    current_training = (data.get('currentEnglishTraining') or '').strip()
    if not current_training:
        errors['currentEnglishTraining'] = 'Please indicate if you currently offer English training.'
    elif current_training not in ['Yes', 'No']:
        errors['currentEnglishTraining'] = 'Invalid selection.'
    else:
        clean['current_english_training'] = current_training

    # --- Step 3: Partnership Details ---
    # Partnership Type
    partnership_type = (data.get('partnershipType') or '').strip()
    if not partnership_type:
        errors['partnershipType'] = 'Partnership type is required.'
    elif partnership_type not in PARTNERSHIP_SCHEMA['allowed_partnership_types']:
        errors['partnershipType'] = 'Invalid partnership type selected.'
    else:
        clean['partnership_type'] = partnership_type

    # Expected Timeline
    timeline = (data.get('expectedTimeline') or '').strip()
    if not timeline:
        errors['expectedTimeline'] = 'Expected timeline is required.'
    elif timeline not in PARTNERSHIP_SCHEMA['allowed_timelines']:
        errors['expectedTimeline'] = 'Invalid timeline selected.'
    else:
        clean['expected_timeline'] = timeline

    # Target Segments (array, at least 1)
    target_segments = data.get('targetSegments', [])
    if not isinstance(target_segments, list):
        target_segments = [target_segments] if target_segments else []
    target_segments = [s.strip() for s in target_segments if isinstance(s, str) and s.strip()]
    if not target_segments:
        errors['targetSegments'] = 'Please select at least one target segment.'
    else:
        invalid_segments = [s for s in target_segments if s not in PARTNERSHIP_SCHEMA['allowed_target_segments']]
        if invalid_segments:
            errors['targetSegments'] = 'One or more selected segments are invalid.'
        else:
            clean['target_segments'] = target_segments

    # --- Step 4: Business Experience ---
    # Monthly Volume
    monthly_volume = (data.get('monthlyVolume') or '').strip()
    if not monthly_volume:
        errors['monthlyVolume'] = 'Expected monthly volume is required.'
    elif len(monthly_volume) < 2 or len(monthly_volume) > 100:
        errors['monthlyVolume'] = 'Monthly volume must be 2-100 characters.'
    else:
        clean['monthly_volume'] = monthly_volume

    # Why Partner
    why_partner = (data.get('whyPartner') or '').strip()
    if not why_partner:
        errors['whyPartner'] = 'Please explain why you want to partner with us.'
    elif len(why_partner) < 20:
        errors['whyPartner'] = 'Please provide at least 20 characters.'
    elif len(why_partner) > 2000:
        errors['whyPartner'] = 'Please keep your response under 2000 characters.'
    else:
        clean['why_partner'] = why_partner

    # --- Step 5: Agreement ---
    # Additional Info (optional)
    additional_info = (data.get('additionalInfo') or '').strip()
    if additional_info and len(additional_info) > 2000:
        errors['additionalInfo'] = 'Additional info must be under 2000 characters.'
    else:
        clean['additional_info'] = additional_info

    # Agree to Terms
    if not data.get('agreeToTerms'):
        errors['agreeToTerms'] = 'You must agree to the terms and conditions.'
    else:
        clean['agree_to_terms'] = True

    # Authority
    if not data.get('authority'):
        errors['authority'] = 'You must confirm you have authority for partnership discussions.'
    else:
        clean['authority_confirmed'] = True

    # Demo Call
    demo_call = (data.get('demoCall') or '').strip()
    if demo_call not in ['Yes', 'No']:
        errors['demoCall'] = 'Please indicate your demo call preference.'
    else:
        clean['demo_call'] = demo_call

    return (len(errors) == 0, errors, clean)


@app.route('/api/partnership-application', methods=['POST'])
@require_turnstile
def submit_partnership_application():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Invalid request body.', 'errors': {}}), 400

        is_valid, errors, clean_data = validate_partnership_application(data)

        if not is_valid:
            return jsonify({
                'success': False,
                'message': 'Please fix the highlighted errors and try again.',
                'errors': errors
            }), 400

        # Build the document for Firestore
        remote_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if remote_ip and ',' in remote_ip:
            remote_ip = remote_ip.split(',')[0].strip()

        # Generate a unique reference number: MT-YYYYMMDD-XXXXX
        date_part = datetime.utcnow().strftime('%Y%m%d')
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        reference_number = f"MT-{date_part}-{random_part}"

        application_doc = {
            # Reference
            'reference_number': reference_number,
            # Personal Info
            'first_name': clean_data['first_name'],
            'last_name': clean_data['last_name'],
            'full_name': f"{clean_data['first_name']} {clean_data['last_name']}".strip(),
            'email': clean_data['email'],
            'country_code': clean_data['country_code'],
            'phone': clean_data['phone'],
            'full_phone': f"{clean_data['country_code']}{clean_data['phone']}",
            'is_whatsapp': clean_data['is_whatsapp'],
            'job_title': clean_data['job_title'],
            'linkedin': clean_data['linkedin'],
            # Institution Details
            'company': clean_data['company'],
            'website': clean_data['website'],
            'country': clean_data['country'],
            'org_type': clean_data['org_type'],
            'student_volume': clean_data['student_volume'],
            'current_english_training': clean_data['current_english_training'],
            # Partnership Details
            'partnership_type': clean_data['partnership_type'],
            'expected_timeline': clean_data['expected_timeline'],
            'target_segments': clean_data['target_segments'],
            # Business Experience
            'monthly_volume': clean_data['monthly_volume'],
            'why_partner': clean_data['why_partner'],
            # Agreement
            'additional_info': clean_data['additional_info'],
            'agree_to_terms': clean_data['agree_to_terms'],
            'authority_confirmed': clean_data['authority_confirmed'],
            'demo_call': clean_data['demo_call'],
            # Metadata
            'submitted_at': firestore.SERVER_TIMESTAMP,
            'status': 'new',
            'ip_address': remote_ip,
        }

        db.collection('partnership_applications').add(application_doc)

        return jsonify({
            'success': True,
            'reference_number': reference_number,
            'message': 'Your partnership application has been submitted successfully!'
        }), 200

    except Exception as e:
        print(f"Error submitting partnership application: {e}")
        return jsonify({
            'success': False,
            'message': 'An unexpected error occurred. Please try again later.',
            'errors': {}
        }), 500

# API endpoint to get all blogs (for external use or AJAX)
@app.route('/api/blogs')
def api_blogs():
    try:
        blog_posts_ref = db.collection('blogs').where('status', '==', 'published').order_by('createdAt', direction=firestore.Query.DESCENDING)
        posts = []
        
        for doc in blog_posts_ref.stream():
            post_data = doc.to_dict()
            post_data['id'] = doc.id
            
            # Use updatedByPhotoURL for author avatar
            if 'updatedByPhotoURL' in post_data and post_data['updatedByPhotoURL']:
                if 'author' not in post_data:
                    post_data['author'] = {}
                post_data['author']['avatar'] = post_data['updatedByPhotoURL']
            
            # Convert timestamps to strings
            if 'createdAt' in post_data and post_data['createdAt']:
                post_data['createdAt'] = post_data['createdAt'].isoformat() if hasattr(post_data['createdAt'], 'isoformat') else str(post_data['createdAt'])
            
            posts.append(post_data)
        
        return jsonify({'success': True, 'posts': posts}), 200
    except Exception as e:
        print(f"Error in API blogs: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)