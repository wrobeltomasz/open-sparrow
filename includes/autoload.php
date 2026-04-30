<?php

declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    if (!str_starts_with($class, 'App\\')) {
        return;
    }
    $rel  = substr($class, 4);
    $path = __DIR__ . '/../src/' . str_replace('\\', DIRECTORY_SEPARATOR, $rel) . '.php';
    if (is_file($path)) {
        require $path;
    }
});
