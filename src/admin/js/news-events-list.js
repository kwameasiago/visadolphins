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

    var grid = document.getElementById('posts-grid');
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

    function showSkeleton() {
        var html = '';
        for (var i = 0; i < 6; i++) {
            html += '<div class="admin-skeleton-card"><div class="admin-skeleton-card__image" style="aspect-ratio:16/10;"></div><div class="admin-skeleton-card__body"><div class="admin-skeleton-line admin-skeleton-line--lg"></div><div class="admin-skeleton-line admin-skeleton-line--md" style="margin-top:0.4rem;"></div></div></div>';
        }
        grid.innerHTML = html;
        emptyState.style.display = 'none';
    }

    async function loadPosts() {
        showSkeleton();
        var params = new URLSearchParams({ page: currentPage, per_page: 12 });
        if (searchTerm) params.set('search', searchTerm);

        try {
            var res = await fetch(API_BASE + '/news-events.php?' + params.toString(), { headers: authHeaders() });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/admin/login.html'; return; }
            var data = await res.json();
            renderGrid(data.data);
            renderPagination(data);
        } catch (err) {
            showMessage('Failed to load posts.', 'error');
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
            var thumbHtml = '';
            if (p.thumb_type === 'image' && p.thumb_path) {
                thumbHtml = '<img src="' + p.thumb_path + '" alt="">';
            } else if (p.thumb_type === 'youtube' && p.thumb_path) {
                var ytId = extractYouTubeId(p.thumb_path);
                thumbHtml = ytId ? '<img src="https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg" alt="">' : '<span class="no-image">YT</span>';
            } else if (p.thumb_type === 'video') {
                thumbHtml = '<div class="no-image">🎬</div>';
            } else {
                thumbHtml = '<span class="no-image">No media</span>';
            }

            var excerpt = stripHtml(p.body || '').substring(0, 100);
            var date = new Date(p.created_at).toLocaleDateString();

            var starClass = parseInt(p.star) ? ' starred' : '';
            var starTitle = parseInt(p.star) ? 'Unstar (remove from homepage)' : 'Star (show on homepage)';

            return '<div class="admin-athlete-card" data-id="' + p.public_id + '">' +
                '<div class="admin-athlete-card__image">' + thumbHtml + '</div>' +
                '<div class="admin-athlete-card__info">' +
                    '<h3 class="admin-athlete-card__name">' + escapeHtml(p.title) + '</h3>' +
                    '<p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.25rem;">' + date + '</p>' +
                    '<p style="font-size:0.8rem;color:var(--color-text-muted);margin-top:0.35rem;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + escapeHtml(excerpt) + '</p>' +
                '</div>' +
                '<div class="admin-athlete-card__actions">' +
                    '<button class="btn btn-sm star-btn' + starClass + '" title="' + starTitle + '" data-star="' + (parseInt(p.star) ? '1' : '0') + '">★</button>' +
                    '<a href="/admin/news-event-edit.html?id=' + p.public_id + '" class="btn btn-sm btn-outline">Edit</a>' +
                    '<button class="btn btn-sm btn-danger delete-btn">Delete</button>' +
                '</div>' +
            '</div>';
        }).join('');

        grid.querySelectorAll('.delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.closest('.admin-athlete-card').dataset.id;
                deletePost(id);
            });
        });

        grid.querySelectorAll('.star-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var card = btn.closest('.admin-athlete-card');
                var id = card.dataset.id;
                var currentStar = btn.dataset.star === '1';
                toggleStar(id, !currentStar);
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
                loadPosts();
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

    async function deletePost(publicId) {
        if (!confirm('Delete this post? This cannot be undone.')) return;
        try {
            var res = await fetch(API_BASE + '/news-events.php?id=' + publicId, { method: 'DELETE', headers: authHeaders() });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/admin/login.html'; return; }
            var data = await res.json();
            if (!res.ok) { showMessage(data.error || 'Delete failed.', 'error'); return; }
            showMessage('Post deleted.', 'success');
            loadPosts();
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    }

    async function toggleStar(publicId, newStar) {
        try {
            var formData = new FormData();
            formData.append('star', newStar ? '1' : '0');
            // Send minimal update — API requires title, so fetch it first
            var getRes = await fetch(API_BASE + '/news-events.php?id=' + publicId, { headers: authHeaders() });
            if (getRes.status === 401) { window.location.href = '/admin/login.html'; return; }
            var post = await getRes.json();
            formData.append('title', post.title);
            formData.append('body', post.body || '');

            var res = await fetch(API_BASE + '/news-events.php?id=' + publicId, { method: 'POST', headers: authHeaders(), body: formData });
            if (res.status === 401) { window.location.href = '/admin/login.html'; return; }
            if (!res.ok) { showMessage('Failed to update star.', 'error'); return; }
            showMessage(newStar ? 'Post starred — will show on homepage.' : 'Post unstarred.', 'success');
            loadPosts();
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    }

    // Logout
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
    function stripHtml(html) { var t = document.createElement('div'); t.innerHTML = html; return t.textContent || ''; }
    function extractYouTubeId(url) {
        if (!url) return null;
        var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : null;
    }

    loadPosts();
})();
