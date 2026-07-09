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

    // DOM
    var pageTitle = document.getElementById('page-title');
    var form = document.getElementById('equip-form');
    var formPublicId = document.getElementById('form-public-id');
    var formName = document.getElementById('form-name');
    var formCategory = document.getElementById('form-category');
    var formPrice = document.getElementById('form-price');
    var formDescription = document.getElementById('form-description');
    var formSizes = document.getElementById('form-sizes');
    var formImage = document.getElementById('form-image');
    var imageDropzone = document.getElementById('image-dropzone');
    var imagePreview = document.getElementById('image-preview');
    var featuresList = document.getElementById('features-list');
    var addFeatureBtn = document.getElementById('add-feature-btn');
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
            imagePreview.innerHTML = '<img src="' + e.target.result + '" alt="" style="max-height:180px;border-radius:var(--radius-sm);">' +
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

    // ---- Features ----
    function addFeatureRow(value) {
        var row = document.createElement('div');
        row.className = 'ne-media-add-row';
        row.style.padding = '0.75rem';
        row.innerHTML =
            '<div style="display:flex;gap:0.5rem;align-items:center;">' +
                '<input type="text" class="feature-input" value="' + escapeHtml(value || '') + '" placeholder="e.g. Anti-fog & UV-protected lenses" style="flex:1;padding:0.5rem 0.75rem;background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-sm);color:var(--color-text);font-size:0.85rem;">' +
                '<button type="button" class="ne-media-add-row__remove" title="Remove">&times;</button>' +
            '</div>';
        row.querySelector('.ne-media-add-row__remove').addEventListener('click', function () { row.remove(); });
        featuresList.appendChild(row);
    }

    addFeatureBtn.addEventListener('click', function () { addFeatureRow(''); });

    // ---- Load existing ----
    if (editId) {
        pageTitle.textContent = 'Edit Equipment';
        document.title = 'Edit Equipment — Admin — Visa Dolphins';
        loadItem(editId);
    }

    async function loadItem(publicId) {
        try {
            var res = await fetch(API_BASE + '/equipment.php?id=' + publicId, { headers: authHeaders() });
            if (res.status === 401) { window.location.href = '/admin/login.html'; return; }
            if (!res.ok) { showMessage('Failed to load item.', 'error'); return; }
            var item = await res.json();

            formPublicId.value = item.public_id;
            formName.value = item.name || '';
            formCategory.value = item.category || '';
            formPrice.value = item.price || '';
            formDescription.value = item.description || '';
            formSizes.value = item.sizes || '';

            // Show existing image
            if (item.image_path) {
                imageDropzone.style.display = 'none';
                imagePreview.innerHTML = '<img src="' + item.image_path + '" alt="" style="max-height:180px;border-radius:var(--radius-sm);">' +
                    '<p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.35rem;">Current image</p>';
            }

            // Load features
            if (item.features && item.features.length) {
                item.features.forEach(function (f) {
                    addFeatureRow(f.feature || f);
                });
            }
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    }

    // ---- Submit ----
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var name = formName.value.trim();
        if (!name) { formName.focus(); showMessage('Name is required.', 'error'); return; }

        var publicId = formPublicId.value;
        var formData = new FormData();
        formData.append('name', name);
        formData.append('category', formCategory.value.trim());
        formData.append('price', formPrice.value.trim());
        formData.append('description', formDescription.value.trim());
        formData.append('sizes', formSizes.value.trim());

        if (formImage.files[0]) {
            formData.append('image', formImage.files[0]);
        }

        // Collect features
        var features = [];
        featuresList.querySelectorAll('.feature-input').forEach(function (input) {
            var v = input.value.trim();
            if (v) features.push(v);
        });
        formData.append('features', JSON.stringify(features));

        var url = API_BASE + '/equipment.php';
        if (publicId) url += '?id=' + publicId;

        formSubmitBtn.disabled = true;
        formSubmitBtn.textContent = 'Saving...';

        try {
            var res = await fetch(url, { method: 'POST', headers: authHeaders(), body: formData });
            if (res.status === 401) { window.location.href = '/admin/login.html'; return; }

            var data = await res.json();
            if (!res.ok) { showMessage(data.error || 'Failed to save.', 'error'); return; }

            showMessage(publicId ? 'Updated!' : 'Created!', 'success');

            if (!publicId && data.public_id) {
                window.location.href = '/admin/equipment-edit.html?id=' + data.public_id;
            }
        } catch (err) {
            showMessage('Network error.', 'error');
        } finally {
            formSubmitBtn.disabled = false;
            formSubmitBtn.textContent = 'Save';
        }
    });

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
})();
