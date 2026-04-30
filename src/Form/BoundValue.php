<?php

declare(strict_types=1);

namespace App\Form;

final class BoundValue
{
    public function __construct(
        public readonly mixed $value,
        public readonly ?string $cast = null,
    ) {
    }

    public function placeholder(int $index): string
    {
        return $this->cast !== null ? "\${$index}::{$this->cast}" : "\${$index}";
    }
}
