<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$isReadOnly = ($_SESSION['role'] ?? 'full') === 'readonly';

// Block POST request for readonly users
if ($isReadOnly && $_SERVER['REQUEST_METHOD'] === 'POST') {
    http_response_code(403);
    die("Forbidden: Read-only access");
}

require __DIR__ . '/includes/db.php';
require __DIR__ . '/includes/api_helpers.php';
$conn = db_connect();

$table = $_GET['table'] ?? '';
$id = $_GET['id'] ?? '';

// Load schema
$schema = json_decode(file_get_contents(__DIR__ . '/includes/schema.json'), true);
if (!isset($schema['tables'][$table])) {
    die("Invalid table.");
}

$tableCfg = $schema['tables'][$table];
$schemaName = $tableCfg['schema'] ?? 'public';
$idCol = id_column();
$error = '';

// Helper for file sizes
function format_bytes_edit($bytes) {
    if (!$bytes) return '0 B';
    $units = ['B', 'KB', 'MB', 'GB'];
    $i = 0;
    $v = (int)$bytes;
    while ($v >= 1024 && $i < count($units) - 1) { 
        $v /= 1024; 
        $i++; 
    }
    return round($v, 1) . ' ' . $units[$i];
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrfToken = $_POST['csrf_token'] ?? '';
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        http_response_code(403);
        die('Invalid CSRF token.');
    }
    $updates = [];
    $params = [];
    $i = 1;

    foreach ($tableCfg['columns'] as $colName => $colCfg) {
        // Skip primary key and readonly fields during UPDATE
        if ($colName === $idCol || !empty($colCfg['readonly'])) {
            continue;
        }

        $type = strtolower($colCfg['type'] ?? '');

        if (str_contains($type, 'bool')) {
            $val = isset($_POST[$colName]) ? 'true' : 'false';
            $updates[] = pg_ident($colName) . " = $" . $i . "::boolean";
            $params[] = $val;
            $i++;
        } else {
            $val = $_POST[$colName] ?? '';
            if ($val === '') {
                $val = null;
            }

            $updates[] = pg_ident($colName) . " = $" . $i;
            $params[] = $val;
            $i++;
        }
    }

    $params[] = $id;
    $sql = sprintf(
        'UPDATE "%s"."%s" SET %s WHERE %s = $%d',
        $schemaName,
        $table,
        implode(', ', $updates),
        pg_ident($idCol),
        $i
    );

    $res = pg_query_params($conn, $sql, $params);
    if ($res) {
        // Log manual edit
        log_user_action($conn, $_SESSION['user_id'], 'UPDATE', $table, (int)$id);

        // Return to the grid of the edited record's source table. The table
        // name is already validated against schema above (line 25), and
        // app.js honours ?table=<name> when picking the initial table.
        header("Location: index.php?table=" . urlencode($table));
        exit;
    } else {
        error_log('[edit.php] ' . pg_last_error($conn));
        $error = 'Database error. Please try again.';
    }
}

// Fetch existing data — select only columns declared in schema plus the PK;
// avoids exposing columns that the schema deliberately omits.
$colsToFetch = array_unique(array_merge([$idCol], array_keys($tableCfg['columns'])));
$selectList  = implode(', ', array_map('pg_ident', $colsToFetch));
$sql = sprintf('SELECT %s FROM "%s"."%s" WHERE %s = $1', $selectList, $schemaName, $table, pg_ident($idCol));
$res = pg_query_params($conn, $sql, [$id]);
$row = pg_fetch_assoc($res);

if (!$row) {
    die("Record not found.");
}

