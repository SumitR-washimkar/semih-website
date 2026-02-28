// Scroll-driven video animation
(function() {
    const vUrl = document.querySelector('[data-video-url]')?.getAttribute('data-video-url') || '';
    if (!vUrl) { console.warn('No data-video-url found for scroll video'); return; }

    const totalFrames = 100;
    const canvas = document.getElementById('scroll-video-canvas');
    const ctx = canvas.getContext('2d');
    const frames = [];
    const v = document.createElement('video');

    v.src = vUrl;
    v.muted = true;
    v.preload = "metadata"; // ← Changed from "auto" — only loads metadata, not full video upfront

    async function init() {
        try {
            await new Promise(r => { v.onloadedmetadata = r; v.load(); });
            const dur = v.duration;

            for(let i = 0; i < totalFrames; i++) {
                v.currentTime = (dur / totalFrames) * i;
                await new Promise(r => {
                    const onSeek = () => {
                        v.removeEventListener('seeked', onSeek);
                        const temp = document.createElement('canvas');
                        temp.width = v.videoWidth;
                        temp.height = v.videoHeight;
                        temp.getContext('2d').drawImage(v, 0, 0);
                        frames.push(temp);
                        r();
                    };
                    v.addEventListener('seeked', onSeek);
                });
            }

            resize();
            updateScroll();
        } catch (e) {
            console.error('Scroll video error:', e);
        }
    }

    function draw(pct) {
        if (frames.length === 0) return;
        let idx = Math.floor(pct * (frames.length - 1));
        idx = Math.max(0, Math.min(idx, frames.length - 1));
        const img = frames[idx];
        const vArt = img.width / img.height;
        const cArt = canvas.width / canvas.height;
        let w, h, x, y;

        if (cArt > vArt) {
            w = canvas.width;
            h = canvas.width / vArt;
            x = 0;
            y = (canvas.height - h) / 2;
        } else {
            h = canvas.height;
            w = canvas.height * vArt;
            x = (canvas.width - w) / 2;
            y = 0;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, w, h);
    }

    function updateScroll() {
        if (frames.length === 0) return;

        const section = document.querySelector('.scroll-video-section');
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const scrollY = window.scrollY || window.pageYOffset;
        const windowHeight = window.innerHeight;

        const scrollStart = sectionTop;
        const scrollEnd = sectionTop + sectionHeight - windowHeight;

        let progress = 0;
        if (scrollY >= scrollStart && scrollY <= scrollEnd) {
            progress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
        } else if (scrollY > scrollEnd) {
            progress = 1;
        }

        draw(Math.max(0, Math.min(1, progress)));

        const title = document.querySelector('.scroll-video-title');
        const descriptions = document.querySelectorAll('.scroll-video-description');

        if (title) {
            if (progress >= 0.25) {
                title.classList.add('visible');
            } else {
                title.classList.remove('visible');
            }
        }

        if (descriptions[0]) {
            if (progress >= 0.35) {
                descriptions[0].classList.add('visible');
            } else {
                descriptions[0].classList.remove('visible');
            }
        }

        if (descriptions[1]) {
            if (progress >= 0.45) {
                descriptions[1].classList.add('visible');
            } else {
                descriptions[1].classList.remove('visible');
            }
        }

        if (progress > 0.75) {
            if (title) title.classList.remove('visible');
            descriptions.forEach(desc => desc.classList.remove('visible'));
        }
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        updateScroll();
    }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', () => requestAnimationFrame(updateScroll));

    resize();
    init();
})();