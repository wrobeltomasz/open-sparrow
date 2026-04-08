<?php
session_start();

if (isset($_SESSION['user_id'])) {
    header("Location: dashboard.php");
    exit;
}

$error = '';

// Rate limiter configuration
$maxAttempts = 5;
$lockoutTime = 15 * 60;

// Check if the user is currently locked out
if (isset($_SESSION['login_attempts']) && $_SESSION['login_attempts'] >= $maxAttempts) {
    $timeSinceLastFail = time() - $_SESSION['last_failed_login'];

    if ($timeSinceLastFail < $lockoutTime) {
        $remainingMinutes = ceil(($lockoutTime - $timeSinceLastFail) / 60);
        $error = "Too many failed attempts. Please try again in {$remainingMinutes} minute(s).";
    } else {
        // Lockout expired so we reset counters
        $_SESSION['login_attempts'] = 0;
        unset($_SESSION['last_failed_login']);
    }
}

// Process login only if there is no rate limit error
if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($error)) {
    require __DIR__ . '/includes/db.php';
    require __DIR__ . '/includes/api_helpers.php';
    $conn = db_connect();

    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    // Fetch role from the database
    $sql = 'SELECT id, username, password_hash, role FROM "app"."users" WHERE username = $1';
    $res = pg_query_params($conn, $sql, [$username]);

    if (!$res) {
        $error = 'Technical error. Contact administrator.';
    } else {
        $user = pg_fetch_assoc($res);

        if ($user && password_verify($password, $user['password_hash'])) {
            // Successful login resets the attempts counter
            $_SESSION['login_attempts'] = 0;
            unset($_SESSION['last_failed_login']);

            // Regenerate session ID to prevent session fixation attacks
            session_regenerate_id(true);

            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            
            // Assign user role to session
            $_SESSION['role'] = $user['role'] ?? 'full';

            // Log login action
            log_user_action($conn, $user['id'], 'LOGIN');

            header("Location: dashboard.php");
            exit;
        } else {
            // Failed login increments the counter
            $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
            $_SESSION['last_failed_login'] = time();

            $attemptsLeft = $maxAttempts - $_SESSION['login_attempts'];

            if ($attemptsLeft > 0) {
                $error = "Invalid credentials. {$attemptsLeft} attempt(s) remaining.";
            } else {
                $error = "Too many failed attempts. Please try again in 15 minute(s).";
            }
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>OpenSparrow | Login</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="assets/css/styles.css" rel="stylesheet" /> 
    <style>
        body { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            background: var(--bg, #F1F1F1); 
            margin: 0;
            font-family: Inter, "Segoe UI", system-ui, sans-serif;
        }
        .login-box { 
            background: var(--panel, #ffffff); 
            padding: 2.5rem 2rem; 
            border-radius: var(--radius-lg, 10px); 
            box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,.10)); 
            width: 100%; 
            max-width: 360px; 
            box-sizing: border-box;
        }
        .login-box h2 { 
            margin-top: 0; 
            color: var(--accent-dark, #003366); 
            text-align: center; 
            margin-bottom: 1.5rem;
        }
        .login-box input { 
            width: 100%; 
            padding: 0.85rem; 
            margin-bottom: 1rem; 
            border: 1px solid var(--border, #AAB8C2); 
            border-radius: var(--radius, 6px); 
            font-size: 14px; 
            box-sizing: border-box;
            transition: border-color 150ms ease;
        }
        .login-box input:focus { 
            outline: none; 
            border-color: var(--accent, #007ACC); 
            box-shadow: 0 0 0 2px rgba(0,122,204,.15);
        }
        .login-box button { 
            width: 100%; 
            justify-content: center; 
            padding: 0.85rem; 
            background: var(--accent, #007ACC); 
            color: white; 
            border: none; 
            font-size: 15px; 
            font-weight: 500;
            border-radius: var(--radius, 6px);
            cursor: pointer; 
            transition: background 150ms ease; 
        }
        .login-box button:hover { 
            background: var(--accent-dark, #003366); 
        }
        .error { 
            color: var(--danger, #dc2626); 
            font-size: 13.5px; 
            text-align: center; 
            margin-bottom: 1rem; 
            background: #fef2f2;
            padding: 0.5rem;
            border-radius: 4px;
            border: 1px solid #fca5a5;
        }
    </style>
</head>
<body>
    <div class="login-box">
        <center><img src="assets/img/logo-brown.png" alt="Logo" class="footer-logo" height="48" /></center>
        <h2>OpenSparrow</h2>
        <?php if ($error) : ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        <form method="POST">
            <input type="text" name="username" placeholder="Login" required autofocus autocomplete="username" />

            <div class="password-container">
                <input type="password" id="password" name="password" placeholder="Password" required autocomplete="current-password" />
                <span id="togglePassword" class="toggle-password">
                    <svg width="20" height="20"
                    viewBox="0 0 24 24" fill="none"
                    stroke="#888" stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round">
                <path d="M1 12s4-8 11-8
            11 8 11 8-4 8-11
            8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
</span>
        </div>
            <button type="submit">Submit</button>
        </form>
    </div>
    <script>
    const passwordInput = document.getElementById(
        "password"
    );
    const togglePassword = document.getElementById(
        "togglePassword"
    );

    const eyeOpen = '<svg width="20" height="20" '
        + 'viewBox="0 0 24 24" fill="none" '
        + 'stroke="#888" stroke-width="2" '
        + 'stroke-linecap="round" '
        + 'stroke-linejoin="round">'
        + '<path d="M1 12s4-8 11-8 '
        + '11 8 11 8-4 8-11 8-11-8-11-8z"/>'
        + '<circle cx="12" cy="12" r="3"/>'
        + '</svg>';

    const eyeClosed = '<svg width="20" '
        + 'height="20" viewBox="0 0 24 24" '
        + 'fill="none" stroke="#888" '
        + 'stroke-width="2" '
        + 'stroke-linecap="round" '
        + 'stroke-linejoin="round">'
        + '<path d="M17.94 17.94A10.07 '
        + '10.07 0 0 1 12 20c-7 0-11-8-11-8'
        + 'a18.45 18.45 0 0 1 5.06-5.94"/>'
        + '<path d="M9.9 4.24A9.12 9.12 '
        + '0 0 1 12 4c7 0 11 8 11 8a18.5 '
        + '18.5 0 0 1-2.16 3.19"/>'
        + '<path d="M14.12 14.12a3 3 '
        + '0 1 1-4.24-4.24"/>'
        + '<line x1="1" y1="1" '
        + 'x2="23" y2="23"/></svg>';

    togglePassword.addEventListener(
        "click",
        function () {
            if (
                passwordInput.type === "password"
            ) {
                passwordInput.type = "text";
                togglePassword.innerHTML =
                    eyeClosed;
            } else {
                passwordInput.type = "password";
                togglePassword.innerHTML =
                    eyeOpen;
                }
            }
        );
    </script>
</body>
</html>