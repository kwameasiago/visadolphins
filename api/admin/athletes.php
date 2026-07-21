<?php

/**
 * Admin Athletes API — JWT-protected CRUD
 *
 * GET    /api/athletes.php              — List (paginated, searchable)
 * GET    /api/athletes.php?id=<uuid>    — Single athlete detail
 * POST   /api/athletes.php              — Create athlete (multipart/form-data)
 * POST   /api/athletes.php?id=<uuid>    — Update athlete (multipart/form-data)
 * DELETE /api/athletes.php?id=<uuid>    — Delete athlete
 */

require_once __DIR__ . '/../helpers/cors.php';

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
require_once __DIR__ . '/../helpers/auth.php';

// Authenticate
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$publicId = $_GET['id'] ?? null;

try {
    $pdo = getDbConnection();

    if ($method === 'GET') {
        if ($publicId) {
            getAthlete($pdo, $publicId);
        } else {
            listAthletes($pdo);
        }
    } elseif ($method === 'POST') {
        if ($publicId) {
            updateAthlete($pdo, $publicId);
        } else {
            createAthlete($pdo);
        }
    } elseif ($method === 'DELETE') {
        if (!$publicId) {
            http_response_code(400);
            echo json_encode(['error' => 'Athlete ID required']);
            exit;
        }
        deleteAthlete($pdo, $publicId);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}

// ---- Handlers ----

function listAthletes(PDO $pdo): void
{
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 12)));
    $search = trim($_GET['search'] ?? '');
    $offset = ($page - 1) * $perPage;

    $where = '';
    $params = [];
    if ($search !== '') {
        $where = 'WHERE a.name LIKE ?';
        $params[] = "%{$search}%";
    }

    // Count
    $countSql = "SELECT COUNT(*) FROM athletes a {$where}";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // Fetch
    $sql = "SELECT a.id, a.public_id, a.name, a.image_path, a.star, a.bio, a.created_at
            FROM athletes a {$where}
            ORDER BY a.created_at DESC
            LIMIT {$perPage} OFFSET {$offset}";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $athletes = $stmt->fetchAll();

    // Attach PBs and highlights
    foreach ($athletes as &$athlete) {
        $athlete['personal_bests'] = getPersonalBests($pdo, $athlete['id']);
        $athlete['highlights'] = getHighlightsSimple($pdo, $athlete['id']);
        unset($athlete['id']);
    }

    echo json_encode([
        'data'        => $athletes,
        'page'        => $page,
        'per_page'    => $perPage,
        'total'       => $total,
        'total_pages' => (int)ceil($total / $perPage),
    ]);
}

function getAthlete(PDO $pdo, string $publicId): void
{
    $stmt = $pdo->prepare("SELECT id, public_id, name, image_path, star, bio, created_at FROM athletes WHERE public_id = ?");
    $stmt->execute([$publicId]);
    $athlete = $stmt->fetch();

    if (!$athlete) {
        http_response_code(404);
        echo json_encode(['error' => 'Athlete not found']);
        return;
    }

    $athlete['star'] = (bool)$athlete['star'];
    $athlete['personal_bests'] = getPersonalBestsDetailed($pdo, $athlete['id']);
    $athlete['highlights'] = getHighlightsDetailed($pdo, $athlete['id']);
    unset($athlete['id']);

    echo json_encode($athlete);
}

