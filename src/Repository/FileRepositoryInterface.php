<?php

declare(strict_types=1);

namespace App\Repository;

interface FileRepositoryInterface
{
    /** @return list<array<string, mixed>> */
    public function forRecord(string $table, string|int $id): array;
}
