<?php

declare(strict_types=1);

namespace App\Http;

final class PhpSession implements SessionInterface
{
    public function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }

    public function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    public function has(string $key): bool
    {
        return isset($_SESSION[$key]);
    }

    public function userId(): int
    {
        return (int)($_SESSION['user_id'] ?? 0);
    }

    public function role(): string
    {
        return (string)($_SESSION['role'] ?? 'viewer');
    }
}