function createAthlete(PDO $pdo): void
{
    $name = trim($_POST['name'] ?? '');
    if ($name === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Name is required']);
        return;
    }

    $publicId = generateUuid();
    $imagePath = handleImageUpload($publicId);

    $star = isset($_POST['star']) ? (int)(bool)$_POST['star'] : 0;
    $bio = isset($_POST['bio']) ? trim($_POST['bio']) : null;

    $stmt = $pdo->prepare("INSERT INTO athletes (public_id, name, image_path, star, bio) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$publicId, $name, $imagePath, $star, $bio]);
    $athleteId = (int)$pdo->lastInsertId();

    savePersonalBests($pdo, $athleteId, $_POST['personal_bests'] ?? null);
    saveHighlights($pdo, $athleteId, $_POST['highlights'] ?? null);

    http_response_code(201);
    echo json_encode(['message' => 'Athlete created', 'public_id' => $publicId]);
}

function updateAthlete(PDO $pdo, string $publicId): void
{
    $stmt = $pdo->prepare("SELECT id, image_path FROM athletes WHERE public_id = ?");
    $stmt->execute([$publicId]);
    $athlete = $stmt->fetch();

    if (!$athlete) {
        http_response_code(404);
        echo json_encode(['error' => 'Athlete not found']);
        return;
    }

    $athleteId = (int)$athlete['id'];
    $updates = [];
    $params = [];

    $name = trim($_POST['name'] ?? '');
    if ($name !== '') {
        $updates[] = 'name = ?';
        $params[] = $name;
    }

    if (isset($_POST['star'])) {
        $updates[] = 'star = ?';
        $params[] = (int)(bool)$_POST['star'];
    }

    if (isset($_POST['bio'])) {
        $updates[] = 'bio = ?';
        $params[] = trim($_POST['bio']);
    }

    // Handle image
    $imagePath = handleImageUpload($publicId);
    if ($imagePath !== null) {
        // Delete old image
        if ($athlete['image_path']) {
            $oldFile = __DIR__ . '/..' . $athlete['image_path'];
            if (file_exists($oldFile)) {
                unlink($oldFile);
            }
        }
        $updates[] = 'image_path = ?';
        $params[] = $imagePath;
    }

    if (!empty($updates)) {
        $params[] = $publicId;
        $sql = "UPDATE athletes SET " . implode(', ', $updates) . " WHERE public_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    // Replace PBs if provided
    if (isset($_POST['personal_bests'])) {
        $pdo->prepare("DELETE FROM athlete_personal_bests WHERE athlete_id = ?")->execute([$athleteId]);
        savePersonalBests($pdo, $athleteId, $_POST['personal_bests']);
    }

    // Replace highlights if provided
    if (isset($_POST['highlights'])) {
        $pdo->prepare("DELETE FROM athlete_highlights WHERE athlete_id = ?")->execute([$athleteId]);
        saveHighlights($pdo, $athleteId, $_POST['highlights']);
    }

    echo json_encode(['message' => 'Athlete updated']);
}

function deleteAthlete(PDO $pdo, string $publicId): void
{
    $stmt = $pdo->prepare("SELECT id, image_path FROM athletes WHERE public_id = ?");
    $stmt->execute([$publicId]);
    $athlete = $stmt->fetch();

    if (!$athlete) {
        http_response_code(404);
        echo json_encode(['error' => 'Athlete not found']);
        return;
    }

    // Delete image file
    if ($athlete['image_path']) {
        $file = __DIR__ . '/..' . $athlete['image_path'];
        if (file_exists($file)) {
            unlink($file);
        }
    }

    $pdo->prepare("DELETE FROM athletes WHERE id = ?")->execute([$athlete['id']]);
    echo json_encode(['message' => 'Athlete deleted']);
}

// ---- Helpers ----

function generateUuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function handleImageUpload(string $publicId): ?string
{
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $file = $_FILES['image'];
    $maxSize = 5 * 1024 * 1024; // 5MB
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

    $uploadDir = __DIR__ . '/../uploads/athletes';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $destination = $uploadDir . '/' . $filename;
    move_uploaded_file($file['tmp_name'], $destination);

    return '/uploads/athletes/' . $filename;
}

function savePersonalBests(PDO $pdo, int $athleteId, ?string $json): void
{
    if (!$json) return;
    $items = json_decode($json, true);
    if (!is_array($items)) return;

    $stmt = $pdo->prepare("INSERT INTO athlete_personal_bests (athlete_id, event, time, date) VALUES (?, ?, ?, ?)");
    foreach ($items as $item) {
        if (empty($item['event']) || empty($item['time'])) continue;
        $stmt->execute([
            $athleteId,
            trim($item['event']),
            trim($item['time']),
            !empty($item['date']) ? $item['date'] : null,
        ]);
    }
}

function saveHighlights(PDO $pdo, int $athleteId, ?string $json): void
{
    if (!$json) return;
    $items = json_decode($json, true);
    if (!is_array($items)) return;

    $stmt = $pdo->prepare("INSERT INTO athlete_highlights (athlete_id, highlight) VALUES (?, ?)");
    foreach ($items as $item) {
        $text = is_string($item) ? trim($item) : '';
        if ($text === '') continue;
        $stmt->execute([$athleteId, $text]);
    }
}

function getPersonalBests(PDO $pdo, int $athleteId): array
{
    $stmt = $pdo->prepare("SELECT event, time, date FROM athlete_personal_bests WHERE athlete_id = ?");
    $stmt->execute([$athleteId]);
    return $stmt->fetchAll();
}

function getPersonalBestsDetailed(PDO $pdo, int $athleteId): array
{
    $stmt = $pdo->prepare("SELECT id, event, time, date FROM athlete_personal_bests WHERE athlete_id = ?");
    $stmt->execute([$athleteId]);
    return $stmt->fetchAll();
}

function getHighlightsSimple(PDO $pdo, int $athleteId): array
{
    $stmt = $pdo->prepare("SELECT highlight FROM athlete_highlights WHERE athlete_id = ?");
    $stmt->execute([$athleteId]);
    return array_column($stmt->fetchAll(), 'highlight');
}

function getHighlightsDetailed(PDO $pdo, int $athleteId): array
{
    $stmt = $pdo->prepare("SELECT id, highlight FROM athlete_highlights WHERE athlete_id = ?");
    $stmt->execute([$athleteId]);
    return $stmt->fetchAll();
}
