<?php
require __DIR__ . '/includes/config.php';

// Set secure session cookie parameters before starting the session
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

if (($_SESSION['role'] ?? 'viewer') === 'admin') {
    header("Location: admin/");
    exit;
}

// Enforce absolute session lifetime (8 hours) regardless of browser state
$sessionMaxLifetime = 8 * 60 * 60;
if (isset($_SESSION['created_at']) && (time() - $_SESSION['created_at']) > $sessionMaxLifetime) {
    session_destroy();
    header("Location: login.php");
    exit;
}

// Verify session integrity by comparing the stored User-Agent hash against the current request.
// Eliminates opportunistic session hijacking with stolen cookies from different clients.
$sessionUserAgent = $_SESSION['user_agent'] ?? null;
$currentUserAgent = hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? '');
if ($sessionUserAgent !== null && !hash_equals($sessionUserAgent, $currentUserAgent)) {
    session_destroy();
    header("Location: login.php");
    exit;
}

// Generate a unique nonce for Content Security Policy
$cspNonce = bin2hex(random_bytes(16));

// Apply essential security headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
// style-src uses nonce instead of unsafe-inline to prevent CSS injection attacks
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'nonce-$cspNonce'; script-src 'self' 'nonce-$cspNonce'");

// Retrieve user role with a safe fallback
$userRole = $_SESSION['role'] ?? 'viewer';

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Expose only capability flags to the client instead of the raw role name
// to reduce attack surface during reconnaissance
$userCaps = [
    'canEdit'   => $userRole === 'editor',
    'canExport' => in_array($userRole, ['editor', 'export'], true),
];
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>OpenSparrow | Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8'); ?>" />
    <link href="assets/css/styles.css" rel="stylesheet" />
    <link href="assets/css/mobile.css" rel="stylesheet" media="only screen and (max-width: 768px)" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <!-- Inline style attributes are not covered by nonce — moved to a nonce-protected style block -->
    <style nonce="<?php echo $cspNonce; ?>">
        #dashboardMain  { padding: 20px; width: 100%; overflow-y: auto; }
        #gridTitle      { margin-bottom: 20px; }
    </style>
</head>
<body>
<?php include 'templates/header.php'; ?>
<main id="dashboardMain">
    <h2 id="gridTitle">Dashboard</h2>
    <section id="dashboardSection" class="dashboard-grid"></section>
</main>
</div><?php include 'templates/footer.php'; ?>
<script nonce="<?php echo $cspNonce; ?>">
    // Expose binary capability flags only — never the raw role string
    window.USER_CAPS = <?php echo json_encode($userCaps, JSON_THROW_ON_ERROR); ?>;
</script>
<script type="module" src="assets/js/dashboard.js" nonce="<?php echo $cspNonce; ?>"></script>
</body>
</html>
