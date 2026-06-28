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

    // ===========================
    // Equipment Detail Page Renderer
    // ===========================
    var equipmentDetailContainer = document.getElementById('equipment-detail-content');
    if (equipmentDetailContainer) {
        var equipmentData = {
            'goggles-racing': {
                name: 'Racing Goggles',
                image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=600&fit=crop',
                category: 'Competitive',
                price: 'KSh 2,500',
                description: 'Low-profile hydrodynamic goggles engineered for competition swimming. Designed to minimise drag and maximise peripheral vision during races. The anti-fog, UV-protected lenses provide crystal-clear visibility in any pool conditions.',
                features: [
                    'Low-profile hydrodynamic frame',
                    'Anti-fog & UV-protected lenses',
                    'Double silicone strap for secure fit',
                    'Interchangeable nose bridges (S/M/L)',
                    'Available in mirrored and clear lens options'
                ],
                sizes: 'One size fits most (adjustable strap)'
            },
            'goggles-training': {
                name: 'Training Goggles',
                image: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600&h=600&fit=crop',
                category: 'Training',
                price: 'KSh 1,800',
                description: 'Comfortable wide-lens goggles built for daily training sessions. The soft gasket seal and wide field of view make them ideal for long workouts. Anti-fog coating ensures clear vision throughout your session.',
                features: [
                    'Wide-angle panoramic lenses',
                    'Soft silicone gasket for comfort',
                    'Anti-fog coating',
                    'Quick-adjust buckle system',
                    'Suitable for indoor and outdoor pools'
                ],
                sizes: 'One size fits most (adjustable strap)'
            },
            'swimsuit-mens': {
                name: "Men's Racing Suit",
                image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=600&fit=crop',
                category: 'Competitive',
                price: 'KSh 4,500',
                description: 'High-compression racing jammer designed for maximum speed in the water. The water-repellent fabric reduces drag while the compression panels support key muscle groups during races.',
                features: [
                    'High-compression fabric technology',
                    'Water-repellent surface coating',
                    'Flatlock stitching to reduce drag',
                    'Chlorine-resistant material',
                    'Drawstring waist for secure fit'
                ],
                sizes: 'Available in sizes 24–36'
            },
            'swimsuit-womens': {
                name: "Women's Racing Suit",
                image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=600&fit=crop',
                category: 'Competitive',
                price: 'KSh 5,200',
                description: 'Streamlined one-piece racing suit with chlorine-resistant fabric and reinforced stitching. Engineered for competitive swimmers who demand performance and durability from their race kit.',
                features: [
                    'Streamlined one-piece design',
                    'Chlorine-resistant fabric (300+ hours)',
                    'Reinforced stitching at stress points',
                    'Open back for freedom of movement',
                    'Compression fit for muscle support'
                ],
                sizes: 'Available in sizes 26–38'
            },
            'swim-cap': {
                name: 'Silicone Swim Cap',
                image: 'https://images.unsplash.com/photo-1560090995-01632a28895b?w=600&h=600&fit=crop',
                category: 'Essentials',
                price: 'KSh 800',
                description: 'Durable silicone swim cap that reduces drag and protects hair from chlorine damage. The ergonomic shape fits comfortably without pulling, and the material maintains its shape over hundreds of uses.',
                features: [
                    '100% premium silicone construction',
                    'Ergonomic wrinkle-free design',
                    'Protects hair from chlorine',
                    'Tear-resistant material',
                    'Available in 8 colours'
                ],
                sizes: 'One size (adult), Junior size available'
            },
            'fins-training': {
                name: 'Training Fins',
                image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=600&fit=crop',
                category: 'Training',
                price: 'KSh 3,200',
                description: 'Short-blade training fins designed to build leg strength, improve ankle flexibility, and refine kick technique. The shorter blade encourages a faster kick tempo without over-reliance on fin propulsion.',
                features: [
                    'Short-blade design for natural kick tempo',
                    'Closed-heel pocket for secure fit',
                    'Soft rubber compound — comfortable for long sets',
                    'Builds leg strength and ankle flexibility',
                    'Suitable for all four strokes'
                ],
                sizes: 'Available in sizes XS (35-36) to XL (44-45)'
            },
            'kickboard': {
                name: 'Kickboard',
                image: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&h=600&fit=crop',
                category: 'Training',
                price: 'KSh 1,500',
                description: 'Lightweight EVA foam kickboard ideal for targeted leg training and learn-to-swim programmes. The ergonomic shape provides multiple grip positions for different training drills.',
                features: [
                    'High-density EVA foam — lightweight and durable',
                    'Ergonomic shape with multiple grip options',
                    'Smooth edges for comfortable hold',
                    'Suitable for all skill levels',
                    'Ideal for kick drills and learn-to-swim'
                ],
                sizes: 'Standard (42cm x 28cm)'
            },
            'pull-buoy': {
                name: 'Pull Buoy',
                image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&h=600&fit=crop',
                category: 'Training',
                price: 'KSh 1,200',
                description: 'Ergonomic pull buoy for isolating upper body strength and improving stroke technique. Placed between the thighs to eliminate kick, allowing swimmers to focus entirely on their pull and body rotation.',
                features: [
                    'Figure-8 ergonomic shape',
                    'High-density EVA foam for buoyancy',
                    'Comfortable grip between thighs',
                    'Develops upper body strength',
                    'Improves body position and rotation'
                ],
                sizes: 'Standard (adult), Junior size available'
            }
        };

        var eqParams = new URLSearchParams(window.location.search);
        var equipmentId = eqParams.get('id');
        var equipment = equipmentId ? equipmentData[equipmentId] : null;

        if (equipment) {
            document.title = equipment.name + ' — Visa Dolphins Sports';
            var featureItems = equipment.features.map(function (f) {
                return '<li>' + f + '</li>';
            }).join('');

            equipmentDetailContainer.innerHTML = ''
                + '<section class="equipment-hero">'
                + '  <div class="container">'
                + '    <a href="/sports/equipment.html" class="athlete-back-link">&larr; Back to Equipment</a>'
                + '    <div class="equipment-hero__grid">'
                + '      <div class="equipment-hero__photo">'
                + '        <img src="' + equipment.image + '" alt="' + equipment.name + '">'
                + '        <span class="equipment-hero__category">' + equipment.category + '</span>'
                + '      </div>'
                + '      <div class="equipment-hero__info">'
                + '        <span class="equipment-hero__price">' + equipment.price + '</span>'
                + '        <h1 class="equipment-hero__name">' + equipment.name + '</h1>'
                + '        <p class="equipment-hero__desc">' + equipment.description + '</p>'
                + '        <p class="equipment-hero__sizes"><strong>Sizes:</strong> ' + equipment.sizes + '</p>'
                + '        <a href="https://wa.me/254700000000?text=Hi%2C%20I%27d%20like%20to%20order%20' + encodeURIComponent(equipment.name) + '" target="_blank" class="btn btn-primary" style="margin-top:1.5rem;">'
                + '          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.593-.838-6.328-2.236l-.442-.368-3.262 1.093 1.093-3.262-.368-.442A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>'
                + '          Enquire via WhatsApp'
                + '        </a>'
                + '      </div>'
                + '    </div>'
                + '  </div>'
                + '</section>'
                + '<section class="section">'
                + '  <div class="container">'
                + '    <div class="equipment-features">'
                + '      <h2 class="athlete-section-title">Features</h2>'
                + '      <ul class="athlete-highlights-list">' + featureItems + '</ul>'
                + '    </div>'
                + '  </div>'
                + '</section>';
        } else {
            equipmentDetailContainer.innerHTML = ''
                + '<section class="page-hero">'
                + '  <div class="container" style="text-align:center;">'
                + '    <h1 class="page-hero__title">Product Not Found</h1>'
                + '    <p class="page-hero__desc">Sorry, we couldn\'t find that product.</p>'
                + '    <a href="/sports/equipment.html" class="btn btn-primary" style="margin-top:2rem;">View All Equipment</a>'
                + '  </div>'
                + '</section>';
        }
    }

    // ===========================
    // News Detail Page Renderer
    // ===========================
    var newsDetailContainer = document.getElementById('news-detail-content');
    if (newsDetailContainer) {
        var newsData = {
            'nationals-2026': {
                title: 'Kenyan National Championships 2026',
                badge: 'Results',
                date: 'May 29–31, 2026',
                location: 'Nairobi',
                image: 'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?w=900&h=450&fit=crop&crop=center',
                content: '<p>Visa Dolphins Swim Club athletes delivered outstanding performances at the Kenyan National Championships held May 29–31, 2026 in Nairobi.</p><p>Our swimmers competed across multiple events including freestyle, backstroke, breaststroke, butterfly, and individual medley distances. Several athletes achieved personal bests, with two swimmers qualifying for upcoming international competitions.</p><p>Highlights include Hussein\'s dominant performance in the 200m freestyle and Nadia\'s impressive showing in the 100m backstroke. Both athletes continue to represent Kenya at the highest level.</p><p>The National Championships served as a crucial development opportunity for our Intermediate and Elite programme athletes, many of whom competed at national level for the first time. Their experience and confidence will be invaluable going forward.</p><p>Congratulations to all our athletes, coaches, and supporting families for an exceptional weekend of swimming.</p>'
            },
            'kiambu-invitational': {
                title: 'Kiambu Aquatics Invitational Championship',
                badge: 'Results',
                date: 'May 23–24, 2026',
                location: 'Kiambu',
                image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=900&h=450&fit=crop&crop=center',
                content: '<p>Visa Dolphins athletes competed across all age groups at the Kiambu Aquatics Invitational Championship held May 23–24, 2026.</p><p>This regional competition provided an excellent platform for our developing swimmers to gain race experience in a competitive but supportive environment. Athletes from our Novice, Intermediate, and Elite programmes all took part.</p><p>Notable performances included multiple podium finishes in the 10 & under age group, and several new club records set by our Intermediate squad members.</p><p>The Kiambu Invitational is organised by the Kiambu County Aquatics Association (KCAA), our governing body, and serves as an important stepping stone toward the National Championships.</p><p>Thank you to all families who travelled to support our swimmers and to the KCAA for excellent event organisation.</p>'
            },
            'new-season-registration': {
                title: 'New Season Registration Open',
                badge: 'Enrolment',
                date: 'June 2026',
                location: 'All locations',
                image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&h=450&fit=crop&crop=center',
                content: '<p>Registration is now open for the next training season at Visa Dolphins Swim Club. All programmes are accepting new swimmers.</p><p><strong>Available programmes:</strong></p><ul><li><strong>Novice</strong> — For beginners learning water confidence and basic technique</li><li><strong>Intermediate</strong> — Building stroke technique and endurance</li><li><strong>Elite</strong> — Competition-focused training for county and national qualifiers</li><li><strong>Professional</strong> — National team athletes and high-performance squad</li></ul><p>Training sessions run at Westlands Primary Swimming Pool (weekday evenings and Saturday mornings) and Kasarani Aquatic Stadium (early mornings for Professional squad).</p><p>To register, contact us via WhatsApp or visit the Enrol page on our website. Places are limited to maintain our maximum 15:1 student-to-coach ratio.</p>'
            },
            'kcaa-recognition': {
                title: 'KCAA No-Objection Certificate Issued',
                badge: 'Announcement',
                date: 'February 2026',
                location: 'Kiambu County',
                image: 'https://images.unsplash.com/photo-1560090995-01632a28895b?w=900&h=450&fit=crop&crop=center',
                content: '<p>Visa Dolphins Swim Club is proud to announce that we have received our official No-Objection Certificate from the Kiambu County Aquatics Association (KCAA) in February 2026.</p><p>The certificate was issued by Honorary Secretary Douglas Okatso and countersigned by Chairperson Gedeon Kioko, confirming our club\'s official registration and recognition by the county governing body.</p><p>This recognition means our athletes can officially compete in sanctioned events under the KCAA banner, our coaching standards meet county requirements, and we are aligned with the Kenya Aquatics governance structure.</p><p>We are grateful to the KCAA for their support and look forward to continuing our contribution to aquatic sports development in Kiambu County and beyond.</p>'
            },
            'decathlon-partnership': {
                title: 'Decathlon Kenya Equipment Partnership',
                badge: 'Partnership',
                date: '2026',
                location: 'Nairobi',
                image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&h=450&fit=crop&crop=center',
                content: '<p>Visa Dolphins Sports is excited to announce a new equipment and resource partnership with Decathlon Kenya.</p><p>This partnership means our athletes, club members, and school programmes will have access to professional-grade aquatic equipment at competitive prices. The partnership covers:</p><ul><li>Training equipment (fins, kickboards, pull buoys, paddles)</li><li>Competition gear (racing goggles, caps, swimsuits)</li><li>Coaching resources and pool equipment</li><li>Bulk order pricing for schools and clubs</li></ul><p>Decathlon Kenya shares our commitment to making sport accessible and our belief that quality equipment should be available to athletes at every level — from learn-to-swim beginners to national team competitors.</p><p>Visit our Sports Equipment page to browse the range or contact us for bulk order enquiries.</p>'
            },
            'sudais-somalia': {
                title: 'Sudais Bashir Represents Somalia at National Level',
                badge: 'Athlete Spotlight',
                date: '2026',
                location: 'International',
                image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=900&h=450&fit=crop&crop=center',
                content: '<p>We are incredibly proud to announce that Visa Dolphins athlete Sudais Bashir has been selected to represent Somalia at national level in swimming.</p><p>Sudais joined Visa Dolphins as a developing swimmer and through dedicated training in our Elite programme, has achieved times that qualify him for international representation. His journey from our pool deck to the international stage is exactly what our club\'s development pathway is designed to achieve.</p><p>Coach Japheth Onkoba said: "Sudais embodies everything we believe in at Visa Dolphins — hard work, dedication, and the willingness to push beyond limits. Seeing our athletes compete internationally validates our approach to swimmer development."</p><p>Sudais continues to train with Visa Dolphins and will represent Somalia in upcoming international competitions. We wish him every success and are honoured to be part of his journey.</p>'
            }
        };

        var newsParams = new URLSearchParams(window.location.search);
        var newsId = newsParams.get('id');
        var article = newsId ? newsData[newsId] : null;

        if (article) {
            document.title = article.title + ' — Visa Dolphins';
            newsDetailContainer.innerHTML = ''
                + '<section class="news-detail-hero">'
                + '  <div class="container">'
                + '    <a href="/news.html" class="athlete-back-link">&larr; Back to News & Events</a>'
                + '    <div class="news-detail-hero__image">'
                + '      <img src="' + article.image + '" alt="' + article.title + '">'
                + '    </div>'
                + '  </div>'
                + '</section>'
                + '<section class="section">'
                + '  <div class="container">'
                + '    <article class="news-detail-article">'
                + '      <div class="news-detail-meta">'
                + '        <span class="stat-badge">' + article.badge + '</span>'
                + '        <span class="news-detail-date">' + article.date + '</span>'
                + '        <span class="news-detail-location">' + article.location + '</span>'
                + '      </div>'
                + '      <h1 class="news-detail-title">' + article.title + '</h1>'
                + '      <div class="news-detail-body">' + article.content + '</div>'
                + '      <div class="news-detail-share">'
                + '        <a href="https://wa.me/?text=' + encodeURIComponent(article.title + ' — https://visadolphins.co.ke/news-detail.html?id=' + newsId) + '" target="_blank" class="btn btn-sm btn-whatsapp">I have a question</a>'
                + '      </div>'
                + '    </article>'
                + '  </div>'
                + '</section>';
        } else {
            newsDetailContainer.innerHTML = ''
                + '<section class="page-hero">'
                + '  <div class="container" style="text-align:center;">'
                + '    <h1 class="page-hero__title">Article Not Found</h1>'
                + '    <p class="page-hero__desc">Sorry, we couldn\'t find that article.</p>'
                + '    <a href="/news.html" class="btn btn-primary" style="margin-top:2rem;">View All News</a>'
                + '  </div>'
                + '</section>';
        }
    }

    // ===========================
    // Gallery — Filters & Lightbox
    // ===========================
    var hexGrid = document.getElementById('hex-grid');
    var lightbox = document.getElementById('gallery-lightbox');

    if (hexGrid && lightbox) {
        var filterBtns = document.querySelectorAll('.gallery-filter');
        var hexItems = document.querySelectorAll('.hex-item');
        var lightboxImage = lightbox.querySelector('.lightbox__image');
        var lightboxCaption = lightbox.querySelector('.lightbox__caption');
        var currentIndex = 0;
        var visibleItems = [];

        function updateVisibleItems() {
            visibleItems = [];
            hexItems.forEach(function(item) {
                if (!item.classList.contains('hidden')) {
                    visibleItems.push(item);
                }
            });
        }

        filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var filter = btn.getAttribute('data-filter');

                hexItems.forEach(function(item) {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
                updateVisibleItems();
            });
        });

        updateVisibleItems();

        function openLightbox(index) {
            currentIndex = index;
            var item = visibleItems[currentIndex];
            var img = item.querySelector('img');
            var caption = item.getAttribute('data-caption');
            lightboxImage.src = img.src.replace('w=500&h=500', 'w=1200&h=1200');
            lightboxImage.alt = img.alt;
            lightboxCaption.textContent = caption || '';
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        function prevImage() {
            currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
            openLightbox(currentIndex);
        }

        function nextImage() {
            currentIndex = (currentIndex + 1) % visibleItems.length;
            openLightbox(currentIndex);
        }

        hexItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var idx = visibleItems.indexOf(item);
                if (idx !== -1) openLightbox(idx);
            });
        });

        lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
        lightbox.querySelector('.lightbox__overlay').addEventListener('click', closeLightbox);
        lightbox.querySelector('.lightbox__prev').addEventListener('click', prevImage);
        lightbox.querySelector('.lightbox__next').addEventListener('click', nextImage);

        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        });
    }

    } // end initPage

})();
