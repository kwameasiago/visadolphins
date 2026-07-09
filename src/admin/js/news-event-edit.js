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
    var form = document.getElementById('post-form');
    var formPublicId = document.getElementById('form-public-id');
    var formTitle = document.getElementById('form-title');
    var formSubmitBtn = document.getElementById('form-submit-btn');
    var messageEl = document.getElementById('message');
    var existingMediaEl = document.getElementById('existing-media');
    var newMediaList = document.getElementById('new-media-list');
    var addImageBtn = document.getElementById('add-image-btn');
    var addVideoBtn = document.getElementById('add-video-btn');
    var addYoutubeBtn = document.getElementById('add-youtube-btn');
    var formStar = document.getElementById('form-star');
    var logoutBtn = document.getElementById('logout-btn');

    var params = new URLSearchParams(window.location.search);
    var editId = params.get('id');
    var existingMedia = []; // { id, media_type, media_path, is_thumbnail }
    var removeMediaIds = [];

    // Quill
    var quill = new Quill('#quill-editor', {
        theme: 'snow',
        placeholder: 'Write the post content here...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['blockquote', 'link'],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ]
        }
    });

    function showMessage(text, type) {
        showToast(text, type);
    }

    // ---- Load existing post ----
    if (editId) {
        pageTitle.textContent = 'Edit Post';
        document.title = 'Edit Post — Admin — Visa Dolphins';
        loadPost(editId);
    }

    async function loadPost(publicId) {
        try {
            var res = await fetch(API_BASE + '/news-events.php?id=' + publicId, { headers: authHeaders() });
            if (res.status === 401) { window.location.href = '/admin/login.html'; return; }
            if (!res.ok) { showMessage('Failed to load post.', 'error'); return; }
            var post = await res.json();

            formPublicId.value = post.public_id;
            formTitle.value = post.title;
            quill.root.innerHTML = post.body || '';
            formStar.checked = parseInt(post.star) === 1;

            existingMedia = (post.media || []).map(function (m) {
                return { id: m.id, media_type: m.media_type, media_path: m.media_path, is_thumbnail: parseInt(m.is_thumbnail) };
            });
            renderExistingMedia();
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    }

    // ---- Existing media rendering ----
    function renderExistingMedia() {
        existingMediaEl.innerHTML = '';
        existingMedia.forEach(function (m) {
            var card = document.createElement('div');
            card.className = 'ne-media-card' + (m.is_thumbnail ? ' is-thumb' : '');
            card.dataset.id = m.id;

            var previewHtml = '';
            if (m.media_type === 'image') {
                previewHtml = '<img src="' + m.media_path + '" alt="">';
            } else if (m.media_type === 'youtube') {
                var ytId = extractYouTubeId(m.media_path);
                previewHtml = ytId ? '<img src="https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg" alt="">' : '<div class="ne-media-card__placeholder">YouTube</div>';
            } else if (m.media_type === 'video') {
                previewHtml = '<video src="' + m.media_path + '" muted></video>';
            }

            card.innerHTML =
                '<div class="ne-media-card__preview">' + previewHtml + '</div>' +
                '<div class="ne-media-card__actions">' +
                    '<label class="ne-media-card__thumb-label">' +
                        '<input type="radio" name="thumbnail" value="' + m.id + '" ' + (m.is_thumbnail ? 'checked' : '') + '>' +
                        ' Thumbnail' +
                    '</label>' +
                    '<button type="button" class="ne-media-card__remove" title="Remove">&times;</button>' +
                '</div>' +
                '<div class="ne-media-card__type">' + m.media_type + '</div>';

            card.querySelector('.ne-media-card__remove').addEventListener('click', function () {
                removeMediaIds.push(m.id);
                existingMedia = existingMedia.filter(function (x) { return x.id !== m.id; });
                renderExistingMedia();
            });

            existingMediaEl.appendChild(card);
        });
    }

    // ---- Add new media ----
    var newMediaCounter = 0;

    function addMediaRow(type) {
        var idx = newMediaCounter++;
        var row = document.createElement('div');
        row.className = 'ne-media-add-row';
        row.dataset.idx = idx;
        row.dataset.type = type;

        var inputHtml = '';
        var icon = '';
        if (type === 'image') {
            icon = '🖼️';
            inputHtml =
                '<div class="ne-media-add-row__dropzone" data-idx="' + idx + '">' +
                    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' +
                    '<span>Click to choose image or drag & drop</span>' +
                    '<input type="file" class="ne-media-add-row__file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;">' +
                '</div>' +
                '<div class="ne-media-add-row__preview"></div>';
        } else if (type === 'video') {
            icon = '🎬';
            inputHtml =
                '<div class="ne-media-add-row__dropzone" data-idx="' + idx + '">' +
                    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>' +
                    '<span>Click to choose video or drag & drop</span>' +
                    '<input type="file" class="ne-media-add-row__file" accept="video/mp4,video/webm,video/quicktime" style="display:none;">' +
                '</div>' +
                '<div class="ne-media-add-row__preview"></div>';
        } else {
            icon = '▶️';
            inputHtml = '<input type="text" class="ne-media-add-row__url" placeholder="https://www.youtube.com/watch?v=...">';
        }

        row.innerHTML =
            '<div class="ne-media-add-row__header">' +
                '<span>' + icon + ' ' + type.charAt(0).toUpperCase() + type.slice(1) + '</span>' +
                '<button type="button" class="ne-media-add-row__remove" title="Remove">&times;</button>' +
            '</div>' +
            '<div class="ne-media-add-row__input">' + inputHtml + '</div>' +
            '<label class="ne-media-card__thumb-label" style="margin-top:0.5rem;">' +
                '<input type="radio" name="thumbnail" value="new-' + idx + '">' +
                ' Use as thumbnail' +
            '</label>';

        // Wire up dropzone
        if (type === 'image' || type === 'video') {
            var dropzone = row.querySelector('.ne-media-add-row__dropzone');
            var fileInput = row.querySelector('.ne-media-add-row__file');
            var previewEl = row.querySelector('.ne-media-add-row__preview');

            dropzone.addEventListener('click', function () { fileInput.click(); });
            dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('dragover'); });
            dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('dragover'); });
            dropzone.addEventListener('drop', function (e) {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    fileInput.dispatchEvent(new Event('change'));
                }
            });

            fileInput.addEventListener('change', function () {
                if (!fileInput.files[0]) return;
                var file = fileInput.files[0];
                dropzone.style.display = 'none';
                if (type === 'image') {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        previewEl.innerHTML = '<img src="' + e.target.result + '" alt=""><span class="ne-media-add-row__filename">' + escapeHtml(file.name) + '</span>';
                    };
                    reader.readAsDataURL(file);
                } else {
                    previewEl.innerHTML = '<span class="ne-media-add-row__filename">🎬 ' + escapeHtml(file.name) + ' (' + formatBytes(file.size) + ')</span>';
                }
            });
        }

        row.querySelector('.ne-media-add-row__remove').addEventListener('click', function () { row.remove(); });
        newMediaList.appendChild(row);
    }

    addImageBtn.addEventListener('click', function () { addMediaRow('image'); });
    addVideoBtn.addEventListener('click', function () { addMediaRow('video'); });
    addYoutubeBtn.addEventListener('click', function () { addMediaRow('youtube'); });

    // ---- Submit ----
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var title = formTitle.value.trim();
        if (!title) { formTitle.focus(); showMessage('Title is required.', 'error'); return; }

        var publicId = formPublicId.value;
        var formData = new FormData();
        formData.append('title', title);
        formData.append('body', quill.root.innerHTML);
        formData.append('star', formStar.checked ? '1' : '0');
        formData.append('remove_media', JSON.stringify(removeMediaIds));

        // Determine thumbnail
        var selectedThumb = form.querySelector('input[name="thumbnail"]:checked');
        var thumbVal = selectedThumb ? selectedThumb.value : '';

        // Existing media thumbnail
        if (thumbVal && !thumbVal.startsWith('new-')) {
            formData.append('thumbnail_id', thumbVal);
        }

        // Collect new media
        var youtubeLinks = [];
        var fileTypes = [];
        var newThumbIndex = -1;
        var fileIndex = 0;

        newMediaList.querySelectorAll('.ne-media-add-row').forEach(function (row) {
            var type = row.dataset.type;
            var thumbRadio = row.querySelector('input[name="thumbnail"]');
            var isThumb = thumbRadio && thumbRadio.checked;

            if (type === 'youtube') {
                var urlInput = row.querySelector('.ne-media-add-row__url');
                var url = urlInput ? urlInput.value.trim() : '';
                if (url) {
                    if (isThumb) newThumbIndex = youtubeLinks.length;
                    youtubeLinks.push(url);
                }
            } else {
                var fileInput = row.querySelector('.ne-media-add-row__file');
                if (fileInput && fileInput.files[0]) {
                    if (isThumb) newThumbIndex = youtubeLinks.length + fileIndex;
                    formData.append('media_files[]', fileInput.files[0]);
                    fileTypes.push(type);
                    fileIndex++;
                }
            }
        });

        formData.append('media_youtube', JSON.stringify(youtubeLinks));
        formData.append('media_file_types', JSON.stringify(fileTypes));

        if (publicId) {
            formData.append('new_thumbnail_index', newThumbIndex);
        } else {
            // For create, calculate absolute thumbnail index
            var thumbIdx = 0;
            if (thumbVal && thumbVal.startsWith('new-')) {
                thumbIdx = newThumbIndex >= 0 ? newThumbIndex : 0;
            }
            formData.append('thumbnail_index', thumbIdx);
        }

        var url = API_BASE + '/news-events.php';
        if (publicId) url += '?id=' + publicId;

        formSubmitBtn.disabled = true;
        formSubmitBtn.innerHTML = '<span class="spinner"></span> Saving...';

        try {
            var res = await fetch(url, { method: 'POST', headers: authHeaders(), body: formData });
            if (res.status === 401) { window.location.href = '/admin/login.html'; return; }

            var responseText = await res.text();
            var data;
            try { data = JSON.parse(responseText); } catch (pe) {
                showMessage('Server error: ' + (res.status === 413 ? 'File too large.' : 'Invalid response.'), 'error');
                return;
            }

            if (!res.ok) { showMessage(data.error || 'Failed to save.', 'error'); return; }

            showMessage(publicId ? 'Post updated!' : 'Post created!', 'success');

            if (!publicId && data.public_id) {
                // Redirect to edit page for the new post
                window.location.href = '/admin/news-event-edit.html?id=' + data.public_id;
            } else {
                // Reload to refresh media
                removeMediaIds = [];
                newMediaList.innerHTML = '';
                loadPost(publicId);
            }
        } catch (err) {
            showMessage('Network error — please try again.', 'error');
        } finally {
            formSubmitBtn.disabled = false;
            formSubmitBtn.textContent = 'Save Post';
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

    // Helpers
    function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    function extractYouTubeId(url) {
        if (!url) return null;
        var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : null;
    }
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }
})();
