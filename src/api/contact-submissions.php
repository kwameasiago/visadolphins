<?php

/**
 * Admin Contact Submissions API — JWT-protected
 *
 * GET    /api/contact-submissions.php              — List (paginated, searchable)
 * GET    /api/contact-submissions.php?id=<uuid>    — Single detail (marks as read)
 * DELETE /api/contact-submissions.php?id=<uuid>    — Delete
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
            getSubmission($pdo, $publicId);
        } else {
            listSubmissions($pdo);
        }
    } elseif ($method === 'DELETE') {
        if (!$publicId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing id']);
            exit;
        }
        deleteSubmission($pdo, $publicId);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}

// ---- List ----
function listSubmissions($pdo) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $offset = ($page - 1) * $perPage;

    $where = '';
    $params = [];
    if ($search) {
        $where = 'WHERE name LIKE :s1 OR email LIKE :s2 OR subject LIKE :s3';
        $params[':s1'] = '%' . $search . '%';
        $params[':s2'] = '%' . $search . '%';
        $params[':s3'] = '%' . $search . '%';
    }

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM contact_submissions {$where}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Unread count (always total unread, regardless of search)
    $unreadCount = (int)$pdo->query("SELECT COUNT(*) FROM contact_submissions WHERE is_read = 0")->fetchColumn();

    $sql = "SELECT public_id, name, phone, email, subject, is_read, created_at
            FROM contact_submissions {$where}
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
function getSubmission($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT public_id, name, phone, email, subject, message, is_read, created_at FROM contact_submissions WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    // Mark as read
    if (!(int)$item['is_read']) {
        $pdo->prepare("UPDATE contact_submissions SET is_read = 1 WHERE public_id = :pid")->execute([':pid' => $publicId]);
        $item['is_read'] = '1';
    }

    echo json_encode($item);
}

// ---- Delete ----
function deleteSubmission($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id FROM contact_submissions WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    $pdo->prepare("DELETE FROM contact_submissions WHERE id = :id")->execute([':id' => $existing['id']]);
    echo json_encode(['message' => 'Deleted successfully']);
}
