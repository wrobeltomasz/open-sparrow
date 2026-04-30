<?php

declare(strict_types=1);

namespace App\Persistence;

final class Identifier
{
    public static function quote(string $name): string
    {
        return '"' . str_replace('"', '""', $name) . '"';
    }

    public static function quoteQualified(string $schema, string $table): string
    {
        return self::quote($schema) . '.' . self::quote($table);
    }
}
