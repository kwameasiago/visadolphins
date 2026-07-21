<?php

/**
 * Public News & Events API — No authentication required
 *
 * GET /api/public/news-events.php              — List (paginated, searchable)
 * GET /api/public/news-events.php?id=<uuid>    — Single detail with all media
 */

require_once __DIR__ . '/../helpers/cors.php';
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$publicId = $_GET['id'] ?? null;

try {
    $pdo = getDbConnection();

    if ($publicId) {
        getNewsEvent($pdo, $publicId);
    } else {
        listNewsEvents($pdo);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}

function listNewsEvents($pdo) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 12)));
    $search = trim($_GET['search'] ?? '');
    $offset = ($page - 1) * $perPage;

    $where = '';
    $params = [];
    if ($search) {
        $where = 'WHERE n.title LIKE :search';
        $params[':search'] = '%' . $search . '%';
    }

    $countSql = "SELECT COUNT(*) FROM news_events n {$where}";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    $sql = "SELECT n.public_id, n.title, n.body, n.created_at,
                   t.media_type AS thumb_type, t.media_path AS thumb_path
            FROM news_events n
            LEFT JOIN news_event_media t ON t.news_event_id = n.id AND t.is_thumbnail = 1
            {$where}
            ORDER BY n.created_at DESC
            LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Truncate body for cards
    foreach ($items as &$item) {
        $item['excerpt'] = mb_substr(strip_tags($item['body']), 0, 150);
        unset($item['body']);
    }

    echo json_encode([
        'data' => $items,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => ceil($total / $perPage),
    ]);
}

function getNewsEvent($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id, public_id, title, body, created_at FROM news_events WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    $internalId = $item['id'];
    unset($item['id']);

    // Get all media
    $stmt = $pdo->prepare("SELECT media_type, media_path, sort_order, is_thumbnail FROM news_event_media WHERE news_event_id = :nid ORDER BY is_thumbnail DESC, sort_order ASC");
    $stmt->execute([':nid' => $internalId]);
    $item['media'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($item);
}
