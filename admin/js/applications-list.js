(function () {
    var TOKEN_KEY = 'admin_token';
    var API_BASE = APP_CONFIG.API_BASE_URL + '/admin';

    function getToken() { return localStorage.getItem(TOKEN_KEY); }
    function authHeaders() { return { 'Authorization': 'Bearer ' + getToken() }; }

    function checkAuth() {
        var token = getToken();
        if (!token) { window.location.href = '/login.html'; return false; }
        try {
            var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp * 1000 < Date.now()) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/login.html'; return false; }
        } catch (e) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/login.html'; return false; }
        return true;
    }

    if (!checkAuth()) return;

    var tbody = document.getElementById('items-tbody');
    var emptyState = document.getElementById('empty-state');
    var pagination = document.getElementById('pagination');
    var searchInput = document.getElementById('search-input');
    var unreadBadge = document.getElementById('unread-badge');
    var messageEl = document.getElementById('message');
    var logoutBtn = document.getElementById('logout-btn');
    var filterTabs = document.querySelectorAll('.admin-filter-tab');

    var currentPage = 1;
    var searchTerm = '';
    var typeFilter = '';
    var searchTimeout;

    function showMessage(text, type) {
        showToast(text, type);
    }

    function showSkeleton() {
        var html = '';
        for (var i = 0; i < 5; i++) {
            html += '<tr><td><div class="admin-skeleton-circle"></div></td><td><div class="admin-skeleton-line admin-skeleton-line--sm"></div></td><td><div class="admin-skeleton-line admin-skeleton-line--lg"></div></td><td><div class="admin-skeleton-line admin-skeleton-line--md"></div></td><td><div class="admin-skeleton-line admin-skeleton-line--md"></div></td><td><div class="admin-skeleton-line admin-skeleton-line--sm"></div></td><td><div class="admin-skeleton-line admin-skeleton-line--xs"></div></td></tr>';
        }
        tbody.innerHTML = html;
        document.querySelector('.admin-table-wrapper').style.display = '';
        emptyState.style.display = 'none';
    }

    async function loadItems() {
        showSkeleton();
        var params = new URLSearchParams({ page: currentPage, per_page: 20 });
        if (searchTerm) params.set('search', searchTerm);
        if (typeFilter) params.set('type', typeFilter);

        try {
            var res = await fetch(API_BASE + '/applications.php?' + params.toString(), { headers: authHeaders() });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/login.html'; return; }
            var data = await res.json();
            renderTable(data.data);
            renderPagination(data);
            updateUnreadBadge(data.unread);
        } catch (err) {
            showMessage('Failed to load applications.', 'error');
        }
    }

    function updateUnreadBadge(count) {
        if (count > 0) {
            unreadBadge.textContent = count + ' unread';
            unreadBadge.style.display = '';
        } else {
            unreadBadge.style.display = 'none';
        }
    }

    function renderTable(items) {
        if (!items || items.length === 0) {
            tbody.innerHTML = '';
            document.querySelector('.admin-table-wrapper').style.display = 'none';
            emptyState.style.display = '';
            return;
        }
        document.querySelector('.admin-table-wrapper').style.display = '';
        emptyState.style.display = 'none';

        tbody.innerHTML = items.map(function (item) {
            var isUnread = !parseInt(item.is_read);
            var dot = isUnread ? '<span class="unread-dot"></span>' : '';
            var rowClass = isUnread ? ' class="row-unread"' : '';
            var typeBadge = item.form_type === 'swimming'
                ? '<span class="type-badge type-badge--swimming">Swimming</span>'
                : '<span class="type-badge type-badge--corporate">Corporate</span>';
            var detail = item.form_type === 'swimming'
                ? (item.level || '—')
                : (item.school_name || '—');
            var dateStr = formatDate(item.created_at);

            return '<tr' + rowClass + ' data-id="' + item.public_id + '">' +
                '<td>' + dot + '</td>' +
                '<td>' + typeBadge + '</td>' +
                '<td><strong>' + escapeHtml(item.name) + '</strong></td>' +
                '<td>' + escapeHtml(detail) + '</td>' +
                '<td>' + escapeHtml(item.email || '—') + '</td>' +
                '<td>' + dateStr + '</td>' +
                '<td><button class="btn btn-sm btn-danger delete-btn">Delete</button></td>' +
            '</tr>';
        }).join('');

        tbody.querySelectorAll('tr').forEach(function (row) {
            row.addEventListener('click', function (e) {
                if (e.target.closest('.delete-btn')) return;
                window.location.href = '/application-detail.html?id=' + row.dataset.id;
            });
        });

        tbody.querySelectorAll('.delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var id = btn.closest('tr').dataset.id;
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

    // Filter tabs
    filterTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            filterTabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            typeFilter = tab.dataset.type;
            currentPage = 1;
            loadItems();
        });
    });

    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            searchTerm = searchInput.value.trim();
            currentPage = 1;
            loadItems();
        }, 300);
    });

    async function deleteItem(publicId) {
        if (!confirm('Delete this application? This cannot be undone.')) return;
        try {
            var res = await fetch(API_BASE + '/applications.php?id=' + publicId, { method: 'DELETE', headers: authHeaders() });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/login.html'; return; }
            var data = await res.json();
            if (!res.ok) { showMessage(data.error || 'Delete failed.', 'error'); return; }
            showMessage('Application deleted.', 'success');
            loadItems();
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    logoutBtn.addEventListener('click', function () {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login.html';
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
