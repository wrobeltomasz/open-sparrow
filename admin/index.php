<?php
// admin/index.php

// Set secure session cookie parameters before starting the session
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);

session_start();

// Generate CSRF token for secure form submission and API requests
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Default password hash for fresh installation
$admin_password_hash = password_hash('admin', PASSWORD_DEFAULT);

$securityFile = __DIR__ . '/../includes/security.json';
if (file_exists($securityFile)) {
    $secData = json_decode(file_get_contents($securityFile), true);
    if (isset($secData['admin_password']) && $secData['admin_password'] !== '') {
        $storedPass = $secData['admin_password'];

        // Safely check if password is in plaintext
        $info = password_get_info($storedPass);
        if ($info['algoName'] === 'unknown') {
            $admin_password_hash = password_hash($storedPass, PASSWORD_DEFAULT);

            // Persist hashed password back to security.json so plaintext isn't stored
            // Prefer storing only the hash; file should be kept out of VCS and with restricted perms
            $secData['admin_password'] = $admin_password_hash;
            $encoded = json_encode($secData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            if ($encoded !== false) {
                $tmp = $securityFile . '.tmp';
                if (@file_put_contents($tmp, $encoded, LOCK_EX) !== false) {
                    @chmod($tmp, 0600);
                    @rename($tmp, $securityFile);
                } else {
                    // If persisting fails, continue using the in-memory hash but do not expose details
                }
            }
        } else {
            $admin_password_hash = $storedPass;
        }
    }
}

// Handle user logout
if (isset($_GET['logout'])) {
    // Fully destroy session and clear session cookie
    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_unset();
    session_destroy();

    header("Location: index.php");
    exit;
}

// Handle login attempt using secure hash verification and CSRF protection
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_password'])) {
    $csrfToken = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        $login_error = "Invalid request (CSRF check failed).";
    } elseif (password_verify($_POST['admin_password'], $admin_password_hash)) {
        // Prevent session fixation vulnerabilities
        session_regenerate_id(true); 
        $_SESSION['sparrow_admin_logged_in'] = true;
        header("Location: index.php");
        exit;
    } else {
        $login_error = "Invalid password!";
    }
}

// Render login screen if not authenticated
if (!isset($_SESSION['sparrow_admin_logged_in']) || $_SESSION['sparrow_admin_logged_in'] !== true) {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Sparrow Admin | Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            /* Embedded login styles for simplicity */
            body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; }
            .login-card { background: white; padding: 40px 30px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); width: 100%; max-width: 340px; text-align: center; border: 1px solid #e2e8f0; }
            .login-card h2 { margin-top: 0; color: #0f172a; font-weight: 700; font-size: 24px; margin-bottom: 8px; }
            .login-card p { font-size: 14px; color: #64748b; margin-bottom: 24px; }
            .login-card input { width: 100%; padding: 12px; margin: 10px 0 20px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; outline: none; font-family: inherit; font-size: 14px; transition: border-color 0.2s, box-shadow 0.2s; }
            .login-card input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
            .login-card button { width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 15px; transition: background 0.2s; }
            .login-card button:hover { background: #2563eb; }
            .error { color: #ef4444; font-size: 14px; margin-bottom: 15px; background: #fef2f2; padding: 10px; border-radius: 6px; border: 1px solid #fca5a5; }
        </style>
    </head>
    <body>
        <div class="login-card">
            <h2>OpenSparrow</h2>
            <p>Admin Control Panel<br><br>Default password: <strong>admin</strong></p>
            <?php if (isset($login_error)) {
                echo "<div class='error'>" . htmlspecialchars($login_error, ENT_QUOTES) . "</div>";
            } ?>
            <form method="POST" action="index.php">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES); ?>">
                <input type="password" name="admin_password" placeholder="Enter password" required autofocus>
                <button type="submit">Login</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sparrow Admin | Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES); ?>">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="../assets/css/styles.css">
    <link rel="stylesheet" href="style.css?v=<?php echo @filemtime('style.css'); ?>">
</head>
<body>
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
                    <button class="admin-tab" data-file="security">Security</button>
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
            
            <button onclick="window.location.href='index.php?logout=1'" class="btn-logout" style="background: #ef4444; border-color: #ef4444;">Logout</button>
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
