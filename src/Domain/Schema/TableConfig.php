<?php

declare(strict_types=1);

namespace App\Domain\Schema;

final class TableConfig
{
    /**
     * @param array<string, ColumnConfig>          $columns
     * @param array<string, array<string, mixed>>  $foreignKeys
     * @param list<array<string, mixed>>           $subtables
     */
    public function __construct(
        public readonly string $name,
        public readonly string $schema,
        public readonly string $displayName,
        public readonly array $columns,
        public readonly array $foreignKeys,
        public readonly array $subtables,
        public readonly string $primaryKey = 'id',
        public readonly string $icon = '',
    ) {
    }

    /** Columns shown in edit/create forms (respects show_in_edit). */
    public function visibleColumns(): array
    {
        return array_filter($this->columns, fn(ColumnConfig $c) => $c->showInEdit);
    }

    /** Columns that may be written via POST — skips PK and readonly. */
    public function writableColumns(): array
    {
        return array_filter(
            $this->columns,
            fn(ColumnConfig $c) => $c->name !== $this->primaryKey && !$c->readonly
        );
    }

    public function column(string $name): ColumnConfig
    {
        return $this->columns[$name]
            ?? throw new \InvalidArgumentException("Unknown column: {$name}");
    }

    public function hasForeignKey(string $colName): bool
    {
        return isset($this->foreignKeys[$colName]);
    }

    public function foreignKey(string $colName): array
    {
        return $this->foreignKeys[$colName]
            ?? throw new \InvalidArgumentException("No FK for column: {$colName}");
    }
}
