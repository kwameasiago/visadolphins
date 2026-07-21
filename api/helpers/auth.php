<?php

/**
 * Auth middleware — validates JWT from Authorization header.
 * Call requireAuth() at the top of protected endpoints.
 */

require_once __DIR__ . '/jwt.php';

function requireAuth(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';

    // Fallback: read from apache_request_headers if available
    if (empty($header) && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $token = $matches[1];
    $secret = getenv('JWT_SECRET') ?: ($_SERVER['JWT_SECRET'] ?? 'default-jwt-secret-change-me');
    $payload = jwt_decode($token, $secret);

    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    return $payload;
}
