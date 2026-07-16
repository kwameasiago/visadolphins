(function () {
    var hexGrid = document.getElementById('hex-grid');
    var filtersContainer = document.getElementById('gallery-filters');
    var emptyState = document.getElementById('gallery-empty');
    var pagination = document.getElementById('gallery-pagination');
    var lightbox = document.getElementById('gallery-lightbox');

    if (!hexGrid || !lightbox) return;

    var lightboxImage = lightbox.querySelector('.lightbox__image');
    var lightboxCaption = lightbox.querySelector('.lightbox__caption');
    var currentIndex = 0;
    var visibleItems = [];
    var currentPage = 1;
    var currentTag = '';

    // ---- Skeleton ----
    function showSkeleton() {
        var skeletons = '';
        for (var i = 0; i < 8; i++) {
            skeletons += '<div class="hex-item"><div class="skeleton-hex"></div></div>';
        }
        hexGrid.innerHTML = skeletons;
    }

    // ---- Load data ----
    async function loadGallery() {
        showSkeleton();
        var params = new URLSearchParams({ page: currentPage, per_page: 50 });
        if (currentTag) params.set('tag', currentTag);

        try {
            var res = await fetch('/api/public/gallery.php?' + params.toString());
            var data = await res.json();
            renderFilters(data.tags);
            renderGrid(data.data);
            renderPagination(data);
        } catch (err) {
            hexGrid.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">Failed to load gallery.</p>';
        }
    }

    // ---- Filter buttons ----
    function renderFilters(tags) {
        if (!tags || tags.length === 0) return;

        var html = '<button class="gallery-filter' + (!currentTag ? ' active' : '') + '" data-filter="all">All</button>';
        tags.forEach(function (tag) {
            var active = currentTag === tag ? ' active' : '';
            html += '<button class="gallery-filter' + active + '" data-filter="' + escapeAttr(tag) + '">' + capitalize(tag) + '</button>';
        });
        filtersContainer.innerHTML = html;

        filtersContainer.querySelectorAll('.gallery-filter').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var filter = btn.getAttribute('data-filter');
                currentTag = filter === 'all' ? '' : filter;
                currentPage = 1;
                loadGallery();
            });
        });
    }

    // ---- Hex grid ----
    function renderGrid(items) {
        if (!items || items.length === 0) {
            hexGrid.innerHTML = '';
            emptyState.style.display = '';
            return;
        }
        emptyState.style.display = 'none';

        hexGrid.innerHTML = items.map(function (item) {
            return '<div class="hex-item" data-category="' + escapeAttr(item.tag || '') + '" data-caption="' + escapeAttr(item.caption || '') + '">' +
                '<div class="hex-shape">' +
                    '<img src="' + item.image_path + '" alt="' + escapeAttr(item.caption || '') + '" loading="lazy">' +
                '</div>' +
            '</div>';
        }).join('');

        // Update visible items for lightbox
        visibleItems = Array.from(hexGrid.querySelectorAll('.hex-item'));

        // Attach click listeners for lightbox
        visibleItems.forEach(function (item, idx) {
            item.addEventListener('click', function () {
                openLightbox(idx);
            });
        });
    }

    // ---- Pagination ----
    function renderPagination(data) {
        if (data.total_pages <= 1) { pagination.innerHTML = ''; return; }
        var html = '';
        for (var i = 1; i <= data.total_pages; i++) {
            html += '<button class="pagination__btn' + (i === data.page ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
        }
        pagination.innerHTML = html;
        pagination.querySelectorAll('.pagination__btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                currentPage = parseInt(btn.dataset.page);
                loadGallery();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    // ---- Lightbox ----
    function openLightbox(index) {
        currentIndex = index;
        var item = visibleItems[currentIndex];
        var img = item.querySelector('img');
        var caption = item.getAttribute('data-caption');
        lightboxImage.src = img.src;
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

    lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox__overlay').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox__prev').addEventListener('click', prevImage);
    lightbox.querySelector('.lightbox__next').addEventListener('click', nextImage);

    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    });

    // ---- Helpers ----
    function escapeAttr(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML.replace(/"/g, '&quot;');
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    loadGallery();
})();
