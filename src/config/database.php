<?php

/**
 * Database Configuration
 * Returns a PDO connection instance using environment variables.
 */

function getDbConnection(): PDO
{
    $host = getenv('DB_HOST') ?: 'db';
    $port = getenv('DB_PORT') ?: '3306';
    $database = getenv('DB_DATABASE') ?: 'visadolphins';
    $username = getenv('DB_USERNAME') ?: 'visadolphins';
    $password = getenv('DB_PASSWORD') ?: 'secret';

    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    return new PDO($dsn, $username, $password, $options);
}
