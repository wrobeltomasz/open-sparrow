<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>OpenSparrow | Open source | PHP + vanilla JS + Postgres</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" />
    <link href="/assets/css/styles.css" rel="stylesheet" />
    <link href="/assets/css/mobile.css" rel="stylesheet" media="only screen and (max-width: 768px)" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>

<header>

    <button id="sidebarToggle" aria-label="Toggle sidebar">☰</button>

    <input id="globalSearch" type="text" placeholder="Find..." />

    <select id="columnFilter">
        <option value="">All columns</option>
    </select>

    <div id="filterBar" style="display: flex; gap: 10px;"></div>

    <button id="clearFilters" title="Clear all filters" style="display:none;">Clear Filters</button>

    <div class="header-user-menu">
        <div class="notifications-wrapper" aria-label="Notifications">
            <span><img class="notif-icon-img" title="User notifications" src="assets/img/notifications.png" alt="Notifications"></span>
            <span id="notif-badge" class="notif-badge">0</span>
            <div id="notif-dropdown" class="notif-dropdown">
                <div class="notif-dropdown-header">Notifications</div>
                <ul id="notif-list" class="notif-list"></ul>
            </div>
        </div>

        <?php if (($userRole ?? '') === 'full') : ?>
        <a href="/admin/index.php" class="header-admin-link" title="Admin panel">
            <img title="Admin panel" src="assets/img/settings.png" alt="Admin">
        </a>
        <?php endif; ?>
        
        <?php if (isset($_SESSION['username'])) : ?>
        <?php
            $avatarId  = $_SESSION['avatar_id'] ?? null;
            $uname     = $_SESSION['username'];
            $initial   = htmlspecialchars(strtoupper(substr($uname, 0, 1)), ENT_QUOTES, 'UTF-8');
            $unameEsc  = htmlspecialchars($uname, ENT_QUOTES, 'UTF-8');
        ?>
        <div class="user-avatar-wrap">
            <button class="user-avatar-btn" id="userAvatarBtn"
                    aria-label="User menu" aria-expanded="false" aria-haspopup="true">
                <?php if ($avatarId): ?>
                    <img class="avatar avatar-border"
                         src="assets/img/avatar-<?= (int)$avatarId ?>.png"
                         alt="Avatar <?= (int)$avatarId ?>" />
                <?php else: ?>
                    <svg class="avatar avatar-border avatar-initial" viewBox="0 0 32 32" aria-hidden="true">
                        <circle cx="16" cy="16" r="16" fill="#364B60"/>
                        <text x="16" y="21" text-anchor="middle" fill="#fff"
                              font-size="14" font-family="Inter,sans-serif" font-weight="600"><?= $initial ?></text>
                    </svg>
                <?php endif; ?>
                <span class="user-avatar-tooltip"><?= $unameEsc ?></span>
            </button>
            <div class="user-avatar-menu" id="userAvatarMenu" role="menu">
                <button class="user-avatar-menu-item" id="changeAvatarBtn" role="menuitem">Change avatar</button>
                <button class="user-avatar-menu-item" id="changePasswordBtn" role="menuitem">Change password</button>
                <div class="user-avatar-menu-divider"></div>
                <button class="user-avatar-menu-item danger" id="logoutBtn" role="menuitem">Logout</button>
            </div>
        </div>
        <?php endif; ?>
    </div>
</header>
<div class="app-container">
<?php include __DIR__ . '/menu.php'; ?>
<main>
    <section id="gridSection">
        <h2 id="gridTitle">Table</h2>

        <div id="grid"></div>

        <div id="actions" class="actions">
            <div class="left">
                <select id="mobileActions">
                    <option value="">Choose action…</option>
                    <?php if (($userRole ?? '') === 'full') : ?>
                    <option value="add">Add row</option>
                    <?php endif; ?>
                    <option value="export">Export CSV</option>
                    <option value="refresh">Refresh table</option>
                </select>

                <?php if (($userRole ?? '') === 'full') : ?>
                <button id="addRow" class="success">Add</button>
                <?php endif; ?>
                <button id="exportCsv">Export CSV</button>
            </div>

            <div id="pagination" class="pagination"></div>
        </div>
    </section>
</main>
</div>

<pre id="debug"></pre>

<?php include 'templates/footer.php'; ?>

<script nonce="<?php echo $cspNonce ?? ''; ?>">
    window.USER_ROLE = '<?php echo htmlspecialchars($userRole ?? 'readonly', ENT_QUOTES, 'UTF-8'); ?>';
    document.addEventListener("DOMContentLoaded", () => {
        const mobileActions = document.getElementById("mobileActions");
        if (mobileActions) {
            mobileActions.addEventListener("change", e => {
                const action = e.target.value;
                if (action === "add") { const b = document.getElementById("addRow"); if (b) b.click(); }
                if (action === "export") { const b = document.getElementById("exportCsv"); if (b) b.click(); }
                if (action === "refresh") location.reload();
                mobileActions.value = "";
            });
        }
    });
</script>
<script src="assets/js/sidebar.js?v=<?php echo @filemtime('assets/js/sidebar.js'); ?>"></script>
<script src="assets/js/notifications.js?v=<?php echo @filemtime('assets/js/notifications.js'); ?>"></script>
<script type="module" src="assets/js/app.js?v=<?php echo @filemtime('assets/js/app.js'); ?>"></script>
<script type="module" src="assets/js/user-menu.js?v=<?php echo @filemtime('assets/js/user-menu.js'); ?>"></script>

</body>
</html>