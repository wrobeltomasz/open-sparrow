<?php

declare(strict_types=1);

namespace App\Audit;

use App\Persistence\ConnectionInterface;

final class DbAuditLogger implements AuditLoggerInterface
{
    public function __construct(private readonly ConnectionInterface $conn)
    {
    }

    public function log(int $userId, string $action, string $table, int $recordId): void
    {
        $sql = 'INSERT INTO ' . sys_table('users_log')
             . ' (user_id, action, target_table, record_id) VALUES ($1, $2, $3, $4)';
        @pg_query_params($this->conn->native(), $sql, [$userId, $action, $table, $recordId]);
    }
}
