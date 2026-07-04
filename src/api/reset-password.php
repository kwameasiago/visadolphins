<?php

/**
 * POST /api/reset-password.php
 * Body: { "token": "...", "password": "..." }
 * Validates the token, updates the password, marks token as used.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['token']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Token and new password are required']);
    exit;
}

$token    = trim($input['token']);
$password = $input['password'];

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 6 characters']);
    exit;
}

try {
    $pdo = getDbConnection();

    // Find valid token
    $stmt = $pdo->prepare(
        "SELECT id, email FROM password_resets 
         WHERE token = ? AND used = 0 AND expires_at > NOW()"
    );
    $stmt->execute([$token]);
    $reset = $stmt->fetch();

    if (!$reset) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset token']);
        exit;
    }

    // Update the user's password
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("UPDATE admin_users SET password_hash = ? WHERE email = ?");
    $stmt->execute([$hash, $reset['email']]);

    // Mark token as used
    $stmt = $pdo->prepare("UPDATE password_resets SET used = 1 WHERE id = ?");
    $stmt->execute([$reset['id']]);

    echo json_encode(['message' => 'Password has been reset successfully']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
