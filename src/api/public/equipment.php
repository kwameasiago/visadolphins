<?php

/**
 * Public Equipment API — No authentication required
 *
 * GET /api/public/equipment.php                — List (paginated, searchable, filterable by category)
 * GET /api/public/equipment.php?id=<uuid>      — Single item with features
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$publicId = $_GET['id'] ?? null;

try {
    $pdo = getDbConnection();

    if ($publicId) {
        getEquipment($pdo, $publicId);
    } else {
        listEquipment($pdo);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}

function listEquipment($pdo) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 12)));
    $search = trim($_GET['search'] ?? '');
    $category = trim($_GET['category'] ?? '');
    $offset = ($page - 1) * $perPage;

    $where = [];
    $params = [];
    if ($search) {
        $where[] = 'name LIKE :search';
        $params[':search'] = '%' . $search . '%';
    }
    if ($category) {
        $where[] = 'category = :category';
        $params[':category'] = $category;
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $countSql = "SELECT COUNT(*) FROM equipment {$whereSql}";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    $sql = "SELECT public_id, name, image_path, category, price, description, sizes, created_at
            FROM equipment {$whereSql}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Truncate description for cards
    foreach ($items as &$item) {
        $item['short_desc'] = mb_substr(strip_tags($item['description'] ?? ''), 0, 120);
        unset($item['description']);
    }

    echo json_encode([
        'data' => $items,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => (int)ceil($total / $perPage),
    ]);
}

function getEquipment($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id, public_id, name, image_path, category, price, description, sizes, created_at FROM equipment WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    $equipId = $item['id'];
    unset($item['id']);

    $stmt = $pdo->prepare("SELECT feature FROM equipment_features WHERE equipment_id = :eid ORDER BY id ASC");
    $stmt->execute([':eid' => $equipId]);
    $item['features'] = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'feature');

    echo json_encode($item);
}
