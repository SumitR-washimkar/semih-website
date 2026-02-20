from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from google.cloud import firestore
from google.oauth2 import service_account
import os
from datetime import datetime
from dotenv import load_dotenv
from form_security import require_turnstile
from courses import get_courses_by_category, get_course_by_id, get_course_stats, format_price, set_db

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
        
        return render_template('index.html', recent_posts=posts)
    except Exception as e:
        print(f"Error fetching data for homepage: {e}")
        return render_template('index.html', recent_posts=[])

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

        return render_template('programs/doctalks.html', courses=courses, blog_posts=blog_posts)
    except Exception as e:
        print(f"Error fetching doctalks courses: {e}")
        return render_template('programs/doctalks.html', courses=[], blog_posts=[])

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

        return render_template('programs/denttalks.html', courses=courses, blog_posts=blog_posts)
    except Exception as e:
        print(f"Error fetching denttalks courses: {e}")
        return render_template('programs/denttalks.html', courses=[], blog_posts=[])

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

        return render_template('programs/nursetalks.html', courses=courses, blog_posts=blog_posts)
    except Exception as e:
        print(f"Error fetching nursetalks courses: {e}")
        return render_template('programs/nursetalks.html', courses=[], blog_posts=[])

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

        return render_template('programs/pharmatalks.html', courses=courses, blog_posts=blog_posts)
    except Exception as e:
        print(f"Error fetching pharmatalks courses: {e}")
        return render_template('programs/pharmatalks.html', courses=[], blog_posts=[])

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
    return render_template('products/dr-meddy.html')

@app.route('/products/mr-brown')
def mr_brown():
    return render_template('products/mr-brown.html')

@app.route('/products/oet-agents')
def oet_agents():
    return render_template('products/oet-agents.html')

@app.route('/products/coursebooks')
def coursebooks():
    return render_template('products/coursebooks.html')

@app.route('/partnerships')
def partnerships():
    return render_template('partnerships.html')

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

@app.route('/api/partnership/request', methods=['POST'])
def partnership_request():
    try:
        data = request.get_json()
        
        partnership_data = {
            'organization_name': data.get('organization_name'),
            'contact_person': data.get('contact_person'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'partnership_type': data.get('partnership_type'),
            'message': data.get('message'),
            'submitted_at': firestore.SERVER_TIMESTAMP,
            'status': 'new'
        }
        
        db.collection('partnership_requests').add(partnership_data)
        
        return jsonify({'success': True, 'message': 'Partnership request submitted successfully!'}), 200
    except Exception as e:
        print(f"Error submitting partnership request: {e}")
        return jsonify({'success': False, 'message': 'An error occurred. Please try again.'}), 500

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