<?php

/**
 * Public Starred News & Events API
 *
 * GET /api/public/starred-news.php — Returns news/events marked as "star"
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $pdo = getDbConnection();

    $sql = "SELECT n.public_id, n.title, n.body, n.created_at,
                   t.media_type AS thumb_type, t.media_path AS thumb_path
            FROM news_events n
            LEFT JOIN news_event_media t ON t.news_event_id = n.id AND t.is_thumbnail = 1
            WHERE n.star = 1
            ORDER BY n.created_at DESC";
    $stmt = $pdo->query($sql);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as &$item) {
        $item['excerpt'] = mb_substr(strip_tags($item['body']), 0, 150);
        unset($item['body']);
    }

    echo json_encode(['data' => $items]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
