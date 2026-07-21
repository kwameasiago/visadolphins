<?php

/**
 * Public Athletes API — No authentication required
 *
 * GET /api/public/athletes.php              — List (paginated, searchable)
 * GET /api/public/athletes.php?id=<uuid>    — Single athlete detail
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
        getAthlete($pdo, $publicId);
    } else {
        listAthletes($pdo);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}

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
    $sql = "SELECT a.id, a.public_id, a.name, a.image_path, a.bio, a.created_at
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
    $stmt = $pdo->prepare("SELECT id, public_id, name, image_path, bio, created_at FROM athletes WHERE public_id = ?");
    $stmt->execute([$publicId]);
    $athlete = $stmt->fetch();

    if (!$athlete) {
        http_response_code(404);
        echo json_encode(['error' => 'Athlete not found']);
        return;
    }

    $athleteId = (int)$athlete['id'];
    $athlete['personal_bests'] = getPersonalBests($pdo, $athleteId);
    $athlete['highlights'] = getHighlightsSimple($pdo, $athleteId);
    unset($athlete['id']);

    echo json_encode($athlete);
}

function getPersonalBests(PDO $pdo, int $athleteId): array
{
    $stmt = $pdo->prepare("SELECT event, time, date FROM athlete_personal_bests WHERE athlete_id = ?");
    $stmt->execute([$athleteId]);
    return $stmt->fetchAll();
}

function getHighlightsSimple(PDO $pdo, int $athleteId): array
{
    $stmt = $pdo->prepare("SELECT highlight FROM athlete_highlights WHERE athlete_id = ?");
    $stmt->execute([$athleteId]);
    return array_column($stmt->fetchAll(), 'highlight');
}
