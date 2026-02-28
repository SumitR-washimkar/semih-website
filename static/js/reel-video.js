// Reel Video Carousel with Infinite Scroll (Instagram Reels style)
document.addEventListener('DOMContentLoaded', function () {
    const reelCarousel = document.querySelector('.reel-carousel');
    const reelItems = document.querySelectorAll('.reel-item');
    const muteIndicator = document.querySelector('.reel-mute-indicator');
    const muteIcon = document.querySelector('.mute-icon');
    const unmuteIcon = document.querySelector('.unmute-icon');
    const statusTime = document.querySelector('.status-time');

    let currentIndex = 0; // Start at index 0 (medtalk intro)
    let startY = 0;
    let isDragging = false;
    let isMuted = true;
    const totalReels = reelItems.length; // 3 videos total

    console.log('Total reels:', totalReels);

    // Update time dynamically
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

    // Update reel positions and playback
    function updateReels(direction) {
        console.log('Current index:', currentIndex, 'Direction:', direction);

        var incomingItem = reelItems[currentIndex];
        var incomingVideo = incomingItem.querySelector('.reel-video');

        // Step 1: Remove all classes from ALL items and pause non-active videos
        reelItems.forEach((item, index) => {
            var video = item.querySelector('.reel-video');
            item.classList.remove('active', 'slide-up', 'slide-down', 'next-waiting', 'prev-waiting');
            if (index !== currentIndex) {
                video.pause();
                video.currentTime = 0; // Reset video to start
            }
        });

        if (direction) {
            // Step 2: Disable transition on incoming item, position it offscreen on correct side
            incomingItem.style.transition = 'none';

            if (direction === 'down') {
                // Video should come from BOTTOM → slide up into view
                incomingItem.style.transform = 'translateY(100%)';
                incomingItem.style.opacity = '1';
            } else if (direction === 'up') {
                // Video should come from TOP → slide down into view
                incomingItem.style.transform = 'translateY(-100%)';
                incomingItem.style.opacity = '1';
            }

            // Step 3: Force browser reflow so the position is applied instantly
            void incomingItem.offsetHeight;

            // Step 4: Re-enable transition
            incomingItem.style.transition = '';

            // Step 5: Move old videos to exit position
            reelItems.forEach((item, index) => {
                if (index !== currentIndex) {
                    if (direction === 'down') {
                        // Old video exits to TOP
                        item.classList.add('slide-up');
                    } else if (direction === 'up') {
                        // Old video exits to BOTTOM
                        item.classList.add('slide-down');
                    }
                }
            });
        }

        // Step 6: Add active class to incoming video (triggers slide to translateY(0))
        incomingItem.classList.add('active');
        incomingItem.style.transform = '';
        incomingItem.style.opacity = '';
        incomingVideo.play().catch(() => { });
    }

    // Navigate to next or previous reel
    function scrollReel(direction) {
        // Disable scroll on mobile devices (Instagram style: only one video on mobile)
        if (window.innerWidth < 768) {
            return;
        }

        if (direction === 'up') {
            // Scroll up = next video (index increases)
            // 0 → 1 → 2 → 0 (wrap around)
            currentIndex = (currentIndex + 1) % totalReels;
            updateReels('down'); // New video comes from bottom (slides down-to-up)
        } else if (direction === 'down') {
            // Scroll down = previous video (index decreases)
            // 2 → 1 → 0 → 2 (wrap around)
            currentIndex = (currentIndex - 1 + totalReels) % totalReels;
            updateReels('up'); // New video comes from top (slides up-to-down)
        }
    }

    // Mouse/Touch events for scrolling
    if (reelCarousel) {
        // Mouse events
        reelCarousel.addEventListener('mousedown', function (e) {
            startY = e.clientY;
            isDragging = false;
        });

        reelCarousel.addEventListener('mousemove', function (e) {
            if (startY === 0) return;
            const diff = Math.abs(startY - e.clientY);
            if (diff > 10) {
                isDragging = true;
            }
        });

        reelCarousel.addEventListener('mouseup', function (e) {
            if (!isDragging && startY !== 0) {
                handleVideoClick();
            } else if (isDragging) {
                const diff = startY - e.clientY;
                if (diff > 50) {
                    // Dragged up → scroll up → next video
                    scrollReel('up');
                } else if (diff < -50) {
                    // Dragged down → scroll down → previous video
                    scrollReel('down');
                }
            }
            startY = 0;
            isDragging = false;
        });

        reelCarousel.addEventListener('mouseleave', function () {
            startY = 0;
            isDragging = false;
        });

        // Touch events
        reelCarousel.addEventListener('touchstart', function (e) {
            startY = e.touches[0].clientY;
            isDragging = false;
        }, { passive: true });

        reelCarousel.addEventListener('touchmove', function (e) {
            if (startY === 0) return;

            // Skip drag detection on mobile to allow vertical page scroll
            if (window.innerWidth < 768) return;

            const diff = Math.abs(startY - e.touches[0].clientY);
            if (diff > 10) {
                isDragging = true;
            }
        }, { passive: true });

        reelCarousel.addEventListener('touchend', function (e) {
            if (!isDragging && startY !== 0) {
                handleVideoClick();
            } else if (isDragging && window.innerWidth >= 768) {
                const diff = startY - e.changedTouches[0].clientY;
                if (diff > 50) {
                    // Swiped up → scroll up → next video
                    scrollReel('up');
                } else if (diff < -50) {
                    // Swiped down → scroll down → previous video
                    scrollReel('down');
                }
            }
            startY = 0;
            isDragging = false;
        }, { passive: true });

        // Wheel event for desktop scrolling
        let wheelTimeout;
        let isScrolling = false;

        reelCarousel.addEventListener('wheel', function (e) {
            if (window.innerWidth < 768) return;
            e.preventDefault();

            if (isScrolling) return;

            if (e.deltaY > 30) {
                // Wheel down → scroll up → next video
                isScrolling = true;
                scrollReel('up');
                setTimeout(() => { isScrolling = false; }, 500);
            } else if (e.deltaY < -30) {
                // Wheel up → scroll down → previous video
                isScrolling = true;
                scrollReel('down');
                setTimeout(() => { isScrolling = false; }, 500);
            }
        }, { passive: false });
    }

    // Handle mute/unmute on click/tap
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

    // Initialize - start with index 0
    updateReels(null);
    console.log('Initialized with index 0');
});
