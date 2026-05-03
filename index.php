<?php
require __DIR__ . '/includes/config.php';

// First-run setup check: if database.json doesn't exist and user is not authenticated,
// redirect to the setup wizard
$databaseConfigExists = file_exists(__DIR__ . '/includes/database.json');
if (!$databaseConfigExists && !isset($_SESSION['user_id'])) {
    header('Location: setup.php');
    exit;
}

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => SECURE_COOKIES,
    'httponly' => true,
    'samesite' => SESSION_SAMESITE,
]);
session_start();

// Redirect to login if user is not authenticated
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Admin role belongs in the admin panel, not the frontend
if (($_SESSION['role'] ?? 'viewer') === 'admin') {
    header("Location: admin/");
    exit;
}

$userRole = $_SESSION['role'] ?? 'viewer';

// Ensure CSRF token exists for this session
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$cspNonce = bin2hex(random_bytes(16));
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Strict-Transport-Security: max-age=' . HSTS_MAX_AGE . '; includeSubDomains');
// style-src allows 'unsafe-inline' for element style attributes used throughout the template
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-$cspNonce'; connect-src 'self'");

// Route API requests directly to api.php
if (isset($_GET['api'])) {
    require __DIR__ . '/api.php';
    exit;
}

// Load the UI template (schema is no longer injected here)
include __DIR__ . '/templates/template.php';