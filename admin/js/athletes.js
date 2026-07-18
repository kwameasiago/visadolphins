(function () {
    const API_BASE = APP_CONFIG.API_BASE_URL + '/admin';
    const TOKEN_KEY = 'admin_token';

    // ---- Auth ----
    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function authHeaders() {
        return { 'Authorization': 'Bearer ' + getToken() };
    }

    function checkAuth() {
        const token = getToken();
        if (!token) {
            window.location.href = '/login.html';
            return false;
        }
        // Basic expiry check
        try {
            var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp * 1000 < Date.now()) {
                localStorage.removeItem(TOKEN_KEY);
                window.location.href = '/login.html';
                return false;
            }
        } catch (e) {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    if (!checkAuth()) return;

    // ---- DOM refs ----
    const grid = document.getElementById('athletes-grid');
    const emptyState = document.getElementById('empty-state');
    const paginationEl = document.getElementById('pagination');
    const searchInput = document.getElementById('search-input');
    const messageEl = document.getElementById('message');
    const modal = document.getElementById('athlete-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalClose = document.getElementById('modal-close');
    const form = document.getElementById('athlete-form');
    const formPublicId = document.getElementById('form-public-id');
    const formName = document.getElementById('form-name');
    const formImage = document.getElementById('form-image');
    const imagePreview = document.getElementById('image-preview');
    const imagePickBtn = document.getElementById('image-pick-btn');
    const pbList = document.getElementById('pb-list');
    const highlightsList = document.getElementById('highlights-list');
    const addPbBtn = document.getElementById('add-pb-btn');
    const addHighlightBtn = document.getElementById('add-highlight-btn');
    const addAthleteBtn = document.getElementById('add-athlete-btn');
    const formBio = document.getElementById('form-bio');
    const formStar = document.getElementById('form-star');
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const logoutBtn = document.getElementById('logout-btn');

    let currentPage = 1;
    let searchTerm = '';
    let searchTimeout = null;

    // ---- Helpers ----
    function showMessage(text, type) {
        showToast(text, type);
    }

    function showSkeleton() {
        var html = '';
        for (var i = 0; i < 6; i++) {
            html += '<div class="admin-skeleton-card"><div class="admin-skeleton-card__image"></div><div class="admin-skeleton-card__body"><div class="admin-skeleton-line admin-skeleton-line--lg"></div><div class="admin-skeleton-line admin-skeleton-line--sm" style="margin-top:0.4rem;"></div></div></div>';
        }
        grid.innerHTML = html;
        grid.style.display = '';
        emptyState.style.display = 'none';
    }

    // ---- Fetch Athletes ----
    async function loadAthletes() {
        showSkeleton();
        const params = new URLSearchParams({ page: currentPage, per_page: 12 });
        if (searchTerm) params.set('search', searchTerm);

        try {
            const res = await fetch(API_BASE + '/athletes.php?' + params.toString(), {
                headers: authHeaders(),
            });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/login.html'; return; }
            const data = await res.json();
            renderGrid(data.data);
            renderPagination(data);
        } catch (err) {
            showMessage('Failed to load athletes.', 'error');
        }
    }

    function renderGrid(athletes) {
        if (!athletes || athletes.length === 0) {
            grid.innerHTML = '';
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = '';
        emptyState.style.display = 'none';

        grid.innerHTML = athletes.map(function (a) {
            var imgHtml = a.image_path
                ? '<img src="' + resolveUploadUrl(a.image_path) + '" alt="' + a.name + '" loading="lazy">'
                : '<span class="no-image">No image</span>';
            var highlightText = a.highlights && a.highlights.length > 0 ? a.highlights[0] : '';
            var starBadge = (a.star == 1 || a.star === true) ? '<span style="position:absolute;top:0.5rem;right:0.5rem;font-size:1.2rem;">⭐</span>' : '';
            return '<div class="admin-athlete-card" data-id="' + a.public_id + '">' +
                '<div class="admin-athlete-card__image">' + imgHtml + starBadge + '</div>' +
                '<div class="admin-athlete-card__info">' +
                    '<h3 class="admin-athlete-card__name">' + escapeHtml(a.name) + '</h3>' +
                    '<p class="admin-athlete-card__highlight">' + escapeHtml(highlightText) + '</p>' +
                '</div>' +
                '<div class="admin-athlete-card__actions">' +
                    '<button class="btn-sm btn-outline edit-btn" data-id="' + a.public_id + '">Edit</button>' +
                    '<button class="btn-sm btn-danger delete-btn" data-id="' + a.public_id + '">Delete</button>' +
                '</div>' +
            '</div>';
        }).join('');

        // Attach edit/delete handlers
        grid.querySelectorAll('.edit-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { openEdit(btn.dataset.id); });
        });
        grid.querySelectorAll('.delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { deleteAthlete(btn.dataset.id); });
        });
    }

    function renderPagination(data) {
        if (data.total_pages <= 1) { paginationEl.innerHTML = ''; return; }

        var html = '';
        html += '<button ' + (data.page <= 1 ? 'disabled' : '') + ' data-page="' + (data.page - 1) + '">&laquo; Prev</button>';
        for (var i = 1; i <= data.total_pages; i++) {
            html += '<button class="' + (i === data.page ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
        }
        html += '<button ' + (data.page >= data.total_pages ? 'disabled' : '') + ' data-page="' + (data.page + 1) + '">Next &raquo;</button>';
        paginationEl.innerHTML = html;

        paginationEl.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (btn.disabled) return;
                currentPage = parseInt(btn.dataset.page);
                loadAthletes();
            });
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    // ---- Search ----
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function () {
            searchTerm = searchInput.value.trim();
            currentPage = 1;
            loadAthletes();
        }, 300);
    });

    // ---- Modal (stepped) ----
    var currentStep = 1;
    var totalSteps = 3;
    var modalPrev = document.getElementById('modal-prev');
    var modalNext = document.getElementById('modal-next');
    var sections = document.querySelectorAll('.modal-section');
    var stepIndicators = document.querySelectorAll('.modal-step');

    function goToStep(step) {
        currentStep = step;
        sections.forEach(function (s) { s.classList.remove('active'); });
        stepIndicators.forEach(function (s) {
            s.classList.remove('active', 'done');
            var sNum = parseInt(s.dataset.step);
            if (sNum < currentStep) s.classList.add('done');
            if (sNum === currentStep) s.classList.add('active');
        });
        document.querySelector('.modal-section[data-section="' + currentStep + '"]').classList.add('active');

        // Show/hide nav buttons
        modalPrev.style.display = currentStep > 1 ? '' : 'none';
        modalNext.style.display = currentStep < totalSteps ? '' : 'none';
        formSubmitBtn.style.display = currentStep === totalSteps ? '' : 'none';
    }

    modalNext.addEventListener('click', function () {
        // Validate step 1
        if (currentStep === 1) {
            var name = formName.value.trim();
            if (!name) {
                formName.focus();
                showMessage('Athlete name is required.', 'error');
                return;
            }
        }
        if (currentStep < totalSteps) goToStep(currentStep + 1);
    });

    modalPrev.addEventListener('click', function () {
        if (currentStep > 1) goToStep(currentStep - 1);
    });

    // Allow clicking step indicators
    stepIndicators.forEach(function (si) {
        si.addEventListener('click', function () {
            var target = parseInt(si.dataset.step);
            // Only allow going back or to current
            if (target < currentStep) goToStep(target);
            // Allow forward only if name is filled
            if (target > currentStep && formName.value.trim()) goToStep(target);
        });
    });

    function openModal(title) {
        modalTitle.textContent = title;
        goToStep(1);
        modal.classList.add('show');
    }

    function closeModal() {
        modal.classList.remove('show');
        resetForm();
    }

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    addAthleteBtn.addEventListener('click', function () {
        formPublicId.value = '';
        openModal('Add Athlete');
    });

    function resetForm() {
        form.reset();
        formPublicId.value = '';
        formBio.value = '';
        formStar.checked = false;
        imagePreview.innerHTML = '<span class="image-preview__placeholder">Click or drop image here</span>';
        pbList.innerHTML = '';
        highlightsList.innerHTML = '';
        goToStep(1);
    }

    // ---- Image picker ----
    imagePickBtn.addEventListener('click', function () { formImage.click(); });
    imagePreview.addEventListener('click', function () { formImage.click(); });

    formImage.addEventListener('change', function () {
        var file = formImage.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
        };
        reader.readAsDataURL(file);
    });

    // ---- Dynamic PB rows ----
    function addPbRow(event, time, date) {
        var div = document.createElement('div');
        div.className = 'dynamic-list__item pb-row';
        div.innerHTML = '<input type="text" placeholder="Event (e.g. 100m Freestyle)" class="pb-event" value="' + escapeHtml(event || '') + '">' +
            '<input type="text" placeholder="Time" class="pb-time" value="' + escapeHtml(time || '') + '">' +
            '<input type="date" class="pb-date" value="' + (date || '') + '">' +
            '<button type="button" class="dynamic-list__remove">&times;</button>';
        div.querySelector('.dynamic-list__remove').addEventListener('click', function () { div.remove(); });
        pbList.appendChild(div);
    }

    addPbBtn.addEventListener('click', function () { addPbRow('', '', ''); });

    // ---- Dynamic highlight rows ----
    function addHighlightRow(text) {
        var div = document.createElement('div');
        div.className = 'dynamic-list__item';
        div.innerHTML = '<input type="text" placeholder="Highlight (e.g. National Team)" class="hl-text" value="' + escapeHtml(text || '') + '">' +
            '<button type="button" class="dynamic-list__remove">&times;</button>';
        div.querySelector('.dynamic-list__remove').addEventListener('click', function () { div.remove(); });
        highlightsList.appendChild(div);
    }

    addHighlightBtn.addEventListener('click', function () { addHighlightRow(''); });

    // ---- Edit ----
    async function openEdit(publicId) {
        try {
            const res = await fetch(API_BASE + '/athletes.php?id=' + publicId, { headers: authHeaders() });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/login.html'; return; }
            if (!res.ok) { showMessage('Failed to load athlete.', 'error'); return; }
            const athlete = await res.json();

            formPublicId.value = athlete.public_id;
            formName.value = athlete.name;
            formBio.value = athlete.bio || '';
            formStar.checked = !!athlete.star;

            // Image preview
            if (athlete.image_path) {
                imagePreview.innerHTML = '<img src="' + resolveUploadUrl(athlete.image_path) + '" alt="' + athlete.name + '">';
            }

            // PBs
            pbList.innerHTML = '';
            (athlete.personal_bests || []).forEach(function (pb) { addPbRow(pb.event, pb.time, pb.date); });

            // Highlights
            highlightsList.innerHTML = '';
            (athlete.highlights || []).forEach(function (h) { addHighlightRow(h.highlight || h); });

            openModal('Edit Athlete');
        } catch (err) {
            showMessage('Failed to load athlete details.', 'error');
        }
    }

    // ---- Submit (Create / Update) ----
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        var publicId = formPublicId.value;
        var name = formName.value.trim();
        if (!name) { showMessage('Name is required.', 'error'); return; }

        // Gather PBs
        var pbs = [];
        pbList.querySelectorAll('.pb-row').forEach(function (row) {
            var ev = row.querySelector('.pb-event').value.trim();
            var tm = row.querySelector('.pb-time').value.trim();
            var dt = row.querySelector('.pb-date').value;
            if (ev && tm) pbs.push({ event: ev, time: tm, date: dt || null });
        });

        // Gather highlights
        var hls = [];
        highlightsList.querySelectorAll('.hl-text').forEach(function (input) {
            var t = input.value.trim();
            if (t) hls.push(t);
        });

        var formData = new FormData();
        formData.append('name', name);
        formData.append('bio', formBio.value.trim());
        formData.append('star', formStar.checked ? '1' : '0');
        formData.append('personal_bests', JSON.stringify(pbs));
        formData.append('highlights', JSON.stringify(hls));

        if (formImage.files[0]) {
            formData.append('image', formImage.files[0]);
        }

        var url = API_BASE + '/athletes.php';
        if (publicId) url += '?id=' + publicId;

        formSubmitBtn.disabled = true;
        formSubmitBtn.innerHTML = '<span class="spinner"></span> Saving...';

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: authHeaders(),
                body: formData,
            });

            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/login.html'; return; }

            var data;
            var responseText = await res.text();
            try {
                data = JSON.parse(responseText);
            } catch (parseErr) {
                showMessage('Server error: ' + (res.status === 413 ? 'File too large.' : 'Invalid response from server.'), 'error');
                return;
            }

            if (!res.ok) {
                showMessage(data.error || 'Failed to save athlete. (HTTP ' + res.status + ')', 'error');
                return;
            }

            showMessage(publicId ? 'Athlete updated.' : 'Athlete created.', 'success');
            closeModal();
            loadAthletes();
        } catch (err) {
            showMessage('Network error — please try again.', 'error');
        } finally {
            formSubmitBtn.disabled = false;
            formSubmitBtn.textContent = 'Save Athlete';
        }
    });

    // ---- Delete ----
    async function deleteAthlete(publicId) {
        if (!confirm('Delete this athlete? This cannot be undone.')) return;

        try {
            const res = await fetch(API_BASE + '/athletes.php?id=' + publicId, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/login.html'; return; }
            const data = await res.json();

            if (!res.ok) { showMessage(data.error || 'Delete failed.', 'error'); return; }
            showMessage('Athlete deleted.', 'success');
            loadAthletes();
        } catch (err) {
            showMessage('Network error.', 'error');
        }
    }

    // ---- Logout ----
    logoutBtn.addEventListener('click', function () {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login.html';
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

    // Close sidebar on nav link click (mobile)
    if (sidebar) {
        sidebar.querySelectorAll('.admin-sidebar__nav a').forEach(function (link) {
            link.addEventListener('click', function () {
                sidebar.classList.remove('open');
                overlay.classList.remove('open');
            });
        });
    }

    // ---- Init ----
    loadAthletes();
})();
