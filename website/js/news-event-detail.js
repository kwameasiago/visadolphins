(function () {
    var main = document.getElementById('main-content');
    var params = new URLSearchParams(window.location.search);
    var postId = params.get('id');

    if (!postId) {
        main.innerHTML = '<section class="section"><div class="container"><p>No post specified.</p></div></section>';
        return;
    }

    // Skeleton
    main.innerHTML = '<section class="section"><div class="container" style="max-width:800px;">' +
        '<div class="skeleton-card__image" style="aspect-ratio:16/9;border-radius:var(--radius-md);margin-bottom:1.5rem;"></div>' +
        '<div class="skeleton-line skeleton-line--short" style="margin-bottom:1rem;"></div>' +
        '<div class="skeleton-line skeleton-line--long"></div>' +
        '<div class="skeleton-line skeleton-line--long"></div>' +
        '<div class="skeleton-line skeleton-line--medium"></div>' +
        '<div class="skeleton-line skeleton-line--long"></div>' +
        '<div class="skeleton-line skeleton-line--short"></div>' +
        '</div></section>';

    async function loadPost() {
        try {
            var res = await fetch(APP_CONFIG.API_BASE_URL + '/news-events.php?id=' + postId);
            if (!res.ok) { main.innerHTML = '<section class="section"><div class="container"><p>Post not found.</p></div></section>'; return; }
            var post = await res.json();
            render(post);
            document.title = post.title + ' — Visa Dolphins';
        } catch (err) {
            main.innerHTML = '<section class="section"><div class="container"><p>Failed to load post.</p></div></section>';
        }
    }

    function render(p) {
        var date = new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        var media = p.media || [];

        // Find thumbnail (first is_thumbnail=1) for hero display
        var thumb = media.find(function (m) { return parseInt(m.is_thumbnail); }) || media[0];
        var heroHtml = '';
        if (thumb) {
            if (thumb.media_type === 'image') {
                heroHtml = '<img src="' + resolveUploadUrl(thumb.media_path) + '" alt="" class="news-detail__cover">';
            } else if (thumb.media_type === 'youtube') {
                var ytId = extractYouTubeId(thumb.media_path);
                if (ytId) heroHtml = '<div class="news-detail__video-wrap"><iframe src="https://www.youtube.com/embed/' + ytId + '" frameborder="0" allowfullscreen></iframe></div>';
            } else if (thumb.media_type === 'video') {
                heroHtml = '<video src="' + resolveUploadUrl(thumb.media_path) + '" controls class="news-detail__cover"></video>';
            }
        }

        // Other media (everything except the hero item)
        var otherMedia = media.filter(function (m) { return m !== thumb; });
        var galleryHtml = '';
        if (otherMedia.length) {
            var items = otherMedia.map(function (m) {
                if (m.media_type === 'image') {
                    return '<div class="news-gallery__item"><img src="' + resolveUploadUrl(m.media_path) + '" alt="" loading="lazy"></div>';
                } else if (m.media_type === 'youtube') {
                    var id = extractYouTubeId(m.media_path);
                    return id ? '<div class="news-gallery__item news-gallery__item--video"><iframe src="https://www.youtube.com/embed/' + id + '" frameborder="0" allowfullscreen></iframe></div>' : '';
                } else if (m.media_type === 'video') {
                    return '<div class="news-gallery__item news-gallery__item--video"><video src="' + resolveUploadUrl(m.media_path) + '" controls></video></div>';
                }
                return '';
            }).join('');

            if (items) {
                galleryHtml = '<div class="news-detail__gallery"><h3>Media</h3><div class="news-gallery">' + items + '</div></div>';
            }
        }

        main.innerHTML =
            '<section class="page-hero">' +
                '<div class="container">' +
                    '<a href="/news-events.html" style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.85rem;color:var(--color-text-muted);margin-bottom:1rem;">&larr; Back to News & Events</a>' +
                    '<h1 class="page-hero__title">' + escapeHtml(p.title) + '</h1>' +
                    '<time style="font-size:0.85rem;color:var(--color-text-muted);">' + date + '</time>' +
                '</div>' +
            '</section>' +
            '<section class="section">' +
                '<div class="container news-detail">' +
                    heroHtml +
                    '<div class="news-detail__body">' + (p.body || '') + '</div>' +
                    galleryHtml +
                '</div>' +
            '</section>';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        var match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    loadPost();
})();
