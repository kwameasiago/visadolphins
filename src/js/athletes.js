(function () {
    const API_BASE = '/api/public';
    const grid = document.getElementById('athletes-grid');
    const emptyEl = document.getElementById('athletes-empty');
    const paginationEl = document.getElementById('athletes-pagination');
    const searchInput = document.getElementById('athlete-search');

    let currentPage = 1;
    let searchTerm = '';
    let searchTimeout = null;

    async function loadAthletes() {
        const params = new URLSearchParams({ page: currentPage, per_page: 12 });
        if (searchTerm) params.set('search', searchTerm);

        try {
            const res = await fetch(API_BASE + '/athletes.php?' + params.toString());
            const data = await res.json();
            renderGrid(data.data);
            renderPagination(data);
        } catch (err) {
            grid.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;padding:2rem;">Failed to load athletes.</p>';
        }
    }

    function renderGrid(athletes) {
        if (!athletes || athletes.length === 0) {
            grid.innerHTML = '';
            grid.style.display = 'none';
            emptyEl.style.display = 'block';
            return;
        }

        grid.style.display = '';
        emptyEl.style.display = 'none';

        grid.innerHTML = athletes.map(function (a) {
            var imgSrc = a.image_path || 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=500&fit=crop&crop=face';
            var highlight = a.highlights && a.highlights.length > 0 ? a.highlights[0] : '';
            return '<a href="/club/athlete-detail.html?id=' + a.public_id + '" class="athlete-card">' +
                '<div class="athlete-card__image">' +
                    '<img src="' + imgSrc + '" alt="' + escapeHtml(a.name) + '" loading="lazy">' +
                '</div>' +
                '<div class="athlete-card__info">' +
                    '<h3 class="athlete-card__name">' + escapeHtml(a.name) + '</h3>' +
                    '<p class="athlete-card__achievement">' + escapeHtml(highlight) + '</p>' +
                '</div>' +
            '</a>';
        }).join('');
    }

    function renderPagination(data) {
        if (data.total_pages <= 1) { paginationEl.innerHTML = ''; return; }

        var btnStyle = 'padding:0.5rem 0.85rem;background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:6px;color:var(--color-text);font-size:0.8rem;cursor:pointer;';
        var activeStyle = btnStyle + 'background:var(--color-primary);border-color:var(--color-primary);color:#000;font-weight:600;';

        var html = '';
        html += '<button style="' + btnStyle + '" ' + (data.page <= 1 ? 'disabled style="' + btnStyle + 'opacity:0.4;cursor:not-allowed;"' : '') + ' data-page="' + (data.page - 1) + '">&laquo; Prev</button>';
        for (var i = 1; i <= data.total_pages; i++) {
            html += '<button style="' + (i === data.page ? activeStyle : btnStyle) + '" data-page="' + i + '">' + i + '</button>';
        }
        html += '<button style="' + btnStyle + '" ' + (data.page >= data.total_pages ? 'disabled style="' + btnStyle + 'opacity:0.4;cursor:not-allowed;"' : '') + ' data-page="' + (data.page + 1) + '">Next &raquo;</button>';
        paginationEl.innerHTML = html;

        paginationEl.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (btn.disabled) return;
                currentPage = parseInt(btn.dataset.page);
                loadAthletes();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function () {
                searchTerm = searchInput.value.trim();
                currentPage = 1;
                loadAthletes();
            }, 300);
        });
    }

    // Init
    loadAthletes();
})();
