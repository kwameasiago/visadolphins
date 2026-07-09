<?php

/**
 * Public Applications API
 *
 * POST /api/public/applications.php — Submit a swimming or corporate application
 */

header('Content-Type: application/json');

require_once __DIR__ . '/../../config/database.php';

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

$formType = trim($input['form_type'] ?? '');
if (!in_array($formType, ['swimming', 'corporate'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid form type']);
    exit;
}

$name  = trim($input['name'] ?? '');
$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');

if (!$name) {
    http_response_code(400);
    echo json_encode(['error' => 'Name is required']);
    exit;
}

if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

// Form-specific validation
$level = null;
$schoolName = null;
$numStudents = null;

if ($formType === 'swimming') {
    $level = trim($input['level'] ?? '');
    $validLevels = ['novice', 'intermediate', 'elite', 'professional'];
    if (!$level || !in_array(strtolower($level), $validLevels)) {
        http_response_code(400);
        echo json_encode(['error' => 'Please select a valid level']);
        exit;
    }
    $level = ucfirst(strtolower($level));
} elseif ($formType === 'corporate') {
    $schoolName = trim($input['school_name'] ?? '');
    $numStudents = (int)($input['num_students'] ?? 0);
    if (!$schoolName) {
        http_response_code(400);
        echo json_encode(['error' => 'School/Organisation name is required']);
        exit;
    }
    if ($numStudents < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Number of students is required']);
        exit;
    }
}

try {
    $pdo = getDbConnection();

    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    $publicId = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));

    $stmt = $pdo->prepare(
        "INSERT INTO applications (public_id, form_type, name, phone, email, level, school_name, num_students)
         VALUES (:pid, :form_type, :name, :phone, :email, :level, :school_name, :num_students)"
    );
    $stmt->execute([
        ':pid'          => $publicId,
        ':form_type'    => $formType,
        ':name'         => $name,
        ':phone'        => $phone ?: null,
        ':email'        => $email ?: null,
        ':level'        => $level,
        ':school_name'  => $schoolName,
        ':num_students' => $numStudents ?: null,
    ]);

    http_response_code(201);
    echo json_encode(['message' => 'Application submitted successfully! We will be in touch soon.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error. Please try again later.']);
}
