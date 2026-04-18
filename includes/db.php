<?php

declare(strict_types=1);

function db_connect(): \PgSql\Connection
{
    $configFile = __DIR__ . '/database.json';

    // Default values fallback
    $host = getenv('PGHOST') ?: '';
    $port = getenv('PGPORT') ?: '';
    $dbname = getenv('PGDATABASE') ?: '';
    $user = getenv('PGUSER') ?: '';
    $password = getenv('PGPASSWORD') ?: '';

    // Load config from JSON file if exists
    if (file_exists($configFile)) {
        $json = file_get_contents($configFile);
        $config = json_decode($json, true);
        if (is_array($config)) {
            $host = !empty($config['host']) ? $config['host'] : $host;
            $port = !empty($config['port']) ? $config['port'] : $port;
            $dbname = !empty($config['dbname']) ? $config['dbname'] : $dbname;
            $user = !empty($config['user']) ? $config['user'] : $user;
            $password = $config['password'] ?? $password;
        }
    }

    // Build connection string
    $connStr = sprintf(
        "host=%s port=%s dbname=%s user=%s password=%s connect_timeout=5",
        $host,
        $port,
        $dbname,
        $user,
        $password
    );

    // Suppress native warnings and throw a safe generic exception
    $conn = @pg_connect($connStr);
    
    if (!$conn) {
        throw new RuntimeException('Cannot connect to Postgres. Check database credentials or server status.');
    }

    // Set timezone
    pg_query($conn, "SET TIME ZONE 'Europe/Warsaw'");
    
    return $conn;
}