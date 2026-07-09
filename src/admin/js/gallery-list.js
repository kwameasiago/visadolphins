(function () {
    var TOKEN_KEY = 'admin_token';
    var API_BASE = '/api';

    function getToken() { return localStorage.getItem(TOKEN_KEY); }
    function authHeaders() { return { 'Authorization': 'Bearer ' + getToken() }; }

    function checkAuth() {
        var token = getToken();
        if (!token) { window.location.href = '/admin/login.html'; return false; }
        try {
            var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp * 1000 < Date.now()) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/admin/login.html'; return false; }
        } catch (e) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/admin/login.html'; return false; }
        return true;
    }

    if (!checkAuth()) return;

    var grid = document.getElementById('items-grid');
    var emptyState = document.getElementById('empty-state');
    var pagination = document.getElementById('pagination');
    var searchInput = document.getElementById('search-input');
    var logoutBtn = document.getElementById('logout-btn');
    var messageEl = document.getElementById('message');

    var currentPage = 1;
    var searchTerm = '';
    var searchTimeout;

    function showMessage(text, type) {
        showToast(text, type);
    }

    async function loadItems() {
        var params = new URLSearchParams({ page: currentPage, per_page: 20 });
        if (searchTerm) params.set('search', searchTerm);

        try {
            var res = await fetch(API_BASE + '/gallery.php?' + params.toString(), { headers: authHeaders() });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/admin/login.html'; return; }
            var data = await res.json();
            renderGrid(data.data);
            renderPagination(data);
        } catch (err) {
            showMessage('Failed to load gallery.', 'error');
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
            var tagBadge = item.tag
                ? '<span class="admin-gallery-tag">' + escapeHtml(item.tag) + '</span>'
                : '';

            return '<div class="admin-gallery-card" data-id="' + item.public_id + '">' +
                '<div class="admin-gallery-card__image">' +
                    '<img src="' + item.image_path + '" alt="" loading="lazy">' +
                    tagBadge +
                '</div>' +
                '<div class="admin-gallery-card__info">' +
                    '<p class="admin-gallery-card__caption">' + escapeHtml(item.caption || '') + '</p>' +
                '</div>' +
                '<div class="admin-gallery-card__actions">' +
                    '<a href="/admin/gallery-upload.html?id=' + item.public_id + '" class="btn btn-sm btn-outline">Edit</a>' +
                    '<button class="btn btn-sm btn-danger delete-btn">Delete</button>' +
                '</div>' +
            '</div>';
        }).join('');

        grid.querySelectorAll('.delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.closest('.admin-gallery-card').dataset.id;
                deleteItem(id);
            });
        });
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
                loadItems();
            });
        });
    }

    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            searchTerm = searchInput.value.trim();
            currentPage = 1;
            loadItems();
        }, 300);
    });

    async function deleteItem(publicId) {
        if (!confirm('Delete this image? This cannot be undone.')) return;
        try {
            var res = await fetch(API_BASE + '/gallery.php?id=' + publicId, { method: 'DELETE', headers: authHeaders() });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/admin/login.html'; return; }
            var data = await res.json();
            if (!res.ok) { showMessage(data.error || 'Delete failed.', 'error'); return; }
            showMessage('Image deleted.', 'success');
            loadItems();
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    }

    logoutBtn.addEventListener('click', function () {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/admin/login.html';
    });

    // Mobile sidebar
    var sidebar = document.getElementById('admin-sidebar');
    var overlay = document.getElementById('admin-overlay');
    var hamburger = document.getElementById('admin-hamburger');
    if (hamburger) hamburger.addEventListener('click', function () { sidebar.classList.add('open'); overlay.classList.add('open'); });
    if (overlay) overlay.addEventListener('click', function () { sidebar.classList.remove('open'); overlay.classList.remove('open'); });

    function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    loadItems();
})();
