<?php

/**
 * Seed script — creates a default admin user.
 *
 * Usage: docker compose exec web php /var/www/html/config/../../../database/seed_admin.php
 *   OR:  php database/seed_admin.php  (from project root, with DB env vars set)
 */

require_once __DIR__ . '/../config/database.php';

$username = 'admin';
$email    = 'admin@visadolphins.co.ke';
$password = 'admin123';

try {
    $pdo = getDbConnection();

    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);

    if ($stmt->fetch()) {
        echo "Admin user '{$username}' already exists. Skipping.\n";
        exit(0);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("INSERT INTO admin_users (username, email, password_hash) VALUES (?, ?, ?)");
    $stmt->execute([$username, $email, $hash]);

    echo "✓ Admin user created: {$username} / {$password}\n";
} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
