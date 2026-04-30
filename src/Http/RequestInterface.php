<?php

declare(strict_types=1);

namespace App\Http;

interface RequestInterface
{
    public function method(): string;
    public function query(string $key, string $default = ''): string;
    public function post(string $key, string $default = ''): string;
    public function postAll(): array;
    public function isPost(): bool;
}
