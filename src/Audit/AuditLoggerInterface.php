<?php

declare(strict_types=1);

namespace App\Audit;

interface AuditLoggerInterface
{
    public function log(int $userId, string $action, string $table, int $recordId): ?int;
}
