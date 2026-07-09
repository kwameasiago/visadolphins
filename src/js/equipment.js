(function () {
    var grid = document.getElementById('equipment-grid');
    var emptyState = document.getElementById('equipment-empty');
    var pagination = document.getElementById('equipment-pagination');
    var searchInput = document.getElementById('equipment-search');

    if (!grid) return;

    var currentPage = 1;
    var searchTerm = '';
    var searchTimeout;

    async function loadEquipment() {
        var params = new URLSearchParams({ page: currentPage, per_page: 12 });
        if (searchTerm) params.set('search', searchTerm);

        try {
            var res = await fetch('/api/public/equipment.php?' + params.toString());
            var data = await res.json();
            renderGrid(data.data);
            renderPagination(data);
        } catch (err) {
            grid.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">Failed to load equipment.</p>';
        }
    }

    function renderGrid(items) {
        if (!items || items.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = '';
            return;
        }
        emptyState.style.display = 'none';

        grid.innerHTML = items.map(function (item) {
            var imgHtml = item.image_path
                ? '<img src="' + item.image_path + '" alt="' + escapeHtml(item.name) + '" loading="lazy">'
                : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);font-size:0.8rem;">No image</div>';

            var categoryHtml = item.category
                ? '<span class="equipment-card__category">' + escapeHtml(item.category) + '</span>'
                : '';

            var descHtml = item.short_desc
                ? '<p class="equipment-card__desc">' + escapeHtml(item.short_desc) + '</p>'
                : '';

            var priceHtml = item.price
                ? '<span class="equipment-card__price">' + escapeHtml(item.price) + '</span>'
                : '';

            return '<div class="equipment-card">' +
                '<a href="/sports/equipment-detail.html?id=' + item.public_id + '" class="equipment-card__image">' +
                    imgHtml + categoryHtml +
                '</a>' +
                '<div class="equipment-card__info">' +
                    '<h3 class="equipment-card__name">' + escapeHtml(item.name) + '</h3>' +
                    descHtml + priceHtml +
                    '<div class="equipment-card__actions">' +
                        '<a href="/sports/equipment-detail.html?id=' + item.public_id + '" class="btn btn-sm btn-outline">View Details</a>' +
                        '<a href="https://wa.me/254700000000?text=' + encodeURIComponent('Hi, I\'d like to order ' + item.name) + '" target="_blank" class="btn btn-sm btn-whatsapp">WhatsApp</a>' +
                    '</div>' +
                '</div>' +
            '</div>';
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
                loadEquipment();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function () {
                searchTerm = searchInput.value.trim();
                currentPage = 1;
                loadEquipment();
            }, 300);
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    loadEquipment();
})();
