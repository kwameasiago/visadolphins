/**
 * Shared toast notification utility using Toastify.js
 * Loaded on all admin pages before page-specific scripts.
 */
window.showToast = function (text, type) {
    var bgMap = {
        success: 'linear-gradient(135deg, #00c853, #00e676)',
        error: 'linear-gradient(135deg, #f44336, #e53935)',
        info: 'linear-gradient(135deg, #00bcd4, #0097a7)',
        warning: 'linear-gradient(135deg, #f5a623, #ff9800)'
    };

    Toastify({
        text: text,
        duration: 4000,
        gravity: 'top',
        position: 'right',
        stopOnFocus: true,
        style: {
            background: bgMap[type] || bgMap.info,
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
            padding: '0.75rem 1.25rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }
    }).showToast();
};
