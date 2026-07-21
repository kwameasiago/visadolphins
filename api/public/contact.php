<?php

/**
 * Public Contact Form API
 *
 * POST /api/public/contact.php — Submit a contact form
 */

require_once __DIR__ . '/../helpers/cors.php';
header('Content-Type: application/json');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$name    = trim($input['name'] ?? '');
$phone   = trim($input['phone'] ?? '');
$email   = trim($input['email'] ?? '');
$subject = trim($input['subject'] ?? '');
$message = trim($input['message'] ?? '');

if (!$name || !$message) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and message are required']);
    exit;
}

if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

try {
    $pdo = getDbConnection();

    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    $publicId = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));

    $stmt = $pdo->prepare(
        "INSERT INTO contact_submissions (public_id, name, phone, email, subject, message)
         VALUES (:pid, :name, :phone, :email, :subject, :message)"
    );
    $stmt->execute([
        ':pid'     => $publicId,
        ':name'    => $name,
        ':phone'   => $phone ?: null,
        ':email'   => $email ?: null,
        ':subject' => $subject ?: null,
        ':message' => $message,
    ]);

    http_response_code(201);
    echo json_encode(['message' => 'Thank you! Your message has been sent.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error. Please try again later.']);
}
