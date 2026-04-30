<?php

declare(strict_types=1);

namespace App\Csrf;

interface CsrfTokenManagerInterface
{
    public function token(): string;
    public function isValid(string $given): bool;
}
