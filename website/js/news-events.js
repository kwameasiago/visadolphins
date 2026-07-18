(function () {
    var grid = document.getElementById('news-grid');
    var emptyState = document.getElementById('empty-state');
    var pagination = document.getElementById('pagination');
    var searchInput = document.getElementById('search-input');
    var currentPage = 1;
    var searchTerm = '';
    var searchTimeout;

    function showSkeleton() {
        var html = '';
        for (var i = 0; i < 6; i++) {
            html += '<div class="skeleton-card"><div class="skeleton-card__image"></div><div class="skeleton-card__body"><div class="skeleton-line skeleton-line--long"></div><div class="skeleton-line skeleton-line--medium"></div><div class="skeleton-line skeleton-line--short"></div></div></div>';
        }
        grid.innerHTML = html;
    }

    async function loadPosts() {
        showSkeleton();
        var params = new URLSearchParams({ page: currentPage, per_page: 12 });
        if (searchTerm) params.set('search', searchTerm);

        try {
            var res = await fetch(APP_CONFIG.API_BASE_URL + '/news-events.php?' + params.toString());
            var data = await res.json();
            renderGrid(data.data);
            renderPagination(data);
        } catch (err) {
            grid.innerHTML = '<p style="color:var(--color-text-muted);">Failed to load posts.</p>';
        }
    }

    function renderGrid(posts) {
        if (!posts || posts.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = '';
            return;
        }
        emptyState.style.display = 'none';

        grid.innerHTML = posts.map(function (p) {
            var coverHtml = '';
            if (p.thumb_type === 'image' && p.thumb_path) {
                coverHtml = '<img src="' + resolveUploadUrl(p.thumb_path) + '" alt="">';
            } else if (p.thumb_type === 'youtube' && p.thumb_path) {
                var ytId = extractYouTubeId(p.thumb_path);
                coverHtml = ytId ? '<img src="https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg" alt="">' : '';
            } else if (p.thumb_type === 'video' && p.thumb_path) {
                coverHtml = '<video src="' + resolveUploadUrl(p.thumb_path) + '" muted></video>';
            }

            var date = new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            return '<a href="/news-event-detail.html?id=' + p.public_id + '" class="news-card">' +
                (coverHtml ? '<div class="news-card__image">' + coverHtml + '</div>' : '') +
                '<div class="news-card__content">' +
                    '<time class="news-card__date">' + date + '</time>' +
                    '<h3 class="news-card__title">' + escapeHtml(p.title) + '</h3>' +
                    '<p class="news-card__excerpt">' + escapeHtml(p.excerpt || '') + '</p>' +
                '</div>' +
            '</a>';
        }).join('');
    }

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
                loadPosts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            searchTerm = searchInput.value.trim();
            currentPage = 1;
            loadPosts();
        }, 300);
    });

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        var match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    loadPosts();
})();
