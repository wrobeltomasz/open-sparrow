<?php

declare(strict_types=1);

namespace App\Repository;

use App\Domain\Schema\TableConfig;
use App\Form\RecordData;

interface RecordRepositoryInterface
{
    public function find(TableConfig $cfg, string|int $id): ?array;
    public function update(TableConfig $cfg, string|int $id, RecordData $data): void;
    public function insert(TableConfig $cfg, RecordData $data): string|int;

    /**
     * @return list<array{config: array, rows: list<array>, schema: TableConfig}>
     */
    public function subtables(TableConfig $cfg, string|int $parentId): array;
}
