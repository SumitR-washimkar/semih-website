"""
Courses module for fetching and managing course data from Firebase Firestore.
"""

_db = None


def set_db(client):
    """Set the Firestore database client."""
    global _db
    _db = client


def get_db():
    """Get Firestore database client."""
    return _db


def get_all_courses(status='published'):
    """
    Fetch all courses from the database.

    Args:
        status: Filter courses by status (default: 'published')

    Returns:
        List of course dictionaries with all course data including sections and lessons
    """
    try:
        db = get_db()
        courses_ref = db.collection('courses').where('status', '==', status)
        courses = []
        
        for doc in courses_ref.stream():
            course_data = doc.to_dict()
            course_data['id'] = doc.id
            
            # Process sections and lessons
            course_data = _process_course_data(course_data)
            courses.append(course_data)
        
        return courses
    except Exception as e:
        print(f"Error fetching all courses: {e}")
        return []


def get_courses_by_category(category, status='published'):
    """
    Fetch courses filtered by category.
    
    Args:
        category: The category to filter by (e.g., 'denttalks', 'doctalks', 'nursetalks', 'pharmatalks')
        status: Filter courses by status (default: 'published')
    
    Returns:
        List of course dictionaries matching the category
    """
    try:
        db = get_db()
        courses_ref = db.collection('courses')\
            .where('category', '==', category)\
            .where('status', '==', status)
        
        courses = []
        
        for doc in courses_ref.stream():
            course_data = doc.to_dict()
            course_data['id'] = doc.id
            
            # Process sections and lessons
            course_data = _process_course_data(course_data)
            courses.append(course_data)
        
        return courses
    except Exception as e:
        print(f"Error fetching courses by category '{category}': {e}")
        return []


def get_course_by_id(course_id):
    """
    Fetch a single course by its ID.
    
    Args:
        course_id: The document ID of the course
    
    Returns:
        Course dictionary or None if not found
    """
    try:
        db = get_db()
        doc = db.collection('courses').document(course_id).get()
        
        if doc.exists:
            course_data = doc.to_dict()
            course_data['id'] = doc.id
            course_data = _process_course_data(course_data)
            return course_data
        
        return None
    except Exception as e:
        print(f"Error fetching course by ID '{course_id}': {e}")
        return None


def _process_course_data(course_data):
    """
    Process course data to ensure consistent structure and calculate derived values.
    
    Args:
        course_data: Raw course dictionary from Firestore
    
    Returns:
        Processed course dictionary
    """
    # Ensure sections exist and are properly structured
    sections = course_data.get('sections', [])
    
    if sections:
        processed_sections = []
        total_lessons = 0
        total_duration_minutes = 0
        
        for section in sections:
            processed_section = {
                'title': section.get('title', 'Untitled Section'),
                'lessons': []
            }
            
            lessons = section.get('lessons', [])
            for lesson in lessons:
                processed_lesson = {
                    'title': lesson.get('title', ''),
                    'duration': lesson.get('duration', '0'),
                    'is_preview': lesson.get('is_preview', False),
                    'video_url': lesson.get('video_url', '')
                }
                processed_section['lessons'].append(processed_lesson)
                total_lessons += 1
                
                # Calculate total duration
                try:
                    duration_minutes = int(lesson.get('duration', '0'))
                    total_duration_minutes += duration_minutes
                except (ValueError, TypeError):
                    pass
            
            processed_sections.append(processed_section)
        
        course_data['sections'] = processed_sections
        course_data['total_lessons'] = total_lessons
        course_data['total_duration_minutes'] = total_duration_minutes
        course_data['total_sections'] = len(processed_sections)
    else:
        course_data['sections'] = []
        course_data['total_lessons'] = 0
        course_data['total_duration_minutes'] = 0
        course_data['total_sections'] = 0
    
    # Ensure other fields have default values
    course_data.setdefault('title', 'Untitled Course')
    course_data.setdefault('description', '')
    course_data.setdefault('thumbnail', '')
    course_data.setdefault('instructor_name', '')
    course_data.setdefault('instructor_description', '')
    course_data.setdefault('instructor_photo_url', '')
    course_data.setdefault('actual_price', 0)
    course_data.setdefault('discounted_price', 0)
    course_data.setdefault('discount_percentage', 0)
    course_data.setdefault('duration_hours', 0)
    course_data.setdefault('level', 'beginner')
    course_data.setdefault('prerequisites', '')
    course_data.setdefault('is_free', False)
    course_data.setdefault('enrolled_count', 0)
    course_data.setdefault('category', '')
    course_data.setdefault('availability', 'active')
    
    return course_data


def get_course_stats(course_data):
    """
    Get formatted statistics for a course.
    
    Args:
        course_data: Processed course dictionary
    
    Returns:
        Dictionary with formatted stats
    """
    # Get duration_hours directly from course data (already in hours)
    duration_hours = course_data.get('duration_hours', 0)
    
    # Format duration display
    try:
        hours = int(duration_hours)
        if hours > 0:
            duration_formatted = f"{hours}h"
        else:
            duration_formatted = "0h"
    except (ValueError, TypeError):
        duration_formatted = "0h"
    
    return {
        'total_sections': course_data.get('total_sections', 0),
        'total_lessons': course_data.get('total_lessons', 0),
        'total_duration_formatted': duration_formatted,
        'duration_hours': duration_hours,
        'enrolled_count': course_data.get('enrolled_count', 0),
        'level': course_data.get('level', 'beginner').capitalize()
    }


def format_price(price):
    """
    Format price for display in USD.
    
    Args:
        price: Numeric price value
    
    Returns:
        Formatted price string in USD
    """
    try:
        return f"${int(price):,}"
    except (ValueError, TypeError):
        return "$0"
