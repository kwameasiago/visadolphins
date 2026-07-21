<?php

/**
 * Public Starred Athletes API
 *
 * GET /api/public/starred-athletes.php — Returns athletes marked as "star"
 */

require_once __DIR__ . '/../helpers/cors.php';
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->query(
        "SELECT id, public_id, name, image_path, created_at
         FROM athletes
         WHERE star = 1
         ORDER BY created_at DESC"
    );
    $athletes = $stmt->fetchAll();

    foreach ($athletes as &$athlete) {
        $athleteId = (int)$athlete['id'];

        // Get highlights
        $hs = $pdo->prepare("SELECT highlight FROM athlete_highlights WHERE athlete_id = ?");
        $hs->execute([$athleteId]);
        $athlete['highlights'] = array_column($hs->fetchAll(), 'highlight');

        unset($athlete['id']);
    }

    echo json_encode(['data' => $athletes]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
