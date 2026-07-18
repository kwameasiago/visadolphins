<?php

/**
 * Public Gallery API — No authentication required
 *
 * GET /api/public/gallery.php            — List (paginated, optional tag filter)
 * Returns tags array for filter buttons
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $pdo = getDbConnection();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 50)));
    $tag = trim($_GET['tag'] ?? '');
    $offset = ($page - 1) * $perPage;

    $where = '';
    $params = [];
    if ($tag) {
        $where = 'WHERE tag = :tag';
        $params[':tag'] = $tag;
    }

    $countSql = "SELECT COUNT(*) FROM gallery {$where}";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    $sql = "SELECT public_id, image_path, tag, caption, created_at
            FROM gallery {$where}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Distinct tags for filter buttons
    $tagStmt = $pdo->query("SELECT DISTINCT tag FROM gallery WHERE tag IS NOT NULL AND tag != '' ORDER BY tag ASC");
    $tags = array_column($tagStmt->fetchAll(PDO::FETCH_ASSOC), 'tag');

    echo json_encode([
        'data' => $items,
        'tags' => $tags,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => (int)ceil($total / $perPage),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
