<?php
// templates/menu.php

// Safe JSON reader with file size limit to prevent memory exhaustion
function safeReadJson(string $path, int $maxBytes = 524288): ?array {
    if (!file_exists($path) || filesize($path) > $maxBytes) return null;
    $content = file_get_contents($path, false, null, 0, $maxBytes);
    if ($content === false) return null;
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : null;
}

// Load schema to get tables list dynamically
$schemaPath = __DIR__ . '/../includes/schema.json';
$tables = safeReadJson($schemaPath)['tables'] ?? [];

$currentPage  = basename($_SERVER['PHP_SELF']);
// Limit length to prevent unexpectedly large values from reaching comparison logic
$currentTable = substr($_GET['table'] ?? '', 0, 64);
$isWorkflows  = isset($_GET['workflows']);

// Helper: try to load a JSON config from multiple candidate paths.
// $baseName is validated against a strict whitelist to prevent path traversal.
function loadMenuConfig(string $baseName, string $includeDir): array {
    // Allow only alphanumeric names to prevent path traversal
    if (!preg_match('/^[a-zA-Z0-9_-]{1,64}$/', $baseName)) {
        return [];
    }
    $realBase = realpath($includeDir);
    if ($realBase === false) return [];

    $candidates = [
        $includeDir . '/' . $baseName . '.json',
        $includeDir . '/' . $baseName . '_config.json',
        $includeDir . '/config/' . $baseName . '.json',
        dirname($includeDir) . '/config/' . $baseName . '.json',
    ];
    foreach ($candidates as $path) {
        // Ensure resolved path stays within the includes directory
        $realPath = realpath($path);
        if ($realPath === false || !str_starts_with($realPath, $realBase)) {
            continue;
        }
        $decoded = safeReadJson($realPath);
        if ($decoded !== null) return $decoded;
    }
    return [];
}

$includeDir = __DIR__ . '/../includes';

$dashCfg  = loadMenuConfig('dashboard', $includeDir);
$calCfg   = loadMenuConfig('calendar',  $includeDir);
$filesCfg = loadMenuConfig('files',     $includeDir);

$dashName  = $dashCfg['menu_name']  ?? 'Dashboard';
$dashIcon  = $dashCfg['menu_icon']  ?? 'assets/icons/dashboard.png';
$calName   = $calCfg['menu_name']   ?? 'Calendar';
$calIcon   = $calCfg['menu_icon']   ?? 'assets/icons/calendar.png';
$filesName = $filesCfg['menu_name'] ?? 'Files';
$filesIcon = $filesCfg['menu_icon'] ?? 'assets/icons/folder_open.png';

// Helper: render icon — supports relative/https image path or emoji/text.
// Validates image URIs against a strict whitelist to block javascript: and data: payloads.
function renderMenuIcon(string $icon): string {
    if (str_contains($icon, '/') || str_contains($icon, '.')) {
        // Accept only relative asset paths or absolute https URLs
        if (!preg_match('#^(https://[^\s<>"\']+|assets/[^\s<>"\']*)$#i', $icon)) {
            return '';
        }
        return '<img src="' . htmlspecialchars($icon, ENT_QUOTES, 'UTF-8') . '" alt="" />';
    }
    return '<span class="menu-icon-span">'
         . htmlspecialchars($icon, ENT_QUOTES, 'UTF-8') . '</span>';
}
?>
<nav id="menu" class="menu collapsed">
    <ul class="menu-list">

        <li>
            <a href="dashboard.php" class="custom-nav-link <?php echo $currentPage === 'dashboard.php' ? 'active' : ''; ?>">
                <?php echo renderMenuIcon($dashIcon); ?>
                <span class="menu-text"><?php echo htmlspecialchars($dashName, ENT_QUOTES, 'UTF-8'); ?></span>
            </a>
        </li>

        <li>
            <a href="calendar.php" class="custom-nav-link <?php echo $currentPage === 'calendar.php' ? 'active' : ''; ?>">
                <?php echo renderMenuIcon($calIcon); ?>
                <span class="menu-text"><?php echo htmlspecialchars($calName, ENT_QUOTES, 'UTF-8'); ?></span>
            </a>
        </li>

        <li>
            <a href="files.php" class="custom-nav-link <?php echo $currentPage === 'files.php' ? 'active' : ''; ?>">
                <?php echo renderMenuIcon($filesIcon); ?>
                <span class="menu-text"><?php echo htmlspecialchars($filesName, ENT_QUOTES, 'UTF-8'); ?></span>
            </a>
        </li>

        <li>
            <a href="index.php?workflows=1" class="custom-nav-link <?php echo $isWorkflows ? 'active' : ''; ?>">
                <span class="menu-icon-span">⚡</span>
                <span class="menu-text">Workflows</span>
            </a>
        </li>

        <?php foreach ($tables as $tName => $tConfig):
            $isActive = '';
            if ($currentPage === 'index.php' && !$isWorkflows) {
                if ($currentTable === $tName) {
                    $isActive = 'active';
                } elseif (empty($currentTable) && $tName === array_key_first($tables)) {
                    $isActive = 'active';
                }
            }
        ?>
        <li>
            <a href="index.php?table=<?php echo urlencode($tName); ?>"
               class="custom-nav-link <?php echo $isActive; ?>"
               data-table="<?php echo htmlspecialchars($tName, ENT_QUOTES, 'UTF-8'); ?>">
                <?php if (!empty($tConfig['icon'])): ?>
                    <?php echo renderMenuIcon($tConfig['icon']); ?>
                <?php else: ?>
                    <span class="menu-icon-span">🗄️</span>
                <?php endif; ?>
                <span class="menu-text"><?php echo htmlspecialchars($tConfig['display_name'] ?? $tName, ENT_QUOTES, 'UTF-8'); ?></span>
            </a>
        </li>
        <?php endforeach; ?>

    </ul>
</nav>
