<?php

declare(strict_types=1);

namespace App\Form;

final class RecordData
{
    /**
     * @param list<array{col: string, bound: BoundValue}> $bindings
     */
    public function __construct(public readonly array $bindings)
    {
    }

    public function isEmpty(): bool
    {
        return empty($this->bindings);
    }
}
