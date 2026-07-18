<?php

/**
 * GET /health.php
 * Health check endpoint — returns API and database status.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

$response = [
    'status' => 'ok',
    'timestamp' => date('c'),
    'service' => 'visadolphins-api'
];

try {
    $pdo = getDbConnection();
    $pdo->query('SELECT 1');
    $response['database'] = 'connected';
} catch (Exception $e) {
    $response['status'] = 'degraded';
    $response['database'] = 'unreachable';
    http_response_code(503);
}

echo json_encode($response);
