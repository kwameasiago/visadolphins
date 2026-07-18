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

    var pageTitle = document.getElementById('page-title');
    var form = document.getElementById('gallery-form');
    var formPublicId = document.getElementById('form-public-id');
    var formImage = document.getElementById('form-image');
    var imageDropzone = document.getElementById('image-dropzone');
    var imagePreview = document.getElementById('image-preview');
    var formTag = document.getElementById('form-tag');
    var formCaption = document.getElementById('form-caption');
    var formSubmitBtn = document.getElementById('form-submit-btn');
    var messageEl = document.getElementById('message');
    var logoutBtn = document.getElementById('logout-btn');

    var params = new URLSearchParams(window.location.search);
    var editId = params.get('id');

    function showMessage(text, type) {
        showToast(text, type);
    }

    // ---- Image dropzone ----
    imageDropzone.addEventListener('click', function () { formImage.click(); });
    imageDropzone.addEventListener('dragover', function (e) { e.preventDefault(); imageDropzone.classList.add('dragover'); });
    imageDropzone.addEventListener('dragleave', function () { imageDropzone.classList.remove('dragover'); });
    imageDropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        imageDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            formImage.files = e.dataTransfer.files;
            formImage.dispatchEvent(new Event('change'));
        }
    });
    formImage.addEventListener('change', function () {
        if (!formImage.files[0]) return;
        var file = formImage.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            imageDropzone.style.display = 'none';
            imagePreview.innerHTML = '<img src="' + e.target.result + '" alt="" style="max-height:250px;border-radius:var(--radius-sm);">' +
                '<p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.35rem;">' + escapeHtml(file.name) + '</p>' +
                '<button type="button" class="btn btn-sm btn-outline" style="margin-top:0.5rem;" id="remove-image-btn">Remove</button>';
            imagePreview.querySelector('#remove-image-btn').addEventListener('click', function () {
                formImage.value = '';
                imagePreview.innerHTML = '';
                imageDropzone.style.display = '';
            });
        };
        reader.readAsDataURL(file);
    });

    // ---- Load existing ----
    if (editId) {
        pageTitle.textContent = 'Edit Image';
        document.title = 'Edit Image — Admin — Visa Dolphins';
        formSubmitBtn.textContent = 'Save';
        loadItem(editId);
    }

    async function loadItem(publicId) {
        try {
            var res = await fetch(API_BASE + '/gallery.php?id=' + publicId, { headers: authHeaders() });
            if (res.status === 401) { window.location.href = '/login.html'; return; }
            if (!res.ok) { showMessage('Failed to load image.', 'error'); return; }
            var item = await res.json();

            formPublicId.value = item.public_id;
            formTag.value = item.tag || '';
            formCaption.value = item.caption || '';

            if (item.image_path) {
                imageDropzone.style.display = 'none';
                imagePreview.innerHTML = '<img src="' + resolveUploadUrl(item.image_path) + '" alt="" style="max-height:250px;border-radius:var(--radius-sm);">' +
                    '<p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.35rem;">Current image</p>';
            }
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    }

    // ---- Submit ----
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var publicId = formPublicId.value;

        // New upload must have image
        if (!publicId && !formImage.files[0]) {
            showMessage('Please select an image.', 'error');
            return;
        }

        var formData = new FormData();
        formData.append('tag', formTag.value.trim());
        formData.append('caption', formCaption.value.trim());

        if (formImage.files[0]) {
            formData.append('image', formImage.files[0]);
        }

        var url = API_BASE + '/gallery.php';
        if (publicId) url += '?id=' + publicId;

        formSubmitBtn.disabled = true;
        formSubmitBtn.textContent = 'Saving...';

        try {
            var res = await fetch(url, { method: 'POST', headers: authHeaders(), body: formData });
            if (res.status === 401) { window.location.href = '/login.html'; return; }

            var data = await res.json();
            if (!res.ok) { showMessage(data.error || 'Failed to save.', 'error'); return; }

            showMessage(publicId ? 'Updated!' : 'Uploaded!', 'success');

            if (!publicId && data.public_id) {
                window.location.href = '/gallery-upload.html?id=' + data.public_id;
            }
        } catch (err) {
            showMessage('Network error.', 'error');
        } finally {
            formSubmitBtn.disabled = false;
            formSubmitBtn.textContent = publicId ? 'Save' : 'Upload';
        }
    });

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
})();
