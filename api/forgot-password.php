<?php

/**
 * POST /api/forgot-password.php
 * Body: { "email": "..." }
 * Returns: { "message": "...", "reset_link": "..." }
 *
 * Generates a reset token, stores it in DB, and returns the reset link
 * in the response (no email sent yet).
 */

header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit;
}

$email = trim($input['email']);

try {
    $pdo = getDbConnection();

    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE email = ?");
    $stmt->execute([$email]);

    if (!$stmt->fetch()) {
        // Return generic message to prevent email enumeration
        echo json_encode(['message' => 'If that email exists, a reset link has been generated.']);
        exit;
    }

    // Invalidate any existing unused tokens for this email
    $stmt = $pdo->prepare("UPDATE password_resets SET used = 1 WHERE email = ? AND used = 0");
    $stmt->execute([$email]);

    // Generate new token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour

    $stmt = $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$email, $token, $expiresAt]);

    // Build reset link (uses admin path on the same origin)
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8082';
    $resetLink = "{$scheme}://{$host}/admin/reset-password.html?token={$token}";

    echo json_encode([
        'message'    => 'If that email exists, a reset link has been generated.',
        'reset_link' => $resetLink,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error']);
}
