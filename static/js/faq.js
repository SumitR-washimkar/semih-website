// FAQ Accordion Functionality
// References main.css for theme colors and animations

/**
 * Initialize FAQ accordion
 * Handles click events on FAQ question buttons to expand/collapse answers
 */
function initFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    if (faqQuestions.length === 0) {
        console.warn('No FAQ questions found on this page');
        return;
    }

    faqQuestions.forEach(button => {
        button.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // Toggle the clicked item (open if it was closed, close if it was open)
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

/**
 * Open a specific FAQ item by index
 * @param {number} index - Zero-based index of the FAQ item to open
 */
function openFAQItem(index) {
    const faqItems = document.querySelectorAll('.faq-item');

    if (index >= 0 && index < faqItems.length) {
        // Close all items first
        faqItems.forEach(item => item.classList.remove('active'));

        // Open the specified item
        faqItems[index].classList.add('active');

        // Scroll to the item
        faqItems[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Close all FAQ items
 */
function closeAllFAQItems() {
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFAQAccordion);
} else {
    // DOM is already loaded
    initFAQAccordion();
}

// Export functions for external use (optional)
window.FAQAccordion = {
    init: initFAQAccordion,
    openItem: openFAQItem,
    closeAll: closeAllFAQItems
};
