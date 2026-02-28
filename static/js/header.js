// Mobile Menu Toggle Functionality
document.addEventListener('DOMContentLoaded', function () {
    console.log('Header JS loaded');

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const header = document.querySelector('.header');

    if (mobileMenuToggle && navMenu) {
        // Toggle mobile menu
        mobileMenuToggle.addEventListener('click', function (e) {
            e.preventDefault();
            const isOpen = navMenu.classList.contains('active');

            if (isOpen) {
                // Close menu
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                // Open menu
                navMenu.classList.add('active');
                mobileMenuToggle.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });

        // Handle dropdown toggles
        const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
        console.log('Found dropdown items:', dropdownItems.length);

        function isMobile() {
            return window.innerWidth <= 768;
        }

        dropdownItems.forEach((item, index) => {
            const link = item.querySelector('.nav-link');

            if (link) {
                link.addEventListener('click', function (e) {
                    if (isMobile()) {
                        e.preventDefault();
                        e.stopPropagation();

                        const isCurrentlyActive = item.classList.contains('active');

                        // Close all other dropdowns
                        dropdownItems.forEach(otherItem => {
                            if (otherItem !== item) {
                                otherItem.classList.remove('active');
                            }
                        });

                        // Toggle current dropdown
                        if (isCurrentlyActive) {
                            item.classList.remove('active');
                        } else {
                            item.classList.add('active');
                        }
                    } else if (link.getAttribute('href') === '#') {
                        // Desktop but dummy link: just prevent scroll jump, do nothing else
                        e.preventDefault();
                    }
                });
            }
        });

        // Handle window resize to close dropdowns when switching to desktop
        let resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (!isMobile()) {
                    dropdownItems.forEach(item => {
                        item.classList.remove('active');
                    });
                }
            }, 250);
        });

        // Close menu when clicking on a regular nav link
        const navLinks = document.querySelectorAll('.nav-item:not(.dropdown) .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                if (isMobile()) {
                    navMenu.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        // Close menu when clicking on a dropdown item
        const dropdownLinks = document.querySelectorAll('.dropdown-link');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                if (isMobile()) {
                    navMenu.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                    document.body.style.overflow = '';
                    // Close all dropdowns
                    dropdownItems.forEach(item => {
                        item.classList.remove('active');
                    });
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (event) {
            const isClickInsideMenu = navMenu.contains(event.target);
            const isClickOnToggle = mobileMenuToggle.contains(event.target);

            if (!isClickInsideMenu && !isClickOnToggle && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Header scroll effect (optional - adds shadow on scroll)
    if (header) {
        let lastScroll = 0;
        window.addEventListener('scroll', function () {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        });
    }
});
