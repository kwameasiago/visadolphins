<?php

/**
 * Admin Gallery API — JWT-protected CRUD
 *
 * GET    /api/gallery.php              — List (paginated, searchable)
 * GET    /api/gallery.php?id=<uuid>    — Single image detail
 * POST   /api/gallery.php              — Create (multipart/form-data)
 * POST   /api/gallery.php?id=<uuid>    — Update
 * DELETE /api/gallery.php?id=<uuid>    — Delete
 */

if ($_SERVER['REQUEST_METHOD'] === 'POST' &&
    empty($_POST) && empty($_FILES) &&
    isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > 0) {
    header('Content-Type: application/json');
    $maxSize = ini_get('post_max_size');
    http_response_code(413);
    echo json_encode(['error' => "Upload too large. Maximum allowed size is {$maxSize}."]);
    exit;
}

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
            getImage($pdo, $publicId);
        } else {
            listImages($pdo);
        }
    } elseif ($method === 'POST') {
        if ($publicId) {
            updateImage($pdo, $publicId);
        } else {
            createImage($pdo);
        }
    } elseif ($method === 'DELETE') {
        if (!$publicId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing id']);
            exit;
        }
        deleteImage($pdo, $publicId);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}

// ---- List ----
function listImages($pdo) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
    $search = trim($_GET['search'] ?? '');
    $offset = ($page - 1) * $perPage;

    $where = '';
    $params = [];
    if ($search) {
        $where = 'WHERE caption LIKE :search OR tag LIKE :search2';
        $params[':search'] = '%' . $search . '%';
        $params[':search2'] = '%' . $search . '%';
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

    echo json_encode([
        'data' => $items,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => (int)ceil($total / $perPage),
    ]);
}

// ---- Single ----
function getImage($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT public_id, image_path, tag, caption, created_at FROM gallery WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    echo json_encode($item);
}

// ---- Create ----
function createImage($pdo) {
    $publicId = generateUuid();
    $imagePath = handleImageUpload($publicId);

    if (!$imagePath) {
        http_response_code(400);
        echo json_encode(['error' => 'Image is required']);
        return;
    }

    $tag = trim($_POST['tag'] ?? '');
    $caption = trim($_POST['caption'] ?? '');

    $stmt = $pdo->prepare("INSERT INTO gallery (public_id, image_path, tag, caption) VALUES (:pid, :img, :tag, :caption)");
    $stmt->execute([
        ':pid' => $publicId,
        ':img' => $imagePath,
        ':tag' => $tag ?: null,
        ':caption' => $caption ?: null,
    ]);

    http_response_code(201);
    echo json_encode(['public_id' => $publicId, 'message' => 'Uploaded successfully']);
}

// ---- Update ----
function updateImage($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id, image_path FROM gallery WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    $imagePath = handleImageUpload($publicId);
    if ($imagePath && $existing['image_path']) {
        $oldFile = __DIR__ . '/../' . ltrim($existing['image_path'], '/');
        if (file_exists($oldFile)) unlink($oldFile);
    }
    if (!$imagePath) $imagePath = $existing['image_path'];

    $tag = trim($_POST['tag'] ?? '');
    $caption = trim($_POST['caption'] ?? '');

    $stmt = $pdo->prepare("UPDATE gallery SET image_path = :img, tag = :tag, caption = :caption WHERE public_id = :pid");
    $stmt->execute([
        ':img' => $imagePath,
        ':tag' => $tag ?: null,
        ':caption' => $caption ?: null,
        ':pid' => $publicId,
    ]);

    echo json_encode(['message' => 'Updated successfully']);
}

// ---- Delete ----
function deleteImage($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id, image_path FROM gallery WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    if ($existing['image_path']) {
        $file = __DIR__ . '/../' . ltrim($existing['image_path'], '/');
        if (file_exists($file)) unlink($file);
    }

    $pdo->prepare("DELETE FROM gallery WHERE id = :id")->execute([':id' => $existing['id']]);
    echo json_encode(['message' => 'Deleted successfully']);
}

// ---- Helpers ----
function generateUuid(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function handleImageUpload(string $publicId): ?string {
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $file = $_FILES['image'];
    $maxSize = 5 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'Image must be under 5MB']);
        exit;
    }

    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Image must be jpg, png, or webp']);
        exit;
    }

    $extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $ext = $extMap[$mime];
    $filename = $publicId . '_' . time() . '.' . $ext;

    $uploadDir = __DIR__ . '/../uploads/gallery';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $destination = $uploadDir . '/' . $filename;
    move_uploaded_file($file['tmp_name'], $destination);

    return '/uploads/gallery/' . $filename;
}