// Fetch subtables data if defined
$subtablesData = [];
if (!empty($tableCfg['subtables']) && is_array($tableCfg['subtables'])) {
    foreach ($tableCfg['subtables'] as $sub) {
        $sTable = $sub['table'];
        $sFk = $sub['foreign_key'];
        $sCols = $sub['columns_to_show'] ?? ['id'];

        if (!isset($schema['tables'][$sTable])) {
            continue;
        }
        $sSchema = $schema['tables'][$sTable]['schema'] ?? 'public';
        $sTableCfg = $schema['tables'][$sTable];

        $selCols = array_merge(['id'], $sCols);
        $selColsSql = implode(', ', array_map('pg_ident', array_unique($selCols)));

        $sSql = sprintf(
            'SELECT %s FROM "%s"."%s" WHERE %s = $1 ORDER BY id DESC',
            $selColsSql,
            $sSchema,
            $sTable,
            pg_ident($sFk)
        );

        $sRes = pg_query_params($conn, $sSql, [$id]);
        $sRows = [];
        if ($sRes) {
            while ($sr = pg_fetch_assoc($sRes)) {
                $sRows[] = $sr;
            }
            pg_free_result($sRes);
        }

        // Map foreign keys for display
        $sRows = map_fk_display($schema, $sTableCfg, $sRows);

        $subtablesData[] = [
            'config' => $sub,
            'rows' => $sRows,
            'schema' => $sTableCfg
        ];
    }
}

// Fetch related files with tags
$relatedFiles = [];
$fileSql = "SELECT uuid, display_name, name, type, size_bytes, created_at, tags
            FROM " . sys_table('files') . "
            WHERE related_table = $1 AND related_id = $2 AND deleted_at IS NULL
            ORDER BY created_at DESC";
