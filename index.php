<?php
require __DIR__ . '/includes/config.php';

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => SECURE_COOKIES,
    'httponly' => true,
    'samesite' => (APP_ENV === 'production' ? 'Strict' : 'Lax'),
]);
session_start();

// Redirect to login if user is not authenticated
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Define strict user role
$userRole = $_SESSION['role'] ?? 'readonly';

// Ensure CSRF token exists for this session
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$cspNonce = bin2hex(random_bytes(16));
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
// style-src allows 'unsafe-inline' for element style attributes used throughout the template
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-$cspNonce'; connect-src 'self'");

// Route API requests directly to api.php
if (isset($_GET['api'])) {
    require __DIR__ . '/api.php';
    exit;
}

// Load the UI template (schema is no longer injected here)
include __DIR__ . '/templates/template.php';