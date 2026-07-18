(function () {
    const API_BASE = APP_CONFIG.API_BASE_URL;
    const container = document.getElementById('athlete-detail-content');
    const params = new URLSearchParams(window.location.search);
    const publicId = params.get('id');

    if (!publicId) {
        renderNotFound();
        return;
    }

    loadAthlete();

    async function loadAthlete() {
        try {
            const res = await fetch(API_BASE + '/athletes.php?id=' + encodeURIComponent(publicId));
            if (!res.ok) {
                renderNotFound();
                return;
            }
            const athlete = await res.json();
            renderAthlete(athlete);
            document.title = athlete.name + ' — Visa Dolphins Swim Club';
        } catch (err) {
            renderNotFound();
        }
    }

    function renderAthlete(a) {
        var imgSrc = resolveUploadUrl(a.image_path) || 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=600&fit=crop';

        var bioHtml = '';
        if (a.bio) {
            bioHtml = '<div class="athlete-detail__section">' +
                '<h2 class="athlete-detail__section-title">About</h2>' +
                '<p style="font-size:0.95rem;line-height:1.7;color:var(--color-text);">' + escapeHtml(a.bio) + '</p></div>';
        }

        var pbHtml = '';
        if (a.personal_bests && a.personal_bests.length > 0) {
            pbHtml = '<div class="athlete-detail__section">' +
                '<h2 class="athlete-detail__section-title">Personal Bests</h2>' +
                '<table class="athlete-detail__table">' +
                '<thead><tr><th>Event</th><th>Time</th><th>Date</th></tr></thead><tbody>' +
                a.personal_bests.map(function (pb) {
                    return '<tr><td>' + escapeHtml(pb.event) + '</td><td>' + escapeHtml(pb.time) + '</td><td>' + (pb.date || '—') + '</td></tr>';
                }).join('') +
                '</tbody></table></div>';
        }

        var hlHtml = '';
        if (a.highlights && a.highlights.length > 0) {
            hlHtml = '<div class="athlete-detail__section">' +
                '<h2 class="athlete-detail__section-title">Highlights</h2>' +
                '<ul class="athlete-detail__highlights">' +
                a.highlights.map(function (h) {
                    return '<li>' + escapeHtml(h) + '</li>';
                }).join('') +
                '</ul></div>';
        }

        container.innerHTML =
            '<section class="page-hero">' +
                '<div class="container">' +
                    '<a href="/club/athletes.html" style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.85rem;color:var(--color-text-muted);margin-bottom:1rem;">&larr; Back to Athletes</a>' +
                    '<h1 class="page-hero__title">' + escapeHtml(a.name) + '</h1>' +
                '</div>' +
            '</section>' +
            '<section class="section">' +
                '<div class="container">' +
                    '<div class="athlete-detail__layout">' +
                        '<div class="athlete-detail__image">' +
                            '<img src="' + imgSrc + '" alt="' + escapeHtml(a.name) + '" style="width:100%;border-radius:12px;max-height:500px;object-fit:contain;background:var(--color-bg-card);">' +
                        '</div>' +
                        '<div class="athlete-detail__content">' +
                            bioHtml + pbHtml + hlHtml +
                            ((!bioHtml && !pbHtml && !hlHtml) ? '<p style="color:var(--color-text-muted);">No additional details available for this athlete.</p>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</section>';
    }

    function renderNotFound() {
        container.innerHTML =
            '<section class="page-hero">' +
                '<div class="container" style="text-align:center;">' +
                    '<h1 class="page-hero__title">Athlete Not Found</h1>' +
                    '<p class="page-hero__desc">The athlete you\'re looking for doesn\'t exist or has been removed.</p>' +
                    '<a href="/club/athletes.html" style="display:inline-block;margin-top:1.5rem;padding:0.75rem 1.5rem;background:var(--color-primary);color:#000;border-radius:6px;font-weight:600;text-decoration:none;">View All Athletes</a>' +
                '</div>' +
            '</section>';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
})();