$fileRes = @pg_query_params($conn, $fileSql, [$table, $id]);
if ($fileRes) {
    while ($f = pg_fetch_assoc($fileRes)) {
        $relatedFiles[] = $f;
    }
}

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>OpenSparrow | Edit Record - <?php echo htmlspecialchars($tableCfg['display_name'] ?? $table); ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8'); ?>">
    <link href="/assets/css/styles.css" rel="stylesheet">
    <style>
        .tag-badge { background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #cbd5e1; margin-right: 4px; display: inline-block; }
    </style>
</head>
<body>

<?php include 'templates/header_app.php'; ?>
<main style="padding: 20px;">
    <h2>Edit record #<?php echo htmlspecialchars((string)$id); ?> in <?php echo htmlspecialchars($tableCfg['display_name'] ?? $table); ?></h2>

    <?php if ($error) : ?>
        <div style="color: red; margin-bottom: 15px; padding: 10px; border: 1px solid red; background: #fee;">
            Error: <?php echo htmlspecialchars($error); ?>
        </div>
    <?php endif; ?>

    <div class="tab-list" role="tablist">
        <button class="tab-btn active" data-tab="tab-details" role="tab" aria-selected="true">Details</button>
        <?php foreach ($subtablesData as $si => $sd) : ?>
            <?php $siLabel = $sd['config']['label'] ?? ($sd['schema']['display_name'] ?? $sd['config']['table']); ?>
            <button class="tab-btn" data-tab="tab-sub-<?php echo (int)$si; ?>" role="tab" aria-selected="false">
                <?php echo htmlspecialchars($siLabel); ?>
            </button>
        <?php endforeach; ?>
        <button class="tab-btn" data-tab="tab-files" role="tab" aria-selected="false">Files</button>
        <button class="tab-btn" data-tab="tab-comments" role="tab" aria-selected="false">Comments</button>
    </div>

    <div class="tab-panel active" id="tab-details" role="tabpanel">
    <div class="form-wrapper">
        <form method="POST" class="editor-form">
            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8'); ?>">
            <?php foreach ($tableCfg['columns'] as $colName => $colCfg) : ?>
                <?php
                if (isset($colCfg['show_in_edit']) && $colCfg['show_in_edit'] === false) {
                    continue;
                }

                $type = strtolower($colCfg['type'] ?? '');
                $val = $row[$colName] ?? '';

                // Apply read-only mode across all fields if user role is readonly
                $readOnlyAttr = (!empty($colCfg['readonly']) || $isReadOnly) ? 'readonly' : '';
                $disabledAttr = (!empty($colCfg['readonly']) || $isReadOnly) ? 'disabled' : '';
                $requiredAttr = (!empty($colCfg['not_null']) && empty($colCfg['readonly']) && !$isReadOnly) ? 'required' : '';
                ?>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">
                        <?php echo htmlspecialchars($colCfg['display_name'] ?? $colName); ?>
                        <?php if ($requiredAttr) {
                            echo '<span style="color:red;">*</span>';
                        } ?>
                    </label>

                    <?php if (isset($tableCfg['foreign_keys'][$colName])) : ?>
                        <?php
                        $fkCfg = $tableCfg['foreign_keys'][$colName];
                        $refTable = $fkCfg['reference_table'];
                        $refSchema = $schema['tables'][$refTable]['schema'] ?? 'public';
                        $refPk = $fkCfg['reference_column'] ?? 'id';
                        
                        // Handle array or string display columns safely
                        $refDisplayArr = is_array($fkCfg['display_column'] ?? null) ? $fkCfg['display_column'] : [$fkCfg['display_column'] ?? $refPk];
                        $refColsSql = implode(', ', array_map('pg_ident', $refDisplayArr));
                        $orderColSql = pg_ident($refDisplayArr[0]);

                        $refSql = sprintf('SELECT %s, %s FROM "%s"."%s" ORDER BY %s ASC', pg_ident($refPk), $refColsSql, $refSchema, $refTable, $orderColSql);
                        $refRes = pg_query($conn, $refSql);
                        ?>
                        <select name="<?php echo $colName; ?>" <?php echo $requiredAttr; ?> <?php echo $disabledAttr; ?> style="width: 100%; padding: 8px;">
                            <option value="">-- Select --</option>
                            <?php while ($refRow = pg_fetch_assoc($refRes)) : ?>
                                <?php 
                                $selected = ((string)$val === (string)$refRow[$refPk]) ? 'selected' : ''; 
                                
                                // Concatenate multiple columns for display if needed
                                $displayParts = [];
                                foreach ($refDisplayArr as $dc) {
                                    if (isset($refRow[$dc]) && $refRow[$dc] !== '') {
                                        $displayParts[] = $refRow[$dc];
                                    }
                                }
                                $displayString = implode(' - ', $displayParts) ?: $refRow[$refPk];
                                ?>
                                <option value="<?php echo htmlspecialchars((string)$refRow[$refPk]); ?>" <?php echo $selected; ?>>
                                    <?php echo htmlspecialchars($displayString); ?>
                                </option>
                            <?php endwhile; ?>
                        </select>
                        <?php if (!empty($colCfg['readonly']) || $isReadOnly) : ?>
                            <input type="hidden" name="<?php echo $colName; ?>" value="<?php echo htmlspecialchars((string)$val); ?>" />
                        <?php endif; ?>

                    <?php elseif ($type === 'enum' || str_starts_with($type, 'enum')) : ?>
                        <select name="<?php echo $colName; ?>" <?php echo $requiredAttr; ?> <?php echo $disabledAttr; ?> style="width: 100%; padding: 8px;">
                            <option value="">-- Select --</option>
                            <?php if (!empty($colCfg['options']) && is_array($colCfg['options'])) : ?>
                                <?php foreach ($colCfg['options'] as $opt) : ?>
                                    <?php $selected = ((string)$val === (string)$opt) ? 'selected' : ''; ?>
                                    <option value="<?php echo htmlspecialchars((string)$opt); ?>" <?php echo $selected; ?>>
                                        <?php echo htmlspecialchars((string)$opt); ?>
                                    </option>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </select>
                        <?php if (!empty($colCfg['readonly']) || $isReadOnly) : ?>
                            <input type="hidden" name="<?php echo $colName; ?>" value="<?php echo htmlspecialchars((string)$val); ?>" />
                        <?php endif; ?>

                    <?php elseif (str_contains($type, 'bool')) : ?>
                        <?php $checked = ($val === 't' || $val === 'true' || $val === true || $val === '1') ? 'checked' : ''; ?>
                        <input type="checkbox" name="<?php echo $colName; ?>" <?php echo $disabledAttr; ?> <?php echo $checked; ?> />
                        <?php if (!empty($colCfg['readonly']) || $isReadOnly) : ?>
                            <input type="hidden" name="<?php echo $colName; ?>" value="<?php echo htmlspecialchars((string)$val); ?>" />
                        <?php endif; ?>
                        
                    <?php elseif (str_contains($type, 'date')) : ?>
                        <input type="date" name="<?php echo $colName; ?>" value="<?php echo htmlspecialchars((string)$val); ?>" <?php echo $requiredAttr; ?> <?php echo $readOnlyAttr; ?> style="width: 100%; padding: 8px;" />
                        
                    <?php else : ?>
                        <?php
                        $patternAttr = !empty($colCfg['validation_regexp']) ? 'data-pattern="' . htmlspecialchars($colCfg['validation_regexp']) . '"' : '';
                        $titleAttr = !empty($colCfg['validation_message']) ? 'data-message="' . htmlspecialchars($colCfg['validation_message']) . '"' : '';
                        ?>
                        <input type="text" name="<?php echo $colName; ?>" value="<?php echo htmlspecialchars((string)$val); ?>" <?php echo $requiredAttr; ?> <?php echo $readOnlyAttr; ?> <?php echo $patternAttr; ?> <?php echo $titleAttr; ?> style="width: 100%; padding: 8px;" />
                        
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>

            <div class="form-actions" style="margin-top: 20px;">
                <?php if ($isReadOnly) : ?>
                    <button type="button" class="btn-save" style="background: #ccc; cursor: not-allowed;" disabled>Update Record</button>
                <?php else : ?>
                    <button type="submit" class="btn-save">Save Changes</button>
                <?php endif; ?>
                <button type="button" class="btn-cancel" onclick="window.location.href='index.php?table=<?php echo urlencode($table); ?>'">Cancel</button>
            </div>
        </form>
    </div>
    </div><!-- /tab-panel#tab-details -->

    <?php foreach ($subtablesData as $si => $sd) : ?>
    <?php
        $sTable = $sd['config']['table'];
        $sFk    = $sd['config']['foreign_key'];
        $sCols  = $sd['config']['columns_to_show'] ?? ['id'];
        $siLabel = $sd['config']['label'] ?? ($sd['schema']['display_name'] ?? $sTable);
    ?>
    <div class="tab-panel" id="tab-sub-<?php echo (int)$si; ?>" role="tabpanel">
        <div class="subtable-container" style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3><?php echo htmlspecialchars($siLabel); ?></h3>
                <?php if (!$isReadOnly) : ?>
                    <a href="create.php?table=<?php echo urlencode($sTable); ?>&<?php echo urlencode($sFk); ?>=<?php echo urlencode((string)$id); ?>" class="btn-add">
                        + Add <?php echo htmlspecialchars($siLabel); ?>
                    </a>
                <?php endif; ?>
            </div>

            <?php if (empty($sd['rows'])) : ?>
                <p style="color: var(--muted); font-size: 14px; margin-top: 10px;">No records found.</p>
            <?php else : ?>
                <div class="edit-subtable-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <?php foreach ($sCols as $c) : ?>
                                    <th><?php echo htmlspecialchars($sd['schema']['columns'][$c]['display_name'] ?? $c); ?></th>
                                <?php endforeach; ?>
                                <th style="width: 80px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($sd['rows'] as $r) : ?>
                                <tr>
                                    <?php foreach ($sCols as $c) : ?>
                                        <?php $displayVal = $r[$c . '__display'] ?? $r[$c] ?? ''; ?>
                                        <td><?php echo htmlspecialchars((string)$displayVal); ?></td>
                                    <?php endforeach; ?>
                                    <td class="subtable-actions">
                                        <?php if ($isReadOnly) : ?>
                                            <a href="edit.php?table=<?php echo urlencode($sTable); ?>&id=<?php echo urlencode($r['id']); ?>" class="btn-action" style="pointer-events: none; opacity: 0.5;">View</a>
                                        <?php else : ?>
                                            <a href="edit.php?table=<?php echo urlencode($sTable); ?>&id=<?php echo urlencode($r['id']); ?>" class="btn-action">Edit</a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div><!-- /tab-panel#tab-sub-<?php echo (int)$si; ?> -->
    <?php endforeach; ?>

    <div class="tab-panel" id="tab-files" role="tabpanel">
    <div class="subtable-container" style="margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="color: #0f172a; margin: 0;">Attached Files</h3>
        </div>

        <?php if (!$isReadOnly) : ?>
            <div style="background: #f8fafc; padding: 15px; border: 1px dashed #cbd5e1; border-radius: 6px; margin-bottom: 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <input type="file" id="inlineFileInput" style="padding: 6px; border: 1px solid #ccc; border-radius: 4px; background: #fff;" />
                <input type="text" id="inlineFileName" placeholder="Optional display name" style="padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; width: 180px;" />
                <input type="text" id="inlineFileTags" placeholder="Tags (comma separated)" style="padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; width: 180px;" list="tagSuggestions" />
                
                <datalist id="tagSuggestions">
                    <option value="Invoice">
                    <option value="Contract">
                    <option value="Image">
                    <option value="Report">
                </datalist>

                <button type="button" id="btnInlineUpload" class="btn-action" style="background: #0ea5e9; padding: 7px 16px; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-weight: bold;">Upload File</button>
                <span id="inlineUploadStatus" style="font-size: 13px; font-weight: 500; margin-left: 10px;"></span>
            </div>
        <?php endif; ?>

        <?php if (!empty($relatedFiles)) : ?>
            <div class="edit-subtable-wrapper">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e2e8f0; background: #f8fafc;">
                            <th style="padding: 10px;">Type</th>
                            <th style="padding: 10px;">Name</th>
                            <th style="padding: 10px;">Tags</th>
                            <th style="padding: 10px;">Size</th>
                            <th style="padding: 10px;">Date</th>
                            <th style="padding: 10px; width: 100px;">Actions</th>
                        </tr>
                    </thead>
                    <?php 
                    $fileIcons = [
                        'image'       => 'assets/icons/image.png',
                        'pdf'         => 'assets/icons/picture_as_pdf.png',
                        'doc'         => 'assets/icons/docs.png',
                        'spreadsheet' => 'assets/icons/grid_on.png',
                        'archive'     => 'assets/icons/folder_zip.png',
                        'other'       => 'assets/icons/file_present.png'
                    ];
                    ?>
                    <tbody>
                        <?php foreach ($relatedFiles as $rf) : ?>
                            <?php 
                            $iconPath = $fileIcons[$rf['type']] ?? $fileIcons['other']; 
                            
                            // Parse PostgreSQL array string to PHP array
                            $rawTags = $rf['tags'] ?? '';
                            $tagsArr = [];
                            if ($rawTags && $rawTags !== '{}') {
                                $rawTags = trim($rawTags, '{}');
                                $tagsArr = explode(',', str_replace('"', '', $rawTags));
                            }
                            ?>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 10px; font-weight: bold; color: #64748b; font-size: 12px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <img src="<?php echo htmlspecialchars($iconPath); ?>" alt="icon" style="width: 20px; height: 20px; opacity: 0.8;">
                                        <?php echo htmlspecialchars(strtoupper($rf['type'])); ?>
                                    </div>
                                </td>
                                <td style="padding: 10px; font-weight: 500;"><?php echo htmlspecialchars($rf['display_name'] ?: $rf['name']); ?></td>
                                <td style="padding: 10px;">
                                    <?php if (!empty($tagsArr)): ?>
                                        <?php foreach($tagsArr as $t): ?>
                                            <span class="tag-badge"><?php echo htmlspecialchars(trim($t)); ?></span>
                                        <?php endforeach; ?>
                                    <?php else: ?>
                                        <span style="color:#cbd5e1">-</span>
                                    <?php endif; ?>
                                </td>
                                <td style="padding: 10px; color: #64748b;"><?php echo format_bytes_edit($rf['size_bytes']); ?></td>
                                <td style="padding: 10px; color: #64748b;"><?php echo htmlspecialchars(date('Y-m-d', strtotime($rf['created_at']))); ?></td>
                                <td style="padding: 10px;">
                                    <a href="file_download.php?uuid=<?php echo urlencode($rf['uuid']); ?>" target="_blank" class="btn-action" style="background: #0ea5e9; padding: 4px 10px; border-radius: 4px; color: #fff; text-decoration: none; font-size: 12px; display: inline-block;">Download</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php else : ?>
            <p style="color: #64748b; font-size: 14px; margin-top: 10px;">No files attached to this record.</p>
        <?php endif; ?>
    </div>
    </div><!-- /tab-panel#tab-files -->

    <div class="tab-panel" id="tab-comments" role="tabpanel">
        <div id="c-panel"></div>
    </div><!-- /tab-panel#tab-comments -->

</main>
</div>

<?php include 'templates/footer.php'; ?>

<script src="assets/js/sidebar.js?v=<?php echo @filemtime('assets/js/sidebar.js'); ?>"></script>
<script src="assets/js/notifications.js?v=<?php echo @filemtime('assets/js/notifications.js'); ?>"></script>
<script type="module" src="assets/js/user-menu.js?v=<?php echo @filemtime('assets/js/user-menu.js'); ?>"></script>

<script>
    window.CSRF_TOKEN      = <?php echo json_encode($_SESSION['csrf_token'], JSON_THROW_ON_ERROR); ?>;
    window.EDIT_TABLE      = <?php echo json_encode($table, JSON_THROW_ON_ERROR); ?>;
    window.EDIT_ID         = <?php echo json_encode((int)$id, JSON_THROW_ON_ERROR); ?>;
    window.CURRENT_USER_ID = <?php echo json_encode((int)$_SESSION['user_id'], JSON_THROW_ON_ERROR); ?>;
    window.USER_ROLE       = <?php echo json_encode($_SESSION['role'] ?? 'full', JSON_THROW_ON_ERROR); ?>;
</script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabBtns   = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    function activateTab(tabId) {
        tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        tabPanels.forEach(p => p.classList.remove('active'));
        const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const panel = document.getElementById(tabId);
        if (btn)   { btn.classList.add('active');   btn.setAttribute('aria-selected', 'true'); }
        if (panel) { panel.classList.add('active'); }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });

    // Auto-activate tab from URL hash (e.g. #tab-comments)
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash)) {
        activateTab(hash);
    }

    // 1. RegExp Validation Logic
    const inputs = document.querySelectorAll('input[data-pattern]');
    inputs.forEach(input => {
        const validateInput = () => {
            if (!input.value) {
                input.setCustomValidity('');
                return;
            }
            try {
                const regex = new RegExp(input.dataset.pattern);
                if (!regex.test(input.value)) {
                    input.setCustomValidity(input.dataset.message || 'Invalid format');
                } else {
                    input.setCustomValidity('');
                }
            } catch (e) {
                console.error("Invalid RegExp provided in schema:", input.dataset.pattern, e);
            }
        };

        input.addEventListener('input', validateInput);
        validateInput(); // Trigger validation on load just in case
    });

    // 2. Inline File Upload Logic
    const btnUpload = document.getElementById('btnInlineUpload');
    if (btnUpload) {
        btnUpload.addEventListener('click', async () => {
            const fileInput = document.getElementById('inlineFileInput');
            const nameInput = document.getElementById('inlineFileName');
            const tagsInput = document.getElementById('inlineFileTags');
            const statusEl = document.getElementById('inlineUploadStatus');

            if (!fileInput.files || !fileInput.files.length) {
                statusEl.textContent = 'Please select a file to upload.';
                statusEl.style.color = 'red';
                return;
            }

            const formData = new FormData();
            formData.append('action', 'upload');
            formData.append('file', fileInput.files[0]);
            
            if (nameInput.value.trim()) {
                formData.append('display_name', nameInput.value.trim());
            }
            if (tagsInput && tagsInput.value.trim()) {
                formData.append('tags', tagsInput.value.trim());
            }
            
            // Automatically inject related_table and related_id from PHP
            formData.append('related_table', <?php echo json_encode($table); ?>);
            formData.append('related_id', <?php echo json_encode($id); ?>);

            statusEl.textContent = 'Uploading...';
            statusEl.style.color = '#334155';
            btnUpload.disabled = true;

            try {
                const res = await fetch('api_files.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await res.json();

                if (data.success) {
                    statusEl.textContent = 'Uploaded successfully! Refreshing...';
                    statusEl.style.color = '#10b981';
                    
                    // Reload to show the new file in the list
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    statusEl.textContent = 'Error: ' + (data.error || 'Upload failed');
                    statusEl.style.color = 'red';
                    btnUpload.disabled = false;
                }
            } catch (err) {
                statusEl.textContent = 'Network error during upload.';
                statusEl.style.color = 'red';
                btnUpload.disabled = false;
            }
        });
    }
});
</script>

<script type="module" src="assets/js/comments.js?v=<?php echo @filemtime('assets/js/comments.js'); ?>"></script>

</body>
</html>