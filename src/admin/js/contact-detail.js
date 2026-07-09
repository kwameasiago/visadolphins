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

    var params = new URLSearchParams(window.location.search);
    var itemId = params.get('id');
    if (!itemId) { window.location.href = '/admin/contact-submissions.html'; return; }

    var pageTitle = document.getElementById('page-title');
    var detailContent = document.getElementById('detail-content');
    var deleteBtn = document.getElementById('delete-btn');
    var messageEl = document.getElementById('message');
    var logoutBtn = document.getElementById('logout-btn');

    function showMessage(text, type) {
        showToast(text, type);
    }

    async function loadDetail() {
        try {
            var res = await fetch(API_BASE + '/contact-submissions.php?id=' + itemId, { headers: authHeaders() });
            if (res.status === 401) { window.location.href = '/admin/login.html'; return; }
            if (!res.ok) { showMessage('Message not found.', 'error'); return; }

            var item = await res.json();

            pageTitle.textContent = 'Message from ' + item.name;
            document.getElementById('detail-name').textContent = item.name;
            document.getElementById('detail-email').textContent = item.email || '—';
            document.getElementById('detail-phone').textContent = item.phone || '—';
            document.getElementById('detail-subject').textContent = formatSubject(item.subject);
            document.getElementById('detail-date').textContent = formatDate(item.created_at);
            document.getElementById('detail-message').textContent = item.message;

            detailContent.style.display = '';
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    }

    deleteBtn.addEventListener('click', async function () {
        if (!confirm('Delete this message? This cannot be undone.')) return;
        try {
            var res = await fetch(API_BASE + '/contact-submissions.php?id=' + itemId, { method: 'DELETE', headers: authHeaders() });
            if (res.status === 401) { window.location.href = '/admin/login.html'; return; }
            var data = await res.json();
            if (!res.ok) { showMessage(data.error || 'Delete failed.', 'error'); return; }
            window.location.href = '/admin/contact-submissions.html';
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    });

    function formatSubject(val) {
        var map = {
            'swim-club': 'Swim Club Enquiry',
            'school': 'SwimKenya School',
            'equipment': 'Sports Equipment',
            'partnership': 'Partnership / Sponsorship',
            'other': 'Other'
        };
        return map[val] || val || '—';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        var d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

    loadDetail();
})();
