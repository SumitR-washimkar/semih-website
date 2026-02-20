// ===== iPhone Reels Carousel - Standalone JS =====
// 
// ⬇️ CONFIGURE YOUR VIDEO PATHS HERE ⬇️
// Add your video file paths/URLs to this array.
// Each entry corresponds to a reel-item in the HTML (index 0, 1, 2, etc.)
//
const VIDEO_PATHS = [
    'https://firebasestorage.googleapis.com/v0/b/admin-dashboard-d5f22.firebasestorage.app/o/website%2Fmedtalk%20intro.mp4?alt=media&token=2e2dcb19-193e-46ea-a296-81fdf3f64680',   // Reel 1 (index 0)
    'https://firebasestorage.googleapis.com/v0/b/admin-dashboard-d5f22.firebasestorage.app/o/website%2FSample%201.mp4?alt=media&token=de0aef08-ad07-4dff-ac4f-42d5336a75ae',        // Reel 2 (index 1)
    'https://firebasestorage.googleapis.com/v0/b/admin-dashboard-d5f22.firebasestorage.app/o/website%2FSample%202.mp4?alt=media&token=8a335fc4-c8bc-4fce-b630-5b377f73eb68',        // Reel 3 (index 2)
];

document.addEventListener('DOMContentLoaded', function() {
    const reelCarousel = document.querySelector('.reel-carousel');
    const reelItems = document.querySelectorAll('.reel-item');
    const muteIndicator = document.querySelector('.reel-mute-indicator');
    const muteIcon = document.querySelector('.mute-icon');
    const unmuteIcon = document.querySelector('.unmute-icon');
    const statusTime = document.querySelector('.status-time');

    let currentIndex = 0;
    let startY = 0;
    let isDragging = false;
    let isMuted = true;
    const totalReels = reelItems.length;

    // ===== Load video sources from VIDEO_PATHS array =====
    reelItems.forEach((item, index) => {
        const video = item.querySelector('.reel-video');
        if (video && VIDEO_PATHS[index]) {
            // Remove existing sources
            while (video.firstChild) {
                video.removeChild(video.firstChild);
            }
            // Create new source element
            const source = document.createElement('source');
            source.src = VIDEO_PATHS[index];
            source.type = 'video/mp4';
            video.appendChild(source);
            video.load();
        }
    });

    // ===== Update time dynamically =====
    function updateTime() {
        if (statusTime) {
            const now = new Date();
            let hours = now.getHours();
            let minutes = now.getMinutes();

            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0' + minutes : minutes;

            statusTime.textContent = hours + ':' + minutes;
        }
    }

    updateTime();
    setInterval(updateTime, 1000);

    // ===== Update reel positions and playback =====
    function updateReels(direction) {
        var incomingItem = reelItems[currentIndex];
        var incomingVideo = incomingItem.querySelector('.reel-video');

        // Step 1: Remove all classes from ALL items and pause non-active videos
        reelItems.forEach((item, index) => {
            var video = item.querySelector('.reel-video');
            item.classList.remove('active', 'slide-up', 'slide-down', 'next-waiting', 'prev-waiting');
            if (index !== currentIndex) {
                video.pause();
                video.currentTime = 0;
            }
        });

        if (direction) {
            // Step 2: Disable transition on incoming item, position it offscreen
            incomingItem.style.transition = 'none';

            if (direction === 'down') {
                // Video comes from BOTTOM → slides up into view
                incomingItem.style.transform = 'translateY(100%)';
                incomingItem.style.opacity = '1';
            } else if (direction === 'up') {
                // Video comes from TOP → slides down into view
                incomingItem.style.transform = 'translateY(-100%)';
                incomingItem.style.opacity = '1';
            }

            // Step 3: Force browser reflow
            void incomingItem.offsetHeight;

            // Step 4: Re-enable transition
            incomingItem.style.transition = '';

            // Step 5: Move old videos to exit position
            reelItems.forEach((item, index) => {
                if (index !== currentIndex) {
                    if (direction === 'down') {
                        item.classList.add('slide-up');
                    } else if (direction === 'up') {
                        item.classList.add('slide-down');
                    }
                }
            });
        }

        // Step 6: Activate incoming video
        incomingItem.classList.add('active');
        incomingItem.style.transform = '';
        incomingItem.style.opacity = '';
        incomingVideo.play().catch(() => {});
    }

    // ===== Navigate to next or previous reel =====
    function scrollReel(direction) {
        if (direction === 'up') {
            // Scroll up = next video
            currentIndex = (currentIndex + 1) % totalReels;
            updateReels('down');
        } else if (direction === 'down') {
            // Scroll down = previous video
            currentIndex = (currentIndex - 1 + totalReels) % totalReels;
            updateReels('up');
        }
    }

    // ===== Mouse/Touch/Wheel Events =====
    if (reelCarousel) {
        // Mouse events
        reelCarousel.addEventListener('mousedown', function(e) {
            startY = e.clientY;
            isDragging = false;
        });

        reelCarousel.addEventListener('mousemove', function(e) {
            if (startY === 0) return;
            const diff = Math.abs(startY - e.clientY);
            if (diff > 10) {
                isDragging = true;
            }
        });

        reelCarousel.addEventListener('mouseup', function(e) {
            if (!isDragging && startY !== 0) {
                handleVideoClick();
            } else if (isDragging) {
                const diff = startY - e.clientY;
                if (diff > 50) {
                    scrollReel('up');
                } else if (diff < -50) {
                    scrollReel('down');
                }
            }
            startY = 0;
            isDragging = false;
        });

        reelCarousel.addEventListener('mouseleave', function() {
            startY = 0;
            isDragging = false;
        });

        // Touch events
        reelCarousel.addEventListener('touchstart', function(e) {
            startY = e.touches[0].clientY;
            isDragging = false;
        }, { passive: true });

        reelCarousel.addEventListener('touchmove', function(e) {
            if (startY === 0) return;
            const diff = Math.abs(startY - e.touches[0].clientY);
            if (diff > 10) {
                isDragging = true;
            }
        }, { passive: true });

        reelCarousel.addEventListener('touchend', function(e) {
            if (!isDragging && startY !== 0) {
                handleVideoClick();
            } else if (isDragging) {
                const diff = startY - e.changedTouches[0].clientY;
                if (diff > 50) {
                    scrollReel('up');
                } else if (diff < -50) {
                    scrollReel('down');
                }
            }
            startY = 0;
            isDragging = false;
        }, { passive: true });

        // Wheel event for desktop scrolling
        let isScrolling = false;

        reelCarousel.addEventListener('wheel', function(e) {
            e.preventDefault();

            if (isScrolling) return;

            if (e.deltaY > 30) {
                isScrolling = true;
                scrollReel('up');
                setTimeout(() => { isScrolling = false; }, 500);
            } else if (e.deltaY < -30) {
                isScrolling = true;
                scrollReel('down');
                setTimeout(() => { isScrolling = false; }, 500);
            }
        }, { passive: false });
    }

    // ===== Mute/Unmute on click/tap =====
    function handleVideoClick() {
        if (isMuted) {
            reelItems.forEach(item => {
                item.querySelector('.reel-video').muted = false;
            });
            isMuted = false;
            muteIcon.style.display = 'none';
            unmuteIcon.style.display = 'block';
        } else {
            reelItems.forEach(item => {
                item.querySelector('.reel-video').muted = true;
            });
            isMuted = true;
            muteIcon.style.display = 'block';
            unmuteIcon.style.display = 'none';
        }

        if (muteIndicator) {
            muteIndicator.classList.remove('show');
            void muteIndicator.offsetWidth;
            muteIndicator.classList.add('show');
        }
    }

    // ===== Initialize - start with index 0 =====
    updateReels(null);
});
