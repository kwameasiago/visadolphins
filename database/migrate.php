<?php

/**
 * Database Migration Runner
 * 
 * Usage: php migrate.php
 * Runs all pending SQL migrations in the database/migrations/ directory.
 */

require_once __DIR__ . '/../src/config/database.php';

$migrationsDir = __DIR__ . '/migrations';

try {
    $pdo = getDbConnection();
    echo "✓ Connected to database.\n";

    // Ensure migrations table exists (bootstrap)
    $bootstrapSql = file_get_contents($migrationsDir . '/001_create_migrations_table.sql');
    $pdo->exec($bootstrapSql);

    // Get already-executed migrations
    $stmt = $pdo->query("SELECT migration FROM migrations ORDER BY id");
    $executed = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Get all migration files
    $files = glob($migrationsDir . '/*.sql');
    sort($files);

    $ran = 0;
    foreach ($files as $file) {
        $name = basename($file);

        if (in_array($name, $executed)) {
            continue;
        }

        echo "  Running: {$name} ... ";
        $sql = file_get_contents($file);
        $pdo->exec($sql);

        // Record migration
        $stmt = $pdo->prepare("INSERT INTO migrations (migration) VALUES (?)");
        $stmt->execute([$name]);

        echo "✓\n";
        $ran++;
    }

    if ($ran === 0) {
        echo "  Nothing to migrate. All up to date.\n";
    } else {
        echo "\n✓ Ran {$ran} migration(s).\n";
    }
} catch (PDOException $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
    exit(1);
}
