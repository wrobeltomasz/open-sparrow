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

// -------------------------------------------------------------------------
// Runtime environment
// -------------------------------------------------------------------------

// Application environment. Controls environment-specific behaviour such as
// error reporting verbosity. Set to "development" during local development.
define('APP_ENV', get_env('APP_ENV', 'production'));

// -------------------------------------------------------------------------
// Database connection
// -------------------------------------------------------------------------

// Hostname of the PostgreSQL server. Falls back to the standard PGHOST env var.
define('DB_HOST', get_env('DB_HOST', get_env('PGHOST', 'localhost')));

// Port the PostgreSQL server listens on. Falls back to the standard PGPORT env var.
define('DB_PORT', get_env('DB_PORT', get_env('PGPORT', '5432')));

// Maximum number of seconds to wait when establishing a database connection
// before giving up and throwing a RuntimeException.
define('DB_CONNECT_TIMEOUT', (int) get_env('DB_CONNECT_TIMEOUT', '5'));

// PostgreSQL time zone applied at the session level immediately after connecting.
// Must be a valid IANA tz database identifier (e.g. "UTC", "Europe/Warsaw").
define('APP_TIMEZONE', get_env('APP_TIMEZONE', 'Europe/Warsaw'));

// -------------------------------------------------------------------------
// Session & cookies
// -------------------------------------------------------------------------

// Controls the Secure flag on session cookies. Set to "false" on plain HTTP
// (local development without TLS); always "true" in production.
define('SECURE_COOKIES', get_env('SECURE_COOKIES', 'true') === 'true');

// SameSite policy for session cookies. "Lax" is the recommended value — it
// blocks cross-site POST requests while allowing same-site redirects.
// "Strict" breaks logins that redirect across paths (e.g. login.php → admin/).
define('SESSION_SAMESITE', get_env('SESSION_SAMESITE', 'Lax'));

// Maximum session lifetime in seconds. After this period the user is logged out
// regardless of browser cookie state. Default is 8 hours (28 800 s).
define('SESSION_MAX_LIFETIME', (int) get_env('SESSION_MAX_LIFETIME', '28800'));

// -------------------------------------------------------------------------
// Authentication & rate limiting
// -------------------------------------------------------------------------

// HMAC-SHA256 secret used to pseudonymise client IP addresses before storing
// them in the login_attempts table. Must be set via environment variable in
// production — there is no safe hardcoded fallback.
define('IP_HASH_SALT', get_env('IP_HASH_SALT', ''));

// Maximum number of failed login attempts allowed from a single IP address
// within the lockout window before that IP is temporarily blocked.
define('LOGIN_MAX_ATTEMPTS_PER_IP', (int) get_env('LOGIN_MAX_ATTEMPTS_PER_IP', '20'));

// Maximum number of failed login attempts allowed for a single username
// within the lockout window before that account is temporarily blocked.
define('LOGIN_MAX_ATTEMPTS_PER_USERNAME', (int) get_env('LOGIN_MAX_ATTEMPTS_PER_USERNAME', '5'));

// Duration in minutes for which a locked-out IP or username is blocked
// after exceeding the respective attempt threshold.
define('LOGIN_LOCKOUT_MINUTES', (int) get_env('LOGIN_LOCKOUT_MINUTES', '15'));

// -------------------------------------------------------------------------
// Demo mode
// -------------------------------------------------------------------------

// When true, write operations (save, delete, import) are blocked in the admin
// panel API, allowing safe public demonstrations without risking data changes.
define('DEMO_MODE', get_env('DEMO_MODE', 'false') === 'true');

// -------------------------------------------------------------------------
// File storage & uploads
// -------------------------------------------------------------------------

// Default maximum upload size in megabytes, used when the value is not
// specified in the files module configuration (includes/files.json).
define('FILES_MAX_SIZE_MB', (int) get_env('FILES_MAX_SIZE_MB', '20'));

// Default number of file records returned per page in the file listing API.
define('FILES_PAGE_LIMIT', (int) get_env('FILES_PAGE_LIMIT', '25'));

// Hard ceiling on the number of file records a single API request may return,
// regardless of the "limit" query parameter supplied by the client.
define('FILES_PAGE_LIMIT_MAX', (int) get_env('FILES_PAGE_LIMIT_MAX', '100'));

// Maximum pixel width for generated image thumbnails. The height is scaled
// proportionally. Images narrower than this value are served as-is.
define('THUMBNAIL_MAX_WIDTH', (int) get_env('THUMBNAIL_MAX_WIDTH', '300'));

// Cache-Control max-age in seconds for standard file downloads (private cache).
define('FILE_CACHE_MAX_AGE', (int) get_env('FILE_CACHE_MAX_AGE', '3600'));

// Cache-Control max-age in seconds for generated thumbnails (public cache).
// Longer than FILE_CACHE_MAX_AGE because thumbnails are deterministic and safe
// to store in shared caches.
define('THUMBNAIL_CACHE_MAX_AGE', (int) get_env('THUMBNAIL_CACHE_MAX_AGE', '86400'));

// -------------------------------------------------------------------------
// Comments
// -------------------------------------------------------------------------

// Hard ceiling on the number of comments a single API request may return when
// a "limit" query parameter is provided (used for preview/inline widgets).
define('COMMENTS_PAGE_LIMIT_MAX', (int) get_env('COMMENTS_PAGE_LIMIT_MAX', '50'));

// -------------------------------------------------------------------------
// Notifications
// -------------------------------------------------------------------------

// Maximum number of notifications fetched for the dropdown bell menu.
// Increasing this value affects header rendering time for every page load.
define('NOTIFICATIONS_DROPDOWN_LIMIT', (int) get_env('NOTIFICATIONS_DROPDOWN_LIMIT', '10'));

// -------------------------------------------------------------------------
// Admin panel
// -------------------------------------------------------------------------

// Maximum allowed size in bytes for JSON configuration files read by the admin
// panel (schema.json, menu.json, etc.). Prevents memory exhaustion from
// unexpectedly large or corrupt files.
define('CONFIG_FILE_MAX_BYTES', (int) get_env('CONFIG_FILE_MAX_BYTES', '524288'));

// -------------------------------------------------------------------------
// HTTP security headers
// -------------------------------------------------------------------------

// max-age value (in seconds) for the Strict-Transport-Security header.
// Default is 1 year (31 536 000 s). Set to 0 to disable HSTS on plain HTTP.
define('HSTS_MAX_AGE', (int) get_env('HSTS_MAX_AGE', '31536000'));
