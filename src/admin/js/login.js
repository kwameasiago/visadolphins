(function () {
    const API_BASE = '/api';

    const loginForm = document.getElementById('login-form');
    const forgotForm = document.getElementById('forgot-form');
    const forgotLink = document.getElementById('forgot-link');
    const backToLogin = document.getElementById('back-to-login');
    const forgotSection = document.getElementById('forgot-section');
    const messageEl = document.getElementById('message');
    const forgotMessageEl = document.getElementById('forgot-message');
    const resetLinkDisplay = document.getElementById('reset-link-display');
    const resetLinkValue = document.getElementById('reset-link-value');

    // ---- Helpers ----
    function showMessage(el, text, type) {
        el.textContent = text;
        el.className = 'message show message--' + type;
    }

    function hideMessage(el) {
        el.className = 'message';
        el.textContent = '';
    }

    // ---- Login ----
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideMessage(messageEl);

        const btn = document.getElementById('login-btn');
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showMessage(messageEl, 'Please fill in all fields.', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Signing in...';

        try {
            const res = await fetch(API_BASE + '/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                showMessage(messageEl, data.error || 'Login failed.', 'error');
                return;
            }

            localStorage.setItem('admin_token', data.token);
            showMessage(messageEl, 'Login successful!', 'success');
            loginForm.style.display = 'none';
            document.querySelector('.admin-links').style.display = 'none';
        } catch (err) {
            showMessage(messageEl, 'Network error. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Sign In';
        }
    });

    // ---- Toggle forgot password ----
    forgotLink.addEventListener('click', function (e) {
        e.preventDefault();
        forgotSection.classList.add('show');
        loginForm.style.display = 'none';
        forgotLink.parentElement.style.display = 'none';
        hideMessage(messageEl);
    });

    backToLogin.addEventListener('click', function (e) {
        e.preventDefault();
        forgotSection.classList.remove('show');
        resetLinkDisplay.classList.remove('show');
        loginForm.style.display = '';
        forgotLink.parentElement.style.display = '';
        hideMessage(forgotMessageEl);
    });

    // ---- Forgot password ----
    forgotForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideMessage(forgotMessageEl);
        resetLinkDisplay.classList.remove('show');

        const btn = document.getElementById('forgot-btn');
        const email = document.getElementById('reset-email').value.trim();

        if (!email) {
            showMessage(forgotMessageEl, 'Please enter your email.', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Sending...';

        try {
            const res = await fetch(API_BASE + '/forgot-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                showMessage(forgotMessageEl, data.error || 'Request failed.', 'error');
                return;
            }

            showMessage(forgotMessageEl, data.message, 'success');

            // Show reset link for dev use
            if (data.reset_link) {
                resetLinkValue.textContent = data.reset_link;
                resetLinkDisplay.classList.add('show');
            }
        } catch (err) {
            showMessage(forgotMessageEl, 'Network error. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Send Reset Link';
        }
    });
})();
