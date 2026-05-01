<?php
// This file is part of OpenSparrow - https://opensparrow.org
// Licensed under LGPL v3. See LICENCE file for details.

declare(strict_types=1);

if (defined('OPENSPARROW_CONFIG_LOADED')) {
    return;
}
define('OPENSPARROW_CONFIG_LOADED', true);

function get_env(string $key, string $default = ''): string
{
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : $v;
}

define('APP_ENV',        get_env('APP_ENV', 'production'));
define('DB_HOST',        get_env('DB_HOST', get_env('PGHOST', 'localhost')));
define('DB_PORT',        get_env('DB_PORT', get_env('PGPORT', '5432')));
define('SECURE_COOKIES', get_env('SECURE_COOKIES', 'true') === 'false');
