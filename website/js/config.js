/**
 * Website Configuration
 * Auto-detects environment based on hostname.
 */
var APP_CONFIG = (function () {
    var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    var apiBase = isLocal ? 'http://localhost:8082' : 'https://api.visadolphins.co.ke';
    return {
        API_BASE_URL: apiBase + '/public',
        UPLOADS_BASE_URL: apiBase
    };
})();

/**
 * Resolves an upload path (e.g. /uploads/athletes/img.jpg) to a full URL.
 */
function resolveUploadUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return APP_CONFIG.UPLOADS_BASE_URL + path;
}
