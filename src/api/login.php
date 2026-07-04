<?php

/**
 * POST /api/login.php
 * Body: { "username": "...", "password": "..." }
 * Returns: { "token": "..." } on success
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/helpers/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['username']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password are required']);
    exit;
}

$username = trim($input['username']);
$password = $input['password'];

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare("SELECT id, username, email, password_hash FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        exit;
    }

    $secret = getenv('JWT_SECRET') ?: 'default-jwt-secret-change-me';

    $token = jwt_encode([
        'sub'      => $user['id'],
        'username' => $user['username'],
        'email'    => $user['email'],
        'iat'      => time(),
        'exp'      => time() + 3600, // 1 hour
    ], $secret);

    echo json_encode(['token' => $token]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
