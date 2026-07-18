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

    // ---- Image dropzone (supports multiple) ----
    var selectedFiles = [];

    imageDropzone.addEventListener('click', function () { formImage.click(); });
    imageDropzone.addEventListener('dragover', function (e) { e.preventDefault(); imageDropzone.classList.add('dragover'); });
    imageDropzone.addEventListener('dragleave', function () { imageDropzone.classList.remove('dragover'); });
    imageDropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        imageDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            addFiles(e.dataTransfer.files);
        }
    });
    formImage.addEventListener('change', function () {
        if (!formImage.files.length) return;
        addFiles(formImage.files);
        formImage.value = '';
    });

    function addFiles(fileList) {
        for (var i = 0; i < fileList.length; i++) {
            selectedFiles.push(fileList[i]);
        }
        renderPreviews();
    }

    function renderPreviews() {
        imagePreview.innerHTML = '';
        if (selectedFiles.length === 0) {
            imageDropzone.style.display = '';
            return;
        }
        imageDropzone.style.display = 'none';

        selectedFiles.forEach(function (file, idx) {
            var card = document.createElement('div');
            card.style.cssText = 'position:relative;border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:0.5rem;max-width:150px;';
            var reader = new FileReader();
            reader.onload = function (e) {
                card.innerHTML = '<img src="' + e.target.result + '" alt="" style="width:100%;height:100px;object-fit:cover;border-radius:var(--radius-sm);">' +
                    '<p style="font-size:0.65rem;color:var(--color-text-muted);margin-top:0.25rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(file.name) + '</p>' +
                    '<button type="button" class="btn btn-sm btn-danger" style="margin-top:0.25rem;width:100%;font-size:0.65rem;" data-idx="' + idx + '">Remove</button>';
                card.querySelector('button').addEventListener('click', function () {
                    selectedFiles.splice(idx, 1);
                    renderPreviews();
                });
            };
            reader.readAsDataURL(file);
            imagePreview.appendChild(card);
        });

        // Add "Add More" button
        var addMoreBtn = document.createElement('div');
        addMoreBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;border:2px dashed var(--color-border);border-radius:var(--radius-sm);width:150px;min-height:100px;cursor:pointer;';
        addMoreBtn.innerHTML = '<span style="font-size:2rem;color:var(--color-text-muted);">+</span>';
        addMoreBtn.addEventListener('click', function () { formImage.click(); });
        imagePreview.appendChild(addMoreBtn);
    }

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

        // Edit mode — single image update
        if (publicId) {
            var formData = new FormData();
            formData.append('tag', formTag.value.trim());
            formData.append('caption', formCaption.value.trim());
            if (selectedFiles.length > 0) {
                formData.append('image', selectedFiles[0]);
            }

            formSubmitBtn.disabled = true;
            formSubmitBtn.textContent = 'Saving...';

            try {
                var res = await fetch(API_BASE + '/gallery.php?id=' + publicId, { method: 'POST', headers: authHeaders(), body: formData });
                if (res.status === 401) { window.location.href = '/login.html'; return; }
                var data = await res.json();
                if (!res.ok) { showMessage(data.error || 'Failed to save.', 'error'); return; }
                showMessage('Updated!', 'success');
            } catch (err) {
                showMessage('Network error.', 'error');
            } finally {
                formSubmitBtn.disabled = false;
                formSubmitBtn.textContent = 'Save';
            }
            return;
        }

        // New upload — multiple images
        if (selectedFiles.length === 0) {
            showMessage('Please select at least one image.', 'error');
            return;
        }

        formSubmitBtn.disabled = true;
        var total = selectedFiles.length;
        var uploaded = 0;
        var failed = 0;

        for (var i = 0; i < total; i++) {
            formSubmitBtn.textContent = 'Uploading ' + (i + 1) + '/' + total + '...';

            var formData = new FormData();
            formData.append('tag', formTag.value.trim());
            formData.append('caption', formCaption.value.trim());
            formData.append('image', selectedFiles[i]);

            try {
                var res = await fetch(API_BASE + '/gallery.php', { method: 'POST', headers: authHeaders(), body: formData });
                if (res.status === 401) { window.location.href = '/login.html'; return; }
                var data = await res.json();
                if (res.ok) { uploaded++; } else { failed++; }
            } catch (err) {
                failed++;
            }
        }

        if (failed === 0) {
            showMessage('Uploaded ' + uploaded + ' image' + (uploaded > 1 ? 's' : '') + ' successfully!', 'success');
        } else {
            showMessage('Uploaded ' + uploaded + ', failed ' + failed + '.', 'error');
        }

        selectedFiles = [];
        renderPreviews();
        formSubmitBtn.disabled = false;
        formSubmitBtn.textContent = 'Upload';
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
