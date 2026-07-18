/**
 * Admin App Configuration
 * Change API_BASE_URL to match your deployment environment.
 */
var APP_CONFIG = {
    // For local development (Docker): 'http://localhost:8082'
    // For production: 'https://api.visadolphins.co.ke'
    API_BASE_URL: 'http://localhost:8082',
    // For local development (Docker): 'http://localhost:8082'
    // For production: 'https://api.visadolphins.co.ke'
    UPLOADS_BASE_URL: 'http://localhost:8082'
};

/**
 * Resolves an upload path (e.g. /uploads/athletes/img.jpg) to a full URL.
 */
function resolveUploadUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return APP_CONFIG.UPLOADS_BASE_URL + path;
}
