<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
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

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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

        header("Location: index.php");
        exit;
    } else {
        $error = pg_last_error($conn);
    }
}

// Fetch existing data
$sql = sprintf('SELECT * FROM "%s"."%s" WHERE %s = $1', $schemaName, $table, pg_ident($idCol));
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
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>OpenSparrow | Edit Record - <?php echo htmlspecialchars($tableCfg['display_name'] ?? $table); ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="/assets/css/styles.css" rel="stylesheet">
</head>
<body>

<header>
    <a href="index.php" class="brand-logo">
        <img src="assets/img/logo-blue.png" alt="OpenSparrow Logo" />
    </a>
    <div class="header-user-menu">
        <button onclick="window.history.back()" class="btn-logout">Back</button>
    </div>
</header>

<main style="padding: 20px; max-width: 1000px; margin: 0 auto;">
    <h2>Edit record #<?php echo htmlspecialchars((string)$id); ?> in <?php echo htmlspecialchars($tableCfg['display_name'] ?? $table); ?></h2>

    <?php if ($error) : ?>
        <div style="color: red; margin-bottom: 15px; padding: 10px; border: 1px solid red; background: #fee;">
            Error: <?php echo htmlspecialchars($error); ?>
        </div>
    <?php endif; ?>

    <div class="form-wrapper">
        <form method="POST" class="editor-form">
            <?php foreach ($tableCfg['columns'] as $colName => $colCfg) : ?>
                <?php
                if (isset($colCfg['show_in_edit']) && $colCfg['show_in_edit'] === false) {
                    continue;
                }

                $type = strtolower($colCfg['type'] ?? '');
                $val = $row[$colName] ?? '';

                $readOnlyAttr = !empty($colCfg['readonly']) ? 'readonly' : '';
                $disabledAttr = !empty($colCfg['readonly']) ? 'disabled' : '';
                $requiredAttr = (!empty($colCfg['not_null']) && empty($colCfg['readonly'])) ? 'required' : '';
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
                        <?php if (!empty($colCfg['readonly'])) : ?>
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
                        <?php if (!empty($colCfg['readonly'])) : ?>
                            <input type="hidden" name="<?php echo $colName; ?>" value="<?php echo htmlspecialchars((string)$val); ?>" />
                        <?php endif; ?>

                    <?php elseif (str_contains($type, 'bool')) : ?>
                        <?php $checked = ($val === 't' || $val === 'true' || $val === true || $val === '1') ? 'checked' : ''; ?>
                        <input type="checkbox" name="<?php echo $colName; ?>" <?php echo $disabledAttr; ?> <?php echo $checked; ?> />
                        <?php if (!empty($colCfg['readonly'])) : ?>
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
                <button type="submit" class="btn-save">Save Changes</button>
                <button type="button" class="btn-cancel" onclick="window.history.back()">Cancel</button>
            </div>
        </form>
    </div>

<?php foreach ($subtablesData as $sd) : ?>
        <div class="subtable-container" style="margin-top: 40px;">
            <?php
                $sTable = $sd['config']['table'];
                $sFk = $sd['config']['foreign_key'];
                $sCols = $sd['config']['columns_to_show'] ?? ['id'];
                $sLabel = $sd['config']['label'] ?? ($sd['schema']['display_name'] ?? $sTable);
            ?>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3><?php echo htmlspecialchars($sLabel); ?></h3>
                <a href="create.php?table=<?php echo urlencode($sTable); ?>&<?php echo urlencode($sFk); ?>=<?php echo urlencode((string)$id); ?>" class="btn-add">
                    + Add <?php echo htmlspecialchars($sLabel); ?>
                </a>
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
                                        <a href="edit.php?table=<?php echo urlencode($sTable); ?>&id=<?php echo urlencode($r['id']); ?>" class="btn-action">Edit</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
<?php endforeach; ?>

</main>

<footer>
    <div class="footer-content">
        <small>
            <a href="https://opensparrow.org/">OpenSparrow.org</a> | Open source | LGPL v3. | PHP + vanilla JS + Postgres!
        </small>
    </div>
</footer>

<script>

document.addEventListener('DOMContentLoaded', function() {
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
});
</script>

</body>
</html>