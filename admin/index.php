<?php
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
        } else {
            $admin_password_hash = $storedPass;
        }
    }
}

// Handle user logout
if (isset($_GET['logout'])) {
    unset($_SESSION['sparrow_admin_logged_in']);
    header("Location: index.php");
    exit;
}

// Handle login attempt using secure hash verification and CSRF protection
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_password'])) {
    $csrfToken = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        $login_error = "Invalid request (CSRF check failed).";
    } elseif (password_verify($_POST['admin_password'], $admin_password_hash)) {
        session_regenerate_id(true); // Prevent session fixation vulnerabilities
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
        <style>
            body { margin: 0; padding: 0; font-family: sans-serif; background: #e2e8f0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            .login-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 320px; text-align: center; }
            .login-card h2 { margin-top: 0; color: #334155; }
            .login-card input { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; outline: none; }
            .login-card input:focus { border-color: #3b82f6; }
            .login-card button { width: 100%; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
            .login-card button:hover { background: #2563eb; }
            .error { color: #ef4444; font-size: 14px; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="login-card">
            <h2>OpenSparrow Admin</h2>
            <p style="font-size:13px; color:#777; margin-bottom:15px;">Default password: <strong>admin</strong></p>
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
    <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES); ?>">
    <link rel="stylesheet" href="../assets/css/styles.css">
    <link rel="stylesheet" href="style.css?v=<?php echo @filemtime('style.css'); ?>">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    
    <style>
        /* Shared styles for Header Dropdowns (System & Configuration) */
        .config-dropdown { position: relative; display: inline-block; margin-right: 15px; padding-right: 15px; border-right: 1px solid rgba(255,255,255,0.2); }
        .config-dropdown-content { display: none; position: absolute; right: 15px; top: 100%; margin-top: 5px; background-color: #ffffff; min-width: 180px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 4px; z-index: 100; overflow: hidden; border: 1px solid #e2e8f0; }
        .config-dropdown-content button { width: 100%; text-align: left; padding: 10px 15px; border: none; background: transparent; color: #334155; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.2s; font-weight: normal; }
        .config-dropdown-content button:hover { background-color: #f8fafc; color: #3b82f6; }
        .config-dropdown-content button:last-child { border-bottom: none; }
        .config-dropdown.active .config-dropdown-content { display: block; }
    </style>
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
            <label style="color: white; margin-right: 15px; font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer; opacity: 0.8;">
                <input type="checkbox" id="debugToggle" style="cursor: pointer; accent-color: var(--accent);">
                Debug FE mode
            </label>
            
            <div class="config-dropdown" id="systemDropdownContainer">
                <button type="button" class="btn-logout" style="background: #64748b; color: white; border-color: #64748b; font-weight: bold;" onclick="document.getElementById('systemDropdownContainer').classList.toggle('active')">System &#9662;</button>
                <div class="config-dropdown-content">
                    <button class="admin-tab" data-file="database">Database</button>
                    <button class="admin-tab" data-file="security">Security</button>
                    <button class="admin-tab" data-file="users">Users</button>
                    <button class="admin-tab" data-file="health">System Health</button>
                </div>
            </div>
            <button id="btnSave" type="button">Save config</button>
            <div class="config-dropdown" id="configDropdownContainer">
                <button type="button" class="btn-logout" style="background: var(--accent); color: white; border-color: var(--accent); font-weight: bold;" onclick="document.getElementById('configDropdownContainer').classList.toggle('active')">Configuration</button>
                <div class="config-dropdown-content">
                    <button id="btnExport" type="button">Export config files</button>
                    <button id="btnImport" type="button">Import config files</button>
                </div>
                <input type="file" id="importFileInput" accept=".zip" style="display: none;">
            </div>

            <button class="admin-tab" data-file="docs" title="Admin panel documentation" style="background: transparent; border: none; cursor: pointer; padding: 0; margin-right: 15px; display: flex; align-items: center;" onmouseover="this.querySelector('img').style.opacity='1'" onmouseout="this.querySelector('img').style.opacity='0.8'">
                <img src="../assets/icons/book_3s.png" alt="Docs" style="width: 24px; height: 24px; opacity: 0.8; pointer-events: none;">
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
            <h2>Select an item to edit</h2>
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