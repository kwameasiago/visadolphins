(function () {
    const API_BASE = '/api';
    const messageEl = document.getElementById('message');
    const resetForm = document.getElementById('reset-form');

    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    function showMessage(text, type) {
        messageEl.textContent = text;
        messageEl.className = 'message show message--' + type;
    }

    // Validate token presence
    if (!token) {
        showMessage('Invalid reset link. No token provided.', 'error');
        resetForm.style.display = 'none';
        return;
    }

    resetForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const btn = document.getElementById('reset-btn');
        const password = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-password').value;

        if (!password || !confirm) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }

        if (password !== confirm) {
            showMessage('Passwords do not match.', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters.', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Resetting...';

        try {
            const res = await fetch(API_BASE + '/reset-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                showMessage(data.error || 'Reset failed.', 'error');
                return;
            }

            showMessage(data.message || 'Password reset successfully!', 'success');
            resetForm.style.display = 'none';
        } catch (err) {
            showMessage('Network error. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Reset Password';
        }
    });
})();
