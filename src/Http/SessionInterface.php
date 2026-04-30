<?php

declare(strict_types=1);

namespace App\Http;

interface SessionInterface
{
    public function get(string $key, mixed $default = null): mixed;
    public function set(string $key, mixed $value): void;
    public function has(string $key): bool;
    public function userId(): int;
    public function role(): string;
}
