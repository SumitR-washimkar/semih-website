document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });

    const forms = document.querySelectorAll('form:not(#contactForm)');
    forms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            });

            if (isValid) {
                console.log('Form is valid, ready to submit');
                form.submit();
            }
        });
    });

    // Handle clicking the "Courses" link in the footer
    const footerCoursesLink = document.getElementById('footer-courses-link');
    const headerCoursesDropdown = document.getElementById('header-courses');

    if (footerCoursesLink && headerCoursesDropdown) {
        footerCoursesLink.addEventListener('click', function (e) {
            e.preventDefault();

            // Since the header is fixed, we do not need to scroll to top. 
            // We just trigger the dropdown right where we are.
            const navLink = headerCoursesDropdown.querySelector('.nav-link');

            // On mobile, just trigger the active class
            if (window.innerWidth <= 768) {
                // Make sure mobile menu is open
                const navMenu = document.querySelector('.nav-menu');
                const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
                if (navMenu && !navMenu.classList.contains('active')) {
                    navMenu.classList.add('active');
                    mobileMenuToggle.classList.add('active');
                }

                // Open the dropdown
                if (!headerCoursesDropdown.classList.contains('active')) {
                    headerCoursesDropdown.classList.add('active');
                    if (navLink) navLink.classList.add('active');
                }
            } else {
                // On desktop, add the active class to force the hover effect through CSS
                headerCoursesDropdown.classList.add('active');
                if (navLink) navLink.classList.add('active');

                // Click anywhere else to close it
                const closeDropdown = function (evt) {
                    if (!headerCoursesDropdown.contains(evt.target) && evt.target !== footerCoursesLink) {
                        headerCoursesDropdown.classList.remove('active');
                        if (navLink) navLink.classList.remove('active');
                        document.removeEventListener('click', closeDropdown);
                    }
                };

                // Small delay to prevent immediate closing from the current click
                setTimeout(() => {
                    document.addEventListener('click', closeDropdown);
                }, 50);
            }
        });
    }
});



let resizeTimer;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        if (window.innerWidth > 768) {
            document.querySelector('.nav-menu')?.classList.remove('active');
            document.querySelector('.mobile-menu-toggle')?.classList.remove('active');
        }
    }, 250);
});