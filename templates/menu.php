<?php
// templates/menu.php

// Load schema to get tables list dynamically
$schemaPath = __DIR__ . '/../includes/schema.json';
$tables = file_exists($schemaPath) ? (json_decode(file_get_contents($schemaPath), true)['tables'] ?? []) : [];

$currentPage  = basename($_SERVER['PHP_SELF']);
$currentTable = $_GET['table'] ?? '';
$isWorkflows  = isset($_GET['workflows']);

// Helper: try to load a JSON config from multiple candidate paths
function loadMenuConfig(string $baseName, string $includeDir): array {
    $candidates = [
        $includeDir . '/' . $baseName . '.json',
        $includeDir . '/' . $baseName . '_config.json',
        $includeDir . '/config/' . $baseName . '.json',
        dirname($includeDir) . '/config/' . $baseName . '.json',
    ];
    foreach ($candidates as $path) {
        if (file_exists($path)) {
            $decoded = json_decode(file_get_contents($path), true);
            if (is_array($decoded)) return $decoded;
        }
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

// Helper: render icon — supports image path or emoji/text
function renderMenuIcon(string $icon): string {
    if (str_contains($icon, '/') || str_contains($icon, '.')) {
        return '<img src="' . htmlspecialchars($icon, ENT_QUOTES, 'UTF-8') . '" alt="" />';
    }
    return '<span style="font-size:1.2em; margin-right:8px; vertical-align:middle;">'
         . htmlspecialchars($icon, ENT_QUOTES, 'UTF-8') . '</span>';
}
?>
<nav id="menu" class="menu collapsed">
    <ul style="margin: 0; padding: 1rem 0.5rem; list-style: none; display: flex; flex-direction: column; gap: 5px;">

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
                <span style="font-size:1.2em; margin-right:8px; vertical-align:middle;">⚡</span>
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
                    <span style="font-size:1.2em; margin-right:8px; vertical-align:middle;">🗄️</span>
                <?php endif; ?>
                <span class="menu-text"><?php echo htmlspecialchars($tConfig['display_name'] ?? $tName, ENT_QUOTES, 'UTF-8'); ?></span>
            </a>
        </li>
        <?php endforeach; ?>

    </ul>
</nav>
