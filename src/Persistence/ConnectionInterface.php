<?php

declare(strict_types=1);

namespace App\Persistence;

interface ConnectionInterface
{
    public function execute(string $sql, array $params = []): \PgSql\Result;
    public function exec(string $sql): \PgSql\Result;
    public function escapeLiteral(string $value): string;
    public function native(): \PgSql\Connection;
}
