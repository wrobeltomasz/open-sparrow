<?php

declare(strict_types=1);

// PostgresGateway.php — PostgreSQL implementation of DatabaseGatewayInterface
// fetchAll($table): SELECT * from a pg connection; table name quoted via pg_escape_identifier; returns [] on failure
// Wraps a pg_connect() resource; default gateway used by DatabaseFactory
// Namespace OpenSparrow\Db

namespace OpenSparrow\Db;

class PostgresGateway implements DatabaseGatewayInterface
{
    /** @var resource */
    private $conn;

    /** @param resource $conn */
    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function fetchAll(string $table): array
    {
        $result = pg_query($this->conn, 'SELECT * FROM ' . pg_escape_identifier($this->conn, $table));
        if ($result === false) {
            return [];
        }
        return pg_fetch_all($result) ?: [];
    }
}
