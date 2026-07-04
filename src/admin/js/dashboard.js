(function () {
    var TOKEN_KEY = 'admin_token';

    // ---- Auth check ----
    function getToken() { return localStorage.getItem(TOKEN_KEY); }

    function checkAuth() {
        var token = getToken();
        if (!token) { window.location.href = '/admin/login.html'; return false; }
        try {
            var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp * 1000 < Date.now()) {
                localStorage.removeItem(TOKEN_KEY);
                window.location.href = '/admin/login.html';
                return false;
            }
        } catch (e) {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/admin/login.html';
            return false;
        }
        return true;
    }

    if (!checkAuth()) return;

    // ---- Logout ----
    document.getElementById('logout-btn').addEventListener('click', function () {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/admin/login.html';
    });

    // ---- Mobile sidebar toggle ----
    var sidebar = document.getElementById('admin-sidebar');
    var overlay = document.getElementById('admin-overlay');
    var hamburger = document.getElementById('admin-hamburger');

    if (hamburger) {
        hamburger.addEventListener('click', function () {
            sidebar.classList.add('open');
            overlay.classList.add('open');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    // ---- Todo persistence (localStorage) ----
    var TODOS_KEY = 'admin_todos';
    var checkboxes = document.querySelectorAll('.todo-checkbox');
    var saved = JSON.parse(localStorage.getItem(TODOS_KEY) || '{}');

    checkboxes.forEach(function (cb) {
        if (saved[cb.id]) {
            cb.checked = true;
            cb.parentElement.classList.add('completed');
        }

        cb.addEventListener('change', function () {
            var state = JSON.parse(localStorage.getItem(TODOS_KEY) || '{}');
            if (cb.checked) {
                state[cb.id] = true;
                cb.parentElement.classList.add('completed');
            } else {
                delete state[cb.id];
                cb.parentElement.classList.remove('completed');
            }
            localStorage.setItem(TODOS_KEY, JSON.stringify(state));
        });
    });
})();
