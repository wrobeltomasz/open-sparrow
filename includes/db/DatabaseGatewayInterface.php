<?php

declare(strict_types=1);

// DatabaseGatewayInterface.php — Common contract for read gateways (PostgreSQL + MySQL)
// Single method fetchAll(string $table): array — returns all rows of a table as associative arrays
// Implemented by PostgresGateway and MysqlGateway; selected per table by DatabaseFactory
// Namespace OpenSparrow\Db

namespace OpenSparrow\Db;

interface DatabaseGatewayInterface
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function fetchAll(string $table): array;
}
