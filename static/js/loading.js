// Page Loading Controller
const PageLoader = {
    loader: null,

    init: function() {
        this.loader = document.getElementById('page-loader');
    },

    show: function() {
        if (this.loader) {
            this.loader.classList.add('active');
        }
    },

    hide: function() {
        if (this.loader) {
            this.loader.classList.remove('active');
        }
    }
};

// Initialize loader immediately
PageLoader.init = function() {
    PageLoader.loader = document.getElementById('page-loader');
};

// Run init as soon as possible
if (document.getElementById('page-loader')) {
    PageLoader.init();
}

// Hide loader only when everything is fully loaded (images, styles, etc.)
// Also wait for language translation if needed
window.addEventListener('load', function() {
    PageLoader.init();

    // Check if there's a saved language preference
    var savedLang = localStorage.getItem('preferredLanguage');

    if (savedLang && savedLang !== 'en') {
        // Wait longer for translation to apply
        setTimeout(function() {
            PageLoader.hide();
        }, 1200);
    } else {
        // No translation needed, hide after short delay
        setTimeout(function() {
            PageLoader.hide();
        }, 300);
    }
});

// Show loader on internal link clicks (page navigation)
document.addEventListener('DOMContentLoaded', function() {
    PageLoader.init();

    document.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Only show loader for internal navigation links
            if (href &&
                !href.startsWith('#') &&
                !href.startsWith('javascript:') &&
                !href.startsWith('mailto:') &&
                !href.startsWith('tel:') &&
                !this.hasAttribute('target')) {

                PageLoader.show();
            }
        });
    });
});

// Handle back/forward navigation
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Page loaded from cache
        var savedLang = localStorage.getItem('preferredLanguage');
        var delay = (savedLang && savedLang !== 'en') ? 1200 : 300;

        setTimeout(function() {
            PageLoader.hide();
        }, delay);
    }
});
