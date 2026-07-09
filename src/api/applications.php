<?php

/**
 * Admin Applications API — JWT-protected
 *
 * GET    /api/applications.php                  — List (paginated, searchable, filterable by form_type)
 * GET    /api/applications.php?id=<uuid>        — Single detail (marks as read)
 * DELETE /api/applications.php?id=<uuid>        — Delete
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/helpers/auth.php';

requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$publicId = $_GET['id'] ?? null;

try {
    $pdo = getDbConnection();

    if ($method === 'GET') {
        if ($publicId) {
            getApplication($pdo, $publicId);
        } else {
            listApplications($pdo);
        }
    } elseif ($method === 'DELETE') {
        if (!$publicId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing id']);
            exit;
        }
        deleteApplication($pdo, $publicId);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}

// ---- List ----
function listApplications($pdo) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $typeFilter = trim($_GET['type'] ?? '');
    $offset = ($page - 1) * $perPage;

    $where = [];
    $params = [];

    if ($typeFilter && in_array($typeFilter, ['swimming', 'corporate'])) {
        $where[] = 'form_type = :ftype';
        $params[':ftype'] = $typeFilter;
    }

    if ($search) {
        $where[] = '(name LIKE :s1 OR email LIKE :s2 OR school_name LIKE :s3)';
        $params[':s1'] = '%' . $search . '%';
        $params[':s2'] = '%' . $search . '%';
        $params[':s3'] = '%' . $search . '%';
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM applications {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $unreadCount = (int)$pdo->query("SELECT COUNT(*) FROM applications WHERE is_read = 0")->fetchColumn();

    $sql = "SELECT public_id, form_type, name, phone, email, level, school_name, num_students, is_read, created_at
            FROM applications {$whereSql}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'data' => $items,
        'total' => $total,
        'unread' => $unreadCount,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => (int)ceil($total / $perPage),
    ]);
}

// ---- Single (marks as read) ----
function getApplication($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT public_id, form_type, name, phone, email, level, school_name, num_students, is_read, created_at FROM applications WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    if (!(int)$item['is_read']) {
        $pdo->prepare("UPDATE applications SET is_read = 1 WHERE public_id = :pid")->execute([':pid' => $publicId]);
        $item['is_read'] = '1';
    }

    echo json_encode($item);
}

// ---- Delete ----
function deleteApplication($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id FROM applications WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    $pdo->prepare("DELETE FROM applications WHERE id = :id")->execute([':id' => $existing['id']]);
    echo json_encode(['message' => 'Deleted successfully']);
}
