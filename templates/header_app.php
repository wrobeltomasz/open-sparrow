<?php
// templates/header_app.php — shared header + sidebar for all app pages
$userRole  = $_SESSION['role']      ?? 'readonly';
$avatarId  = $_SESSION['avatar_id'] ?? null;
$uname     = $_SESSION['username']  ?? '';
$initial   = htmlspecialchars(strtoupper(substr($uname, 0, 1)), ENT_QUOTES, 'UTF-8');
$unameEsc  = htmlspecialchars($uname, ENT_QUOTES, 'UTF-8');
$nonceAttr = isset($cspNonce)
    ? ' nonce="' . htmlspecialchars($cspNonce, ENT_QUOTES, 'UTF-8') . '"'
    : '';
?>
<header>
    <button id="sidebarToggle" aria-label="Toggle sidebar">☰</button>

    <div class="header-user-menu">
        <div class="notifications-wrapper" aria-label="Notifications">
            <span><img class="notif-icon-img" title="User notifications" src="assets/img/notifications.png" alt="Notifications"></span>
            <span id="notif-badge" class="notif-badge">0</span>
            <div id="notif-dropdown" class="notif-dropdown">
                <div class="notif-dropdown-header">Notifications</div>
                <ul id="notif-list" class="notif-list"></ul>
            </div>
        </div>

        <?php if ($userRole === 'full') : ?>
        <a href="/admin/index.php" class="header-admin-link" title="Admin panel">
            <img title="Admin panel" src="assets/img/settings.png" alt="Admin">
        </a>
        <?php endif; ?>

        <?php if ($uname !== '') : ?>
        <div class="user-avatar-wrap">
            <button class="user-avatar-btn" id="userAvatarBtn"
                    aria-label="User menu" aria-expanded="false" aria-haspopup="true">
                <?php if ($avatarId) : ?>
                    <img class="avatar avatar-border"
                         src="assets/img/avatar-<?= (int)$avatarId ?>.png"
                         alt="Avatar <?= (int)$avatarId ?>" />
                <?php else : ?>
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
