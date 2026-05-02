<?php
// admin/index.php

require __DIR__ . '/../includes/config.php';

// Set secure session cookie parameters before starting the session
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => SECURE_COOKIES,
    'httponly' => true,
    'samesite' => SESSION_SAMESITE,
]);

session_start();

// First-run bypass: if spw_users table doesn't exist yet the panel must be
// reachable so the operator can run "Initialize System Tables". Once the table
// exists and contains at least one admin account, normal auth applies.
$firstRun = false;
require_once __DIR__ . '/../includes/db.php';
$_conn = @db_connect();
if (!$_conn) {
    $firstRun = true;
} else {
    $tUsers = sys_table('users');
    $chk = @pg_query($_conn, "SELECT 1 FROM $tUsers LIMIT 1");
    if ($chk === false) {
        $firstRun = true;
    }
}
unset($_conn, $chk);

// Redirect to login if not authenticated (skipped on first run)
if (!$firstRun && !isset($_SESSION['user_id'])) {
    header("Location: ../login.php");
    exit;
}

// Only admin role may access this panel (skipped on first run)
if (!$firstRun && ($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>403 Forbidden</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { margin: 0; font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; }
            .card { background: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 380px; border: 1px solid #e2e8f0; }
            h1 { color: #ef4444; font-size: 22px; margin-bottom: 10px; }
            p { color: #64748b; font-size: 14px; }
            a { color: #3b82f6; text-decoration: none; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Access Denied</h1>
            <p>Your account does not have permission to access the admin panel.</p>
            <p><a href="../">Return to application</a></p>
        </div>
    </body>
    </html>
    <?php
    exit;
}

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="current-user-id" content="<?php echo (int)($_SESSION['user_id'] ?? 0); ?>">
    <title>Sparrow Admin | Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES); ?>">
    
    <link rel="stylesheet" href="../assets/css/styles.css">
    <link rel="stylesheet" href="style.css?v=<?php echo @filemtime('style.css'); ?>">
</head>
<body>
    <?php if ($firstRun) : ?>
    <div style="background:#fef3c7; border-bottom:2px solid #f59e0b; padding:12px 20px; font-size:14px; color:#92400e; text-align:center;">
        <strong>First-run setup mode.</strong>
        Go to <strong>System &rarr; Database</strong> and click <strong>Initialize System Tables</strong>.
        This will create the default admin account (<code>admin</code> / <code>admin</code>).
        Afterwards <a href="../login.php" style="color:#92400e; font-weight:bold;">log in</a> and change the password immediately.
    </div>
    <?php endif; ?>
    <header>
    <a href="/" class="brand-logo">
        <img src="../assets/img/logo-blue.png" alt="Sparrow Logo" />
    </a>
        
        <div class="admin-header-tabs">
            <button class="admin-tab active" data-file="schema">Schema</button>
            <button class="admin-tab" data-file="dashboard">Dashboard</button>
            <button class="admin-tab" data-file="calendar">Calendar</button>
            <button class="admin-tab" data-file="workflows">Workflows</button>
            <button class="admin-tab" data-file="files">Files</button>
            <button class="admin-tab" data-file="menu">Menu Preview</button>
        </div>

        <div class="header-user-menu">
            <label style="color: white; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer; opacity: 0.9; margin-right: 10px;">
                <input type="checkbox" id="debugToggle" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--accent);">
                Debug FE mode
            </label>
            
            <div class="config-dropdown" id="systemDropdownContainer">
                <button type="button" class="btn-logout" style="background: #334155; border-color: #475569;" onclick="document.getElementById('systemDropdownContainer').classList.toggle('active')">System &#9662;</button>
                <div class="config-dropdown-content">
                    <button class="admin-tab" data-file="database">Database</button>
                    <button class="admin-tab" data-file="users">Users</button>
                    <button class="admin-tab" data-file="health">System Health</button>
                    <button class="admin-tab" data-file="backup">Backup Tables</button>
                    <button id="btnRunCron" type="button">Run Notifications Cron</button>
                </div>
            </div>
            
            <button id="btnSave" type="button">Save config</button>
            
            <div class="config-dropdown" id="configDropdownContainer">
                <button type="button" class="btn-logout" style="background: var(--accent); border-color: var(--accent);" onclick="document.getElementById('configDropdownContainer').classList.toggle('active')">Configuration &#9662;</button>
                <div class="config-dropdown-content">
                    <button id="btnExport" type="button">Export config files</button>
                    <button id="btnImport" type="button">Import config files</button>
                </div>
                <input type="file" id="importFileInput" accept=".zip" style="display: none;">
            </div>

        <button class="admin-tab" data-file="docs" title="Admin panel documentation" style="background: transparent; border: none; cursor: pointer; padding: 0; margin-right: 10px; display: flex; align-items: center;">
            <img src="../assets/icons/book_3s.png" alt="Docs" style="width: 24px; height: 24px; filter: brightness(0) invert(1); opacity: 0.9; pointer-events: none;">
        </button>
            
            <button onclick="window.location.href='../logout.php'" class="btn-logout" style="background: #ef4444; border-color: #ef4444;">Logout</button>
        </div>
    </header>

    <main class="admin-container">
        <aside class="admin-sidebar" id="sidebar">
            <h3 id="sidebarTitle">Tables</h3>
            <ul id="itemList"></ul>
        </aside>

        <section class="admin-workspace" id="workspace">
            <h2 style="margin-top: 0;">Select an item to edit</h2>
            <div id="editorForm"></div>
        </section>
    </main>

    <script type="module" src="app.js?v=<?php echo @filemtime('app.js'); ?>"></script>
    <script>
        // Close the dropdowns when clicking outside of them
        window.addEventListener('click', function(e) {
            const configDropdown = document.getElementById('configDropdownContainer');
            if (configDropdown && !configDropdown.contains(e.target)) {
                configDropdown.classList.remove('active');
            }
            
            const systemDropdown = document.getElementById('systemDropdownContainer');
            if (systemDropdown && !systemDropdown.contains(e.target)) {
                systemDropdown.classList.remove('active');
            }
        });
    </script>
</body>
</html>
