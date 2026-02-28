/**
 * Professional Scroll Animations
 * Handles animation triggers when elements enter the viewport
 */

(function() {
    'use strict';

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // If user prefers reduced motion, add 'animated' class immediately to all elements
        document.addEventListener('DOMContentLoaded', function() {
            const animatedElements = document.querySelectorAll(
                '.animate-element, .animate-fade, .animate-slide-up, .animate-text, ' +
                '.animate-slide-left, .animate-slide-right, .animate-scale, .animate-card, ' +
                '.animate-stagger-container, .animate-grid, .hero-section'
            );
            animatedElements.forEach(function(element) {
                element.classList.add('animated');
            });
        });
        return;
    }

    // Configuration for Intersection Observer
    const config = {
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: '0px 0px -150px 0px' // Trigger 150px before element enters viewport
    };

    // Intersection Observer callback
    function handleIntersection(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                // Add 'animated' class when element enters viewport
                entry.target.classList.add('animated');

                // Stop observing this element (animate only once)
                observer.unobserve(entry.target);
            }
        });
    }

    // Initialize animations when DOM is ready
    function initScrollAnimations() {
        // Create Intersection Observer
        const observer = new IntersectionObserver(handleIntersection, config);

        // Select all elements with animation classes
        const animationSelectors = [
            '.animate-element',
            '.animate-fade',
            '.animate-slide-up',
            '.animate-text',
            '.animate-slide-left',
            '.animate-slide-right',
            '.animate-scale',
            '.animate-card',
            '.animate-stagger-container',
            '.animate-grid',
            '.hero-section'
        ];

        const animatedElements = document.querySelectorAll(animationSelectors.join(', '));

        // Observe each element
        animatedElements.forEach(function(element) {
            observer.observe(element);
        });

        // Special handling for hero section - animate immediately if at top of page
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && window.scrollY < 100) {
            setTimeout(function() {
                heroSection.classList.add('animated');
            }, 150);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
        initScrollAnimations();
    }

    // Expose function globally for dynamic content
    window.initScrollAnimations = initScrollAnimations;

})();
