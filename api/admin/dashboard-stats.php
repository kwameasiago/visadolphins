<?php

/**
 * Admin Dashboard Stats API — JWT-protected
 *
 * GET /api/dashboard-stats.php — Returns unread counts and monthly application trends.
 */

require_once __DIR__ . '/../helpers/cors.php';
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/auth.php';

requireAuth();

try {
    $pdo = getDbConnection();

    // Unread messages
    $stmt = $pdo->query("SELECT COUNT(*) FROM contact_submissions WHERE is_read = 0");
    $unreadMessages = (int) $stmt->fetchColumn();

    // Unread applications
    $stmt = $pdo->query("SELECT COUNT(*) FROM applications WHERE is_read = 0");
    $newApplications = (int) $stmt->fetchColumn();

    // Total messages
    $stmt = $pdo->query("SELECT COUNT(*) FROM contact_submissions");
    $totalMessages = (int) $stmt->fetchColumn();

    // Total applications
    $stmt = $pdo->query("SELECT COUNT(*) FROM applications");
    $totalApplications = (int) $stmt->fetchColumn();

    // Content counts
    $stmt = $pdo->query("SELECT COUNT(*) FROM gallery");
    $totalGallery = (int) $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM news_events");
    $totalNewsEvents = (int) $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM equipment");
    $totalEquipment = (int) $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT COUNT(*) FROM athletes");
    $totalAthletes = (int) $stmt->fetchColumn();

    // Date range for trends (default: last 6 months)
    $fromParam = $_GET['from'] ?? null;
    $toParam = $_GET['to'] ?? null;

    $dateTo = $toParam ? date('Y-m-d', strtotime($toParam)) : date('Y-m-d');
    $dateFrom = $fromParam ? date('Y-m-d', strtotime($fromParam)) : date('Y-m-d', strtotime('-6 months'));

    // Monthly application trends grouped by form_type
    $stmt = $pdo->prepare("
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') AS month,
            form_type,
            COUNT(*) AS total
        FROM applications
        WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY month, form_type
        ORDER BY month ASC
    ");
    $stmt->execute([$dateFrom, $dateTo]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Build structured trend data — generate all months in range
    $months = [];
    $swimming = [];
    $corporate = [];

    $cursor = new DateTime($dateFrom);
    $end = new DateTime($dateTo);
    $cursor->modify('first day of this month');
    $end->modify('first day of this month');

    while ($cursor <= $end) {
        $m = $cursor->format('Y-m');
        $months[] = $m;
        $swimming[$m] = 0;
        $corporate[$m] = 0;
        $cursor->modify('+1 month');
    }

    foreach ($rows as $row) {
        $m = $row['month'];
        if (isset($swimming[$m])) {
            if ($row['form_type'] === 'swimming') {
                $swimming[$m] = (int) $row['total'];
            } else {
                $corporate[$m] = (int) $row['total'];
            }
        }
    }

    echo json_encode([
        'unread_messages' => $unreadMessages,
        'new_applications' => $newApplications,
        'total_messages' => $totalMessages,
        'total_applications' => $totalApplications,
        'total_gallery' => $totalGallery,
        'total_news_events' => $totalNewsEvents,
        'total_equipment' => $totalEquipment,
        'total_athletes' => $totalAthletes,
        'trends' => [
            'months' => array_map(function ($m) {
                return date('M Y', strtotime($m . '-01'));
            }, $months),
            'swimming' => array_values($swimming),
            'corporate' => array_values($corporate)
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
