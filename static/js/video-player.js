/**
 * Inline Video Player
 * Plays video within the hero card frame instead of a popup overlay
 */

(function() {
    'use strict';

    function initVideoPlayer() {
        const playButton = document.querySelector('.play-button');
        const heroVideo = document.getElementById('hero-thumbnail');
        const studentImageCard = document.querySelector('.hero-image-card.student-image');

        if (!playButton || !heroVideo || !studentImageCard) {
            console.warn('Video player elements not found');
            return;
        }

        let isPlaying = false;

        // Play video inline when play button is clicked
        playButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!isPlaying) {
                // Start playing inline — no native controls
                heroVideo.muted = false;
                heroVideo.style.pointerEvents = 'auto';
                heroVideo.play();
                playButton.style.opacity = '0';
                playButton.style.pointerEvents = 'none';
                studentImageCard.classList.add('video-playing');
                isPlaying = true;
            }
        });

        // Click on video to pause/resume
        heroVideo.addEventListener('click', function(e) {
            e.preventDefault();
            if (isPlaying) {
                heroVideo.pause();
                playButton.style.opacity = '1';
                playButton.style.pointerEvents = 'auto';
                isPlaying = false;
            } else {
                heroVideo.play();
                playButton.style.opacity = '0';
                playButton.style.pointerEvents = 'none';
                isPlaying = true;
            }
        });

        // When video ends, show the play button again
        heroVideo.addEventListener('ended', function() {
            heroVideo.muted = true;
            heroVideo.style.pointerEvents = 'none';
            heroVideo.currentTime = 0.5;
            playButton.style.opacity = '1';
            playButton.style.pointerEvents = 'auto';
            studentImageCard.classList.remove('video-playing');
            isPlaying = false;
        });

        // Prevent video context menu
        heroVideo.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVideoPlayer);
    } else {
        initVideoPlayer();
    }

})();
