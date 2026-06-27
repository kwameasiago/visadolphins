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

    } // end initPage

})();
