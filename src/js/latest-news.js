(function () {
    var grid = document.getElementById('latest-news-grid');
    if (!grid) return;

    // Skeleton
    var skelHtml = '';
    for (var i = 0; i < 3; i++) {
        skelHtml += '<div class="skeleton-card"><div class="skeleton-card__image"></div><div class="skeleton-card__body"><div class="skeleton-line skeleton-line--long"></div><div class="skeleton-line skeleton-line--medium"></div><div class="skeleton-line skeleton-line--short"></div></div></div>';
    }
    grid.innerHTML = skelHtml;

    fetch('/api/public/starred-news.php')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data.data || data.data.length === 0) {
                grid.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;">No news yet — check back soon!</p>';
                return;
            }

            grid.innerHTML = data.data.map(function (p) {
                var coverHtml = '';
                if (p.thumb_type === 'image' && p.thumb_path) {
                    coverHtml = '<div class="news-card__image"><img src="' + p.thumb_path + '" alt="" loading="lazy"></div>';
                } else if (p.thumb_type === 'youtube' && p.thumb_path) {
                    var ytId = extractYouTubeId(p.thumb_path);
                    if (ytId) coverHtml = '<div class="news-card__image"><img src="https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg" alt="" loading="lazy"></div>';
                } else if (p.thumb_type === 'video' && p.thumb_path) {
                    coverHtml = '<div class="news-card__image"><video src="' + p.thumb_path + '" muted></video></div>';
                }

                var date = new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                var excerpt = (p.excerpt || '').substring(0, 120);

                return '<a href="/news-event-detail.html?id=' + p.public_id + '" class="news-card">' +
                    coverHtml +
                    '<div class="news-card__content">' +
                        '<time class="news-card__date">' + date + '</time>' +
                        '<h3 class="news-card__title">' + escapeHtml(p.title) + '</h3>' +
                        '<p class="news-card__excerpt">' + escapeHtml(excerpt) + '</p>' +
                    '</div>' +
                '</a>';
            }).join('');
        })
        .catch(function () {
            grid.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;">Could not load news.</p>';
        });

    function escapeHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    function extractYouTubeId(url) {
        if (!url) return null;
        var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : null;
    }
})();
