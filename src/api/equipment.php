<?php

/**
 * Admin Equipment API — JWT-protected CRUD
 *
 * GET    /api/equipment.php              — List (paginated, searchable)
 * GET    /api/equipment.php?id=<uuid>    — Single item with features
 * POST   /api/equipment.php              — Create (multipart/form-data)
 * POST   /api/equipment.php?id=<uuid>    — Update (multipart/form-data)
 * DELETE /api/equipment.php?id=<uuid>    — Delete
 */

// Check if POST data was discarded due to size limit
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
            getEquipment($pdo, $publicId);
        } else {
            listEquipment($pdo);
        }
    } elseif ($method === 'POST') {
        if ($publicId) {
            updateEquipment($pdo, $publicId);
        } else {
            createEquipment($pdo);
        }
    } elseif ($method === 'DELETE') {
        if (!$publicId) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing id']);
            exit;
        }
        deleteEquipment($pdo, $publicId);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}

// ---- List ----
function listEquipment($pdo) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 12)));
    $search = trim($_GET['search'] ?? '');
    $offset = ($page - 1) * $perPage;

    $where = '';
    $params = [];
    if ($search) {
        $where = 'WHERE name LIKE :search';
        $params[':search'] = '%' . $search . '%';
    }

    $countSql = "SELECT COUNT(*) FROM equipment {$where}";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    $sql = "SELECT public_id, name, image_path, category, price, created_at
            FROM equipment {$where}
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
function getEquipment($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id, public_id, name, image_path, category, price, description, sizes, created_at, updated_at FROM equipment WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    $equipId = $item['id'];
    unset($item['id']);

    $stmt = $pdo->prepare("SELECT id, feature FROM equipment_features WHERE equipment_id = :eid ORDER BY id ASC");
    $stmt->execute([':eid' => $equipId]);
    $item['features'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($item);
}

// ---- Create ----
function createEquipment($pdo) {
    $name = trim($_POST['name'] ?? '');
    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required']);
        return;
    }

    $publicId = generateUuid();
    $imagePath = handleImageUpload($publicId);
    $category = trim($_POST['category'] ?? '');
    $price = trim($_POST['price'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $sizes = trim($_POST['sizes'] ?? '');

    $stmt = $pdo->prepare("INSERT INTO equipment (public_id, name, image_path, category, price, description, sizes) VALUES (:pid, :name, :img, :cat, :price, :desc, :sizes)");
    $stmt->execute([
        ':pid' => $publicId,
        ':name' => $name,
        ':img' => $imagePath,
        ':cat' => $category ?: null,
        ':price' => $price ?: null,
        ':desc' => $description ?: null,
        ':sizes' => $sizes ?: null,
    ]);

    $equipId = (int)$pdo->lastInsertId();
    saveFeatures($pdo, $equipId, $_POST['features'] ?? null);

    http_response_code(201);
    echo json_encode(['public_id' => $publicId, 'message' => 'Created successfully']);
}

// ---- Update ----
function updateEquipment($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id, image_path FROM equipment WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    $name = trim($_POST['name'] ?? '');
    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required']);
        return;
    }

    $equipId = (int)$existing['id'];
    $imagePath = handleImageUpload($publicId);
    if ($imagePath && $existing['image_path']) {
        $oldFile = __DIR__ . '/../' . ltrim($existing['image_path'], '/');
        if (file_exists($oldFile)) unlink($oldFile);
    }
    if (!$imagePath) $imagePath = $existing['image_path'];

    $category = trim($_POST['category'] ?? '');
    $price = trim($_POST['price'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $sizes = trim($_POST['sizes'] ?? '');

    $stmt = $pdo->prepare("UPDATE equipment SET name = :name, image_path = :img, category = :cat, price = :price, description = :desc, sizes = :sizes, updated_at = NOW() WHERE public_id = :pid");
    $stmt->execute([
        ':name' => $name,
        ':img' => $imagePath,
        ':cat' => $category ?: null,
        ':price' => $price ?: null,
        ':desc' => $description ?: null,
        ':sizes' => $sizes ?: null,
        ':pid' => $publicId,
    ]);

    // Replace features
    $pdo->prepare("DELETE FROM equipment_features WHERE equipment_id = :eid")->execute([':eid' => $equipId]);
    saveFeatures($pdo, $equipId, $_POST['features'] ?? null);

    echo json_encode(['message' => 'Updated successfully']);
}

// ---- Delete ----
function deleteEquipment($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id, image_path FROM equipment WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    // Remove image file
    if ($existing['image_path']) {
        $file = __DIR__ . '/../' . ltrim($existing['image_path'], '/');
        if (file_exists($file)) unlink($file);
    }

    $pdo->prepare("DELETE FROM equipment WHERE id = :id")->execute([':id' => $existing['id']]);
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

    $uploadDir = __DIR__ . '/../uploads/equipment';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $destination = $uploadDir . '/' . $filename;
    move_uploaded_file($file['tmp_name'], $destination);

    return '/uploads/equipment/' . $filename;
}

function saveFeatures(PDO $pdo, int $equipId, ?string $json): void {
    if (!$json) return;
    $items = json_decode($json, true);
    if (!is_array($items)) return;

    $stmt = $pdo->prepare("INSERT INTO equipment_features (equipment_id, feature) VALUES (?, ?)");
    foreach ($items as $item) {
        $text = is_string($item) ? trim($item) : '';
        if ($text === '') continue;
        $stmt->execute([$equipId, $text]);
    }
}
