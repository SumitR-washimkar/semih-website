// DocTALKS Interactions
document.addEventListener('DOMContentLoaded', function () {

    // Donut chart animation on scroll
    var factorsSection = document.getElementById('doc-factors-section');
    if (factorsSection) {
        var donutAnimated = false;
        var donutObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !donutAnimated) {
                    donutAnimated = true;
                    var segments = factorsSection.querySelectorAll('.donut-segment');
                    segments.forEach(function (seg) {
                        var dash = seg.getAttribute('data-dash');
                        if (dash) {
                            seg.setAttribute('stroke-dasharray', dash);
                        }
                    });
                }
            });
        }, { threshold: 0.3 });
        donutObserver.observe(factorsSection);
    }

    // Earnings bar chart animation on scroll
    var earningsSection = document.getElementById('doc-earnings-section');
    if (earningsSection) {
        var barAnimated = false;
        var barObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !barAnimated) {
                    barAnimated = true;
                    var bars = earningsSection.querySelectorAll('.chart-bar');
                    var values = earningsSection.querySelectorAll('.chart-bar-value');
                    bars.forEach(function (bar) {
                        var height = bar.getAttribute('data-height');
                        bar.style.height = height + '%';
                    });
                    values.forEach(function (val) {
                        val.classList.add('visible');
                    });
                }
            });
        }, { threshold: 0.3 });
        barObserver.observe(earningsSection);
    }

});
