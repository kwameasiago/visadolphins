/**
 * Visa Dolphins — Main JavaScript
 * Handles: mobile menu, tabs, accordion, scroll animations, sticky header
 */

(function () {
    'use strict';

    // ===========================
    // Include Loader — injects shared header/footer
    // ===========================
    function loadInclude(elementId, filePath) {
        const el = document.getElementById(elementId);
        if (!el) return Promise.resolve();
        return fetch(filePath)
            .then(function (res) { return res.text(); })
            .then(function (html) { el.innerHTML = html; })
            .catch(function (err) { console.warn('Include load failed:', filePath, err); });
    }

    Promise.all([
        loadInclude('site-header', '/includes/header.html'),
        loadInclude('site-footer', '/includes/footer.html')
    ]).then(initPage);

    function initPage() {

    // ===========================
    // Mobile Menu Toggle
    // ===========================
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function () {
            const isOpen = mainNav.classList.toggle('open');
            menuToggle.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close menu when a nav link is clicked
        const navLinks = mainNav.querySelectorAll('.nav-link');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                mainNav.classList.remove('open');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // ===========================
    // Hero Tabs
    // ===========================
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            tabButtons.forEach(function (b) {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
        });
    });

    // ===========================
    // Accordion
    // ===========================
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(function (header) {
        header.addEventListener('click', function (e) {
            // Don't toggle if clicking on the "Book Details" button
            if (e.target.closest('.btn')) return;

            const item = header.closest('.accordion-item');
            const isOpen = item.classList.contains('open');

            // Close all items
            document.querySelectorAll('.accordion-item').forEach(function (i) {
                i.classList.remove('open');
                i.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
            });

            // Open clicked item if it was closed
            if (!isOpen) {
                item.classList.add('open');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // ===========================
    // Sticky Header Enhancement
    // ===========================
    const siteHeader = document.getElementById('site-header');
    let lastScroll = 0;

    window.addEventListener('scroll', function () {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            siteHeader.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
        } else {
            siteHeader.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    }, { passive: true });

    // ===========================
    // Scroll-based Animations (Intersection Observer)
    // ===========================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe service cards, partner cards, and accordion items
    const animateElements = document.querySelectorAll(
        '.service-card, .partner-card, .accordion-item'
    );

    animateElements.forEach(function (el) {
        observer.observe(el);
    });

    // ===========================
    // Active nav link on scroll
    // ===========================
    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav-link');

    function updateActiveNav() {
        const scrollPos = window.scrollY + 150;

        sections.forEach(function (section) {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navLinksAll.forEach(function (link) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });

    // ===========================
    // Contact Form (prevent default)
    // ===========================
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const inputs = contactForm.querySelectorAll('input');
            const name = inputs[0].value.trim();
            const email = inputs[1].value.trim();

            if (name && email) {
                alert('Thank you, ' + name + '! We will be in touch at ' + email + '.');
                contactForm.reset();
            }
        });
    }

    // ===========================
    // Modal (How to Pay)
    // ===========================
    var modalTriggers = document.querySelectorAll('[data-open-modal]');
    modalTriggers.forEach(function (trigger) {
        trigger.addEventListener('click', function () {
            var modalId = trigger.getAttribute('data-open-modal');
            var modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    var modalCloseButtons = document.querySelectorAll('[data-close-modal]');
    modalCloseButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var overlay = btn.closest('.modal-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    var overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(function (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // ===========================
    // Partners Carousel Scroll
    // ===========================
    var partnersCarousel = document.getElementById('partners-carousel');
    if (partnersCarousel) {
        var leftArrow = partnersCarousel.parentElement.querySelector('.partners-arrow--left');
        var rightArrow = partnersCarousel.parentElement.querySelector('.partners-arrow--right');
        var scrollAmount = 200;

        if (leftArrow) {
            leftArrow.addEventListener('click', function () {
                partnersCarousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
        }
        if (rightArrow) {
            rightArrow.addEventListener('click', function () {
                partnersCarousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }
    }

    // ===========================
    // Testimonials Slider
    // ===========================
    var slider = document.getElementById('testimonials-slider');
    if (slider) {
        var slides = slider.querySelectorAll('.testimonial-slide');
        var dotsContainer = document.getElementById('slider-dots');
        var prevBtn = slider.querySelector('.slider-btn--prev');
        var nextBtn = slider.querySelector('.slider-btn--next');
        var currentSlide = 0;
        var autoPlayInterval;

        // Create dots
        slides.forEach(function (_, i) {
            var dot = document.createElement('button');
            dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
            dot.addEventListener('click', function () { goToSlide(i); });
            dotsContainer.appendChild(dot);
        });

        function goToSlide(index) {
            slides[currentSlide].classList.remove('active');
            dotsContainer.children[currentSlide].classList.remove('active');
            currentSlide = (index + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
            dotsContainer.children[currentSlide].classList.add('active');
        }

        prevBtn.addEventListener('click', function () {
            goToSlide(currentSlide - 1);
            resetAutoPlay();
        });

        nextBtn.addEventListener('click', function () {
            goToSlide(currentSlide + 1);
            resetAutoPlay();
        });

        function startAutoPlay() {
            autoPlayInterval = setInterval(function () {
                goToSlide(currentSlide + 1);
            }, 5000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

        startAutoPlay();
    }

    // ===========================
    // Athlete Detail Page Renderer
    // ===========================
    var athleteDetailContainer = document.getElementById('athlete-detail-content');
    if (athleteDetailContainer) {
        var athleteData = {
            hussein: {
                name: 'Hussein',
                photo: 'https://images.unsplash.com/photo-1622629797619-c100e3e67e2e?w=600&h=700&fit=crop&crop=face',
                programme: 'Professional',
                bio: 'Hussein is a Kenyan National Team swimmer specialising in sprint freestyle events. He joined Visa Dolphins at age 8 and has since represented Kenya at multiple international competitions including the African Aquatics Championships.',
                personalBests: [
                    { event: '50m Freestyle', time: '23.45s', date: 'May 2026' },
                    { event: '100m Freestyle', time: '51.12s', date: 'May 2026' },
                    { event: '200m Freestyle', time: '1:52.30', date: 'Mar 2026' },
                    { event: '50m Butterfly', time: '25.88s', date: 'Jan 2026' }
                ],
                highlights: [
                    'Kenyan National Team — 2024, 2025, 2026',
                    'Gold Medal — 100m Freestyle, Kenya National Championships 2026',
                    'Silver Medal — 50m Freestyle, African Aquatics Championships 2025',
                    'Club Record Holder — 50m & 100m Freestyle'
                ]
            },
            nadia: {
                name: 'Nadia',
                photo: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=700&fit=crop&crop=face',
                programme: 'Professional',
                bio: 'Nadia is a versatile swimmer who excels in Individual Medley and backstroke events. A member of the Kenyan National Team, she holds multiple national age-group records and is targeting qualification for the World Championships.',
                personalBests: [
                    { event: '200m IM', time: '2:18.44', date: 'May 2026' },
                    { event: '100m Backstroke', time: '1:03.77', date: 'Apr 2026' },
                    { event: '200m Backstroke', time: '2:14.50', date: 'Mar 2026' },
                    { event: '100m Freestyle', time: '57.22s', date: 'May 2026' }
                ],
                highlights: [
                    'Kenyan National Team — 2025, 2026',
                    'Gold Medal — 200m IM, Kenya National Championships 2026',
                    'National Age Group Record — 200m Backstroke (15–16 years)',
                    'Best Female Swimmer — Kiambu County 2025'
                ]
            },
            sudais: {
                name: 'Sudais Bashir',
                photo: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&h=700&fit=crop&crop=face',
                programme: 'Elite',
                bio: 'Sudais Bashir represented Somalia at the national level in swimming. Training with Visa Dolphins, he has developed into a powerful sprint swimmer with sights set on the African Championships.',
                personalBests: [
                    { event: '50m Freestyle', time: '24.91s', date: 'Apr 2026' },
                    { event: '100m Freestyle', time: '54.33s', date: 'Apr 2026' },
                    { event: '50m Backstroke', time: '29.15s', date: 'Mar 2026' },
                    { event: '100m Butterfly', time: '59.80s', date: 'Feb 2026' }
                ],
                highlights: [
                    'Represented Somalia — National Swimming Championships 2025',
                    'Bronze Medal — 100m Freestyle, East African Invitational 2025',
                    'Visa Dolphins Club Record — 50m Freestyle (Open)'
                ]
            },
            amara: {
                name: 'Amara Ochieng',
                photo: 'https://images.unsplash.com/photo-1560090995-01632a28895b?w=600&h=700&fit=crop&crop=face',
                programme: 'Elite',
                bio: 'Amara is a butterfly specialist who has dominated county-level competitions. Her powerful technique and race intelligence make her one of the most promising swimmers in the club.',
                personalBests: [
                    { event: '100m Butterfly', time: '1:04.55', date: 'May 2026' },
                    { event: '200m Butterfly', time: '2:20.10', date: 'Apr 2026' },
                    { event: '50m Freestyle', time: '27.33s', date: 'May 2026' },
                    { event: '200m IM', time: '2:25.80', date: 'Mar 2026' }
                ],
                highlights: [
                    'County Champion — 100m Butterfly 2025, 2026',
                    'National Qualifier — 200m Butterfly',
                    'Best Junior Female Swimmer — Visa Dolphins 2025'
                ]
            },
            kevin: {
                name: 'Kevin Mwangi',
                photo: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=700&fit=crop&crop=face',
                programme: 'Elite',
                bio: 'Kevin is a distance freestyle swimmer with exceptional endurance. He qualified for the Kenya National Championships in the 200m and 400m Freestyle events and continues to improve his times every season.',
                personalBests: [
                    { event: '200m Freestyle', time: '1:58.90', date: 'May 2026' },
                    { event: '400m Freestyle', time: '4:15.22', date: 'Apr 2026' },
                    { event: '100m Freestyle', time: '55.10s', date: 'May 2026' },
                    { event: '200m IM', time: '2:12.44', date: 'Mar 2026' }
                ],
                highlights: [
                    'National Qualifier — 200m & 400m Freestyle 2026',
                    'Silver Medal — 400m Freestyle, Kiambu Invitational 2026',
                    'Most Dedicated Swimmer — Visa Dolphins 2025'
                ]
            },
            zara: {
                name: 'Zara Kimani',
                photo: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=700&fit=crop&crop=face',
                programme: 'Intermediate',
                bio: 'Zara joined Visa Dolphins as a complete beginner and has risen through the programme to become one of the top age-group swimmers in her category. She holds the club record in the 50m Backstroke for her age group.',
                personalBests: [
                    { event: '50m Backstroke', time: '35.22s', date: 'May 2026' },
                    { event: '50m Freestyle', time: '31.44s', date: 'Apr 2026' },
                    { event: '100m Backstroke', time: '1:15.90', date: 'Mar 2026' }
                ],
                highlights: [
                    'Club Record — 50m Backstroke (10–11 age group)',
                    'Gold Medal — Inter-Club Gala 2026',
                    'Promoted from Novice to Intermediate in 6 months'
                ]
            },
            omar: {
                name: 'Omar Hassan',
                photo: 'https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=600&h=700&fit=crop&crop=face',
                programme: 'Intermediate',
                bio: 'Omar is the embodiment of hard work and consistency. Named Most Improved Swimmer in 2025, he has transformed from a nervous beginner into a confident competitor in just 18 months.',
                personalBests: [
                    { event: '50m Freestyle', time: '33.10s', date: 'May 2026' },
                    { event: '50m Breaststroke', time: '38.55s', date: 'Apr 2026' },
                    { event: '100m Freestyle', time: '1:12.30', date: 'Mar 2026' }
                ],
                highlights: [
                    'Most Improved Swimmer — Visa Dolphins 2025',
                    'Bronze Medal — Inter-Club Gala 2026',
                    'Achieved 25m unassisted swim within first month'
                ]
            },
            faith: {
                name: 'Faith Wanjiku',
                photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=700&fit=crop&crop=face',
                programme: 'Elite',
                bio: 'Faith is an IM specialist with a powerful breaststroke leg. She has dominated county championships in the 200m Individual Medley and is on track for national team selection.',
                personalBests: [
                    { event: '200m IM', time: '2:22.10', date: 'May 2026' },
                    { event: '100m Breaststroke', time: '1:14.55', date: 'Apr 2026' },
                    { event: '200m Breaststroke', time: '2:40.20', date: 'Mar 2026' },
                    { event: '100m Freestyle', time: '1:00.88s', date: 'May 2026' }
                ],
                highlights: [
                    'County Champion — 200m Individual Medley 2025, 2026',
                    'National Qualifier — 200m IM & 100m Breaststroke',
                    'Silver Medal — 100m Breaststroke, Kenya National Championships 2026'
                ]
            }
        };

        var params = new URLSearchParams(window.location.search);
        var athleteId = params.get('id');
        var athlete = athleteId ? athleteData[athleteId] : null;

        if (athlete) {
            document.title = athlete.name + ' — Visa Dolphins Swim Club';
            var pbRows = athlete.personalBests.map(function (pb) {
                return '<tr><td>' + pb.event + '</td><td>' + pb.time + '</td><td>' + pb.date + '</td></tr>';
            }).join('');
            var highlightItems = athlete.highlights.map(function (h) {
                return '<li>' + h + '</li>';
            }).join('');

            athleteDetailContainer.innerHTML = ''
                + '<section class="athlete-hero">'
                + '  <div class="container">'
                + '    <a href="/club/athletes.html" class="athlete-back-link">&larr; Back to Athletes</a>'
                + '    <div class="athlete-hero__grid">'
                + '      <div class="athlete-hero__photo">'
                + '        <img src="' + athlete.photo + '" alt="' + athlete.name + '">'
                + '        <span class="athlete-hero__badge">' + athlete.programme + '</span>'
                + '      </div>'
                + '      <div class="athlete-hero__info">'
                + '        <h1 class="athlete-hero__name">' + athlete.name + '</h1>'
                + '        <p class="athlete-hero__bio">' + athlete.bio + '</p>'
                + '      </div>'
                + '    </div>'
                + '  </div>'
                + '</section>'
                + '<section class="section">'
                + '  <div class="container">'
                + '    <div class="athlete-details-grid">'
                + '      <div class="athlete-pbs">'
                + '        <h2 class="athlete-section-title">Personal Bests</h2>'
                + '        <table class="athlete-pb-table">'
                + '          <thead><tr><th>Event</th><th>Time</th><th>Date</th></tr></thead>'
                + '          <tbody>' + pbRows + '</tbody>'
                + '        </table>'
                + '      </div>'
                + '      <div class="athlete-highlights">'
                + '        <h2 class="athlete-section-title">Highlights</h2>'
                + '        <ul class="athlete-highlights-list">' + highlightItems + '</ul>'
                + '      </div>'
                + '    </div>'
                + '  </div>'
                + '</section>';
        } else {
            athleteDetailContainer.innerHTML = ''
                + '<section class="page-hero">'
                + '  <div class="container" style="text-align:center;">'
                + '    <h1 class="page-hero__title">Athlete Not Found</h1>'
                + '    <p class="page-hero__desc">Sorry, we couldn\'t find that athlete profile.</p>'
                + '    <a href="/club/athletes.html" class="btn btn-primary" style="margin-top:2rem;">View All Athletes</a>'
                + '  </div>'
                + '</section>';
        }
    }

    } // end initPage

})();
