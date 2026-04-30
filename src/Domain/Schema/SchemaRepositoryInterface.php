<?php

declare(strict_types=1);

namespace App\Domain\Schema;

interface SchemaRepositoryInterface
{
    public function table(string $name): TableConfig;
    public function hasTable(string $name): bool;
    /** @return array<string, TableConfig> */
    public function all(): array;
    /** Raw schema array — for legacy code that still needs the full structure. */
    public function raw(): array;
}
