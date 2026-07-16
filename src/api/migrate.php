<?php

/**
 * Migration API Endpoint
 * 
 * Runs all pending database migrations when called with the correct key.
 * Usage: GET /api/migrate.php?key=YOUR_MIGRATION_KEY
 */

header('Content-Type: application/json');

// Load environment
require_once __DIR__ . '/../config/env.php';
loadEnv();

require_once __DIR__ . '/../config/database.php';

// Validate migration key
$migrationKey = getenv('MIGRATION_KEY');
$providedKey = $_GET['key'] ?? '';

if (!$migrationKey || $providedKey !== $migrationKey) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// Run migrations
$migrationsDir = dirname(__DIR__, 2) . '/database/migrations';

try {
    $pdo = getDbConnection();

    // Ensure migrations table exists (bootstrap)
    $bootstrapSql = file_get_contents($migrationsDir . '/001_create_migrations_table.sql');
    $pdo->exec($bootstrapSql);

    // Get already-executed migrations
    $stmt = $pdo->query("SELECT migration FROM migrations ORDER BY id");
    $executed = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Get all migration files
    $files = glob($migrationsDir . '/*.sql');
    sort($files);

    $ran = [];
    foreach ($files as $file) {
        $name = basename($file);

        if (in_array($name, $executed)) {
            continue;
        }

        $sql = file_get_contents($file);
        $pdo->exec($sql);

        // Record migration
        $stmt = $pdo->prepare("INSERT INTO migrations (migration) VALUES (?)");
        $stmt->execute([$name]);

        $ran[] = $name;
    }

    // Seed admin user
    $seedMessage = '';
    $adminUsername = getenv('ADMIN_USERNAME') ?: 'admin';
    $adminEmail = getenv('ADMIN_EMAIL') ?: 'admin@visadolphins.co.ke';
    $adminPassword = getenv('ADMIN_PASSWORD') ?: 'admin123';

    $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE username = ?");
    $stmt->execute([$adminUsername]);

    if (!$stmt->fetch()) {
        $hash = password_hash($adminPassword, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO admin_users (username, email, password_hash) VALUES (?, ?, ?)");
        $stmt->execute([$adminUsername, $adminEmail, $hash]);
        $seedMessage = "Admin user '{$adminUsername}' created.";
    } else {
        $seedMessage = "Admin user '{$adminUsername}' already exists. Skipped.";
    }

    // Response
    $response = ['ran' => count($ran), 'seed' => $seedMessage];
    if (count($ran) === 0) {
        $response['message'] = 'Nothing to migrate. All up to date.';
    } else {
        $response['message'] = 'Migrations completed.';
        $response['migrations'] = $ran;
    }
    echo json_encode($response);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
