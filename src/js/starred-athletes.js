(function () {
    var grid = document.getElementById('starred-athletes-grid');
    if (!grid) return;

    // Skeleton
    var skelHtml = '';
    for (var i = 0; i < 4; i++) {
        skelHtml += '<div class="skeleton-athlete"><div class="skeleton-athlete__image"></div><div class="skeleton-line skeleton-line--medium" style="width:60%;height:0.9rem;"></div><div class="skeleton-line skeleton-line--short" style="width:40%;"></div></div>';
    }
    grid.innerHTML = skelHtml;

    fetch('/api/public/starred-athletes.php')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            var athletes = data.data || [];
            if (athletes.length === 0) {
                grid.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;grid-column:1/-1;">No featured athletes yet.</p>';
                return;
            }
            grid.innerHTML = athletes.map(function (a) {
                var imgSrc = a.image_path || 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=500&fit=crop&crop=face';
                var highlight = a.highlights && a.highlights.length > 0 ? a.highlights[0] : '';
                return '<a href="/club/athlete-detail.html?id=' + a.public_id + '" class="athlete-card">' +
                    '<div class="athlete-card__image">' +
                        '<img src="' + imgSrc + '" alt="' + escapeHtml(a.name) + '" loading="lazy">' +
                    '</div>' +
                    '<div class="athlete-card__info">' +
                        '<h3 class="athlete-card__name">' + escapeHtml(a.name) + '</h3>' +
                        '<p class="athlete-card__achievement">' + escapeHtml(highlight) + '</p>' +
                    '</div>' +
                '</a>';
            }).join('');
        })
        .catch(function () {
            grid.innerHTML = '';
        });

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }
})();
