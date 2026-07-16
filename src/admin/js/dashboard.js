(function () {
    var TOKEN_KEY = 'admin_token';

    // ---- Auth check ----
    function getToken() { return localStorage.getItem(TOKEN_KEY); }

    function checkAuth() {
        var token = getToken();
        if (!token) { window.location.href = '/admin/login.html'; return false; }
        try {
            var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp * 1000 < Date.now()) {
                localStorage.removeItem(TOKEN_KEY);
                window.location.href = '/admin/login.html';
                return false;
            }
        } catch (e) {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/admin/login.html';
            return false;
        }
        return true;
    }

    if (!checkAuth()) return;

    var API_BASE = '/api';
    function authHeaders() { return { 'Authorization': 'Bearer ' + getToken() }; }

    // ---- Logout ----
    document.getElementById('logout-btn').addEventListener('click', function () {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/admin/login.html';
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

    // ---- Dashboard Stats ----
    var chartFromInput = document.getElementById('chart-from');
    var chartToInput = document.getElementById('chart-to');
    var chartFilterBtn = document.getElementById('chart-filter-btn');
    var appChart = null;

    // Default: last 6 months
    var today = new Date();
    var sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
    chartFromInput.value = sixMonthsAgo.toISOString().slice(0, 10);
    chartToInput.value = today.toISOString().slice(0, 10);

    async function loadStats() {
        var params = new URLSearchParams();
        if (chartFromInput.value) params.set('from', chartFromInput.value);
        if (chartToInput.value) params.set('to', chartToInput.value);

        try {
            var res = await fetch(API_BASE + '/dashboard-stats.php?' + params.toString(), { headers: authHeaders() });
            if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.href = '/admin/login.html'; return; }
            var data = await res.json();

            document.getElementById('stat-unread-messages').textContent = data.unread_messages;
            document.getElementById('stat-total-messages').textContent = data.total_messages + ' total';
            document.getElementById('stat-new-applications').textContent = data.new_applications;
            document.getElementById('stat-total-applications').textContent = data.total_applications + ' total';
            document.getElementById('stat-athletes').textContent = data.total_athletes;
            document.getElementById('stat-news-events').textContent = data.total_news_events;
            document.getElementById('stat-equipment').textContent = data.total_equipment;
            document.getElementById('stat-gallery').textContent = data.total_gallery;

            renderChart(data.trends);
        } catch (err) {
            console.error('Failed to load dashboard stats', err);
        }
    }

    chartFilterBtn.addEventListener('click', function () {
        loadStats();
    });

    function renderChart(trends) {
        var ctx = document.getElementById('applications-chart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (appChart) {
            appChart.destroy();
        }

        appChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trends.months,
                datasets: [
                    {
                        label: 'Swimming',
                        data: trends.swimming,
                        borderColor: '#00bcd4',
                        backgroundColor: 'rgba(0, 188, 212, 0.1)',
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#00bcd4',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Corporate',
                        data: trends.corporate,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#4caf50',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter, sans-serif', size: 12 },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#e2e8f0',
                        bodyColor: '#e2e8f0',
                        borderColor: '#334155',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(148,163,184,0.08)' },
                        ticks: { color: '#64748b', font: { size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(148,163,184,0.08)' },
                        ticks: {
                            color: '#64748b',
                            font: { size: 11 },
                            stepSize: 1,
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    loadStats();
})();
