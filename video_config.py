"""
Video CDN URL config — reads Firebase Storage URLs from environment variables.
Import get_video_urls() and pass the result into render_template() calls.
"""

import os


def get_video_urls():
    """
    Returns a dict of all CDN video URLs from environment variables.
    Use this in every Flask route that renders a template with video.

    Usage in app.py:
        from video_config import get_video_urls

        @app.route('/')
        def index():
            return render_template('index.html', **get_video_urls())
    """
    return {
        'video_dr_meddy_url':      os.environ.get('VIDEO_DR_MEDDY_URL', ''),
        'video_recording_url':     os.environ.get('VIDEO_RECORDING_URL', ''),
        'video_sample1_url':       os.environ.get('VIDEO_SAMPLE1_URL', ''),
        'video_sample2_url':       os.environ.get('VIDEO_SAMPLE2_URL', ''),
        'video_sample3_url':       os.environ.get('VIDEO_SAMPLE3_URL', ''),
        'video_medtalk_intro_url': os.environ.get('VIDEO_MEDTALK_INTRO_URL', ''),
    }