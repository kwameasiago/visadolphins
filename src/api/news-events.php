<?php

/**
 * Admin News & Events API — JWT-protected CRUD
 *
 * GET    /api/news-events.php              — List (paginated, searchable)
 * GET    /api/news-events.php?id=<uuid>    — Single detail
 * POST   /api/news-events.php              — Create (multipart/form-data)
 * POST   /api/news-events.php?id=<uuid>    — Update (multipart/form-data)
 * DELETE /api/news-events.php?id=<uuid>    — Delete
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

// Authenticate
requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$publicId = $_GET['id'] ?? null;

try {
    $pdo = getDbConnection();

    if ($method === 'GET') {
        if ($publicId) {
            getNewsEvent($pdo, $publicId);
        } else {
            listNewsEvents($pdo);
        }
    } elseif ($method === 'POST') {
        if ($publicId) {
            updateNewsEvent($pdo, $publicId);
        } else {
            createNewsEvent($pdo);
        }
    } elseif ($method === 'DELETE') {
        if (!$publicId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit;
        }
        deleteNewsEvent($pdo, $publicId);
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}

// ---- List ----
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

    $sql = "SELECT n.public_id, n.title, n.body, n.star, n.created_at, n.updated_at,
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

    echo json_encode([
        'data' => $items,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => ceil($total / $perPage),
    ]);
}

// ---- Single ----
function getNewsEvent($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id, public_id, title, body, star, created_at, updated_at FROM news_events WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    // Get all media
    $stmt = $pdo->prepare("SELECT id, media_type, media_path, sort_order, is_thumbnail FROM news_event_media WHERE news_event_id = :nid ORDER BY is_thumbnail DESC, sort_order ASC");
    $stmt->execute([':nid' => $item['id']]);
    $item['media'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    unset($item['id']);

    echo json_encode($item);
}

// ---- Create ----
function createNewsEvent($pdo) {
    $title = trim($_POST['title'] ?? '');
    $body = $_POST['body'] ?? '';

    if (!$title) {
        http_response_code(400);
        echo json_encode(['error' => 'Title is required']);
        return;
    }

    $publicId = generateUUID();

    $star = isset($_POST['star']) ? (int)(bool)$_POST['star'] : 0;

    $stmt = $pdo->prepare("INSERT INTO news_events (public_id, title, body, star) VALUES (:pid, :title, :body, :star)");
    $stmt->execute([':pid' => $publicId, ':title' => $title, ':body' => $body, ':star' => $star]);

    $newsEventId = $pdo->lastInsertId();

    // Handle media (with thumbnail flag)
    $thumbnailIndex = (int)($_POST['thumbnail_index'] ?? 0);
    saveMedia($pdo, $newsEventId, $thumbnailIndex);

    http_response_code(201);
    echo json_encode(['public_id' => $publicId, 'message' => 'Created successfully']);
}

// ---- Update ----
function updateNewsEvent($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id FROM news_events WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    $title = trim($_POST['title'] ?? '');
    $body = $_POST['body'] ?? '';

    if (!$title) {
        http_response_code(400);
        echo json_encode(['error' => 'Title is required']);
        return;
    }

    $star = isset($_POST['star']) ? (int)(bool)$_POST['star'] : 0;

    $sql = "UPDATE news_events SET title = :title, body = :body, star = :star, updated_at = NOW() WHERE public_id = :pid";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':title' => $title, ':body' => $body, ':star' => $star, ':pid' => $publicId]);

    $newsEventId = $existing['id'];

    // Remove media marked for deletion
    $removeMediaIds = json_decode($_POST['remove_media'] ?? '[]', true);
    if (!empty($removeMediaIds)) {
        foreach ($removeMediaIds as $mediaId) {
            $stmt = $pdo->prepare("SELECT media_path FROM news_event_media WHERE id = :id AND news_event_id = :nid");
            $stmt->execute([':id' => $mediaId, ':nid' => $newsEventId]);
            $media = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($media && strpos($media['media_path'], '/uploads/') === 0) {
                $oldFile = __DIR__ . '/..' . $media['media_path'];
                if (file_exists($oldFile)) unlink($oldFile);
            }
            $pdo->prepare("DELETE FROM news_event_media WHERE id = :id AND news_event_id = :nid")->execute([':id' => $mediaId, ':nid' => $newsEventId]);
        }
    }

    // Update thumbnail flag on existing media
    $thumbnailId = $_POST['thumbnail_id'] ?? '';
    $pdo->prepare("UPDATE news_event_media SET is_thumbnail = 0 WHERE news_event_id = :nid")->execute([':nid' => $newsEventId]);
    if ($thumbnailId) {
        $pdo->prepare("UPDATE news_event_media SET is_thumbnail = 1 WHERE id = :id AND news_event_id = :nid")->execute([':id' => $thumbnailId, ':nid' => $newsEventId]);
    }

    // Add new media
    $newThumbIndex = (int)($_POST['new_thumbnail_index'] ?? -1);
    saveMedia($pdo, $newsEventId, $newThumbIndex);

    echo json_encode(['public_id' => $publicId, 'message' => 'Updated successfully']);
}

// ---- Delete ----
function deleteNewsEvent($pdo, $publicId) {
    $stmt = $pdo->prepare("SELECT id FROM news_events WHERE public_id = :pid");
    $stmt->execute([':pid' => $publicId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        return;
    }

    // Delete all media files
    $stmt = $pdo->prepare("SELECT media_path FROM news_event_media WHERE news_event_id = :nid");
    $stmt->execute([':nid' => $item['id']]);
    $mediaFiles = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($mediaFiles as $path) {
        if (strpos($path, '/uploads/') === 0) {
            $file = __DIR__ . '/..' . $path;
            if (file_exists($file)) unlink($file);
        }
    }

    $pdo->prepare("DELETE FROM news_events WHERE id = :id")->execute([':id' => $item['id']]);
    echo json_encode(['message' => 'Deleted successfully']);
}

// ---- Helpers ----
function saveMedia($pdo, $newsEventId, $thumbnailIndex = 0) {
    $insertedIndex = 0;

    // YouTube links passed as JSON array
    $youtubeLinks = json_decode($_POST['media_youtube'] ?? '[]', true);
    if (!empty($youtubeLinks)) {
        $stmt = $pdo->prepare("INSERT INTO news_event_media (news_event_id, media_type, media_path, sort_order, is_thumbnail) VALUES (:nid, 'youtube', :path, :sort, :thumb)");
        foreach ($youtubeLinks as $i => $url) {
            $url = trim($url);
            if ($url) {
                $isThumbnail = ($insertedIndex === $thumbnailIndex) ? 1 : 0;
                $stmt->execute([':nid' => $newsEventId, ':path' => $url, ':sort' => $insertedIndex, ':thumb' => $isThumbnail]);
                $insertedIndex++;
            }
        }
    }

    // File uploads (images and videos)
    if (!empty($_FILES['media_files'])) {
        $files = $_FILES['media_files'];
        $types = json_decode($_POST['media_file_types'] ?? '[]', true);
        $count = is_array($files['name']) ? count($files['name']) : 0;

        $stmt = $pdo->prepare("INSERT INTO news_event_media (news_event_id, media_type, media_path, sort_order, is_thumbnail) VALUES (:nid, :type, :path, :sort, :thumb)");

        for ($i = 0; $i < $count; $i++) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;

            $file = [
                'name' => $files['name'][$i],
                'type' => $files['type'][$i],
                'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i],
                'size' => $files['size'][$i],
            ];

            $path = uploadFile($file, 'news-events');
            if ($path) {
                $mediaType = $types[$i] ?? 'image';
                $isThumbnail = ($insertedIndex === $thumbnailIndex) ? 1 : 0;
                $stmt->execute([':nid' => $newsEventId, ':type' => $mediaType, ':path' => $path, ':sort' => $insertedIndex, ':thumb' => $isThumbnail]);
                $insertedIndex++;
            }
        }
    }
}

function uploadFile($file, $subdir) {
    $uploadDir = __DIR__ . '/../uploads/' . $subdir . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov'];
    if (!in_array($ext, $allowed)) return null;

    $filename = uniqid() . '_' . time() . '.' . $ext;
    $dest = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        return '/uploads/' . $subdir . '/' . $filename;
    }
    return null;
}

function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
