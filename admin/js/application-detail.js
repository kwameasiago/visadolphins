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

    var params = new URLSearchParams(window.location.search);
    var itemId = params.get('id');
    if (!itemId) { window.location.href = '/applications.html'; return; }

    var pageTitle = document.getElementById('page-title');
    var detailContent = document.getElementById('detail-content');
    var deleteBtn = document.getElementById('delete-btn');
    var messageEl = document.getElementById('message');
    var logoutBtn = document.getElementById('logout-btn');

    function showMessage(text, type) {
        showToast(text, type);
    }

    var skeletonEl = document.getElementById('detail-skeleton');

    async function loadDetail() {
        try {
            var res = await fetch(API_BASE + '/applications.php?id=' + itemId, { headers: authHeaders() });
            if (res.status === 401) { window.location.href = '/login.html'; return; }
            if (!res.ok) { showMessage('Application not found.', 'error'); return; }

            var item = await res.json();

            var typeLabel = item.form_type === 'swimming' ? 'Swimming Class' : 'Corporate / School';
            pageTitle.textContent = typeLabel + ' — ' + item.name;

            document.getElementById('detail-type').textContent = typeLabel;
            document.getElementById('detail-name').textContent = item.name;
            document.getElementById('detail-phone').textContent = item.phone || '—';
            document.getElementById('detail-email').textContent = item.email || '—';
            document.getElementById('detail-date').textContent = formatDate(item.created_at);

            if (item.form_type === 'swimming') {
                document.getElementById('field-level').style.display = '';
                document.getElementById('detail-level').textContent = item.level || '—';
            } else {
                document.getElementById('field-school').style.display = '';
                document.getElementById('detail-school').textContent = item.school_name || '—';
                document.getElementById('field-students').style.display = '';
                document.getElementById('detail-students').textContent = item.num_students || '—';
            }

            skeletonEl.style.display = 'none';
            detailContent.style.display = '';
        } catch (err) {
            skeletonEl.style.display = 'none';
            showMessage('Network error.', 'error');
        }
    }

    deleteBtn.addEventListener('click', async function () {
        if (!confirm('Delete this application? This cannot be undone.')) return;
        try {
            var res = await fetch(API_BASE + '/applications.php?id=' + itemId, { method: 'DELETE', headers: authHeaders() });
            if (res.status === 401) { window.location.href = '/login.html'; return; }
            var data = await res.json();
            if (!res.ok) { showMessage(data.error || 'Delete failed.', 'error'); return; }
            window.location.href = '/applications.html';
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    });

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

    loadDetail();
})();
