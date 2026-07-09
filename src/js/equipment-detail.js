(function () {
    var container = document.getElementById('equipment-detail-content');
    if (!container) return;

    var params = new URLSearchParams(window.location.search);
    var equipId = params.get('id');

    if (!equipId) {
        renderNotFound();
        return;
    }

    async function loadItem() {
        try {
            var res = await fetch('/api/public/equipment.php?id=' + equipId);
            if (!res.ok) { renderNotFound(); return; }
            var item = await res.json();
            render(item);
            document.title = item.name + ' — Visa Dolphins Sports';
        } catch (err) {
            container.innerHTML = '<section class="page-hero"><div class="container" style="text-align:center;"><p>Failed to load product.</p></div></section>';
        }
    }

    function render(item) {
        var featureItems = '';
        if (item.features && item.features.length) {
            featureItems = item.features.map(function (f) {
                return '<li>' + escapeHtml(f) + '</li>';
            }).join('');
        }

        var imgHtml = item.image_path
            ? '<img src="' + item.image_path + '" alt="' + escapeHtml(item.name) + '">'
            : '<div style="width:100%;height:400px;display:flex;align-items:center;justify-content:center;background:var(--color-bg-secondary);color:var(--color-text-muted);">No image</div>';

        var categoryHtml = item.category
            ? '<span class="equipment-hero__category">' + escapeHtml(item.category) + '</span>'
            : '';

        var priceHtml = item.price
            ? '<span class="equipment-hero__price">' + escapeHtml(item.price) + '</span>'
            : '';

        var sizesHtml = item.sizes
            ? '<p class="equipment-hero__sizes"><strong>Sizes:</strong> ' + escapeHtml(item.sizes) + '</p>'
            : '';

        container.innerHTML =
            '<section class="equipment-hero">' +
            '  <div class="container">' +
            '    <a href="/sports/equipment.html" class="athlete-back-link">&larr; Back to Equipment</a>' +
            '    <div class="equipment-hero__grid">' +
            '      <div class="equipment-hero__photo">' +
                     imgHtml + categoryHtml +
            '      </div>' +
            '      <div class="equipment-hero__info">' +
                     priceHtml +
            '        <h1 class="equipment-hero__name">' + escapeHtml(item.name) + '</h1>' +
            '        <p class="equipment-hero__desc">' + escapeHtml(item.description || '') + '</p>' +
                     sizesHtml +
            '        <a href="https://wa.me/254700000000?text=' + encodeURIComponent('Hi, I\'d like to order ' + item.name) + '" target="_blank" class="btn btn-primary" style="margin-top:1.5rem;">' +
            '          Enquire via WhatsApp' +
            '        </a>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</section>' +
            (featureItems ? '<section class="section"><div class="container"><div class="equipment-features"><h2 class="athlete-section-title">Features</h2><ul class="athlete-highlights-list">' + featureItems + '</ul></div></div></section>' : '');
    }

    function renderNotFound() {
        container.innerHTML =
            '<section class="page-hero">' +
            '  <div class="container" style="text-align:center;">' +
            '    <h1 class="page-hero__title">Product Not Found</h1>' +
            '    <p class="page-hero__desc">Sorry, we couldn\'t find that product.</p>' +
            '    <a href="/sports/equipment.html" class="btn btn-primary" style="margin-top:2rem;">View All Equipment</a>' +
            '  </div>' +
            '</section>';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    loadItem();
})();
