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

// Load schema
$schema = json_decode(file_get_contents(__DIR__ . '/includes/schema.json'), true);
if (!isset($schema['tables'][$table])) {
    die("Invalid table.");
}

$tableCfg = $schema['tables'][$table];
$schemaName = $tableCfg['schema'] ?? 'public';
$idCol = id_column();
$error = '';

// Handle POST request (INSERT)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $cols = [];
    $params = [];
    $ph = [];
    $i = 1;

    foreach ($tableCfg['columns'] as $colName => $colCfg) {
        // Skip primary key and readonly fields during create
        if ($colName === $idCol || !empty($colCfg['readonly'])) {
            continue;
        }

        $type = strtolower($colCfg['type'] ?? '');

        if (str_contains($type, 'bool')) {
            $val = isset($_POST[$colName]) ? 'true' : 'false';
            $cols[] = pg_ident($colName);
            $ph[] = "$" . $i . "::boolean";
            $params[] = $val;
            $i++;
        } else {
            $val = $_POST[$colName] ?? '';
            if ($val === '') {
                $val = null;
            }

            $cols[] = pg_ident($colName);
            $ph[] = "$" . $i;
            $params[] = $val;
            $i++;
        }
    }

    if (empty($cols)) {
        $sql = sprintf(
            'INSERT INTO "%s"."%s" DEFAULT VALUES RETURNING %s',
            $schemaName,
            $table,
            pg_ident($idCol)
        );
        $res = pg_query($conn, $sql);
    } else {
        $sql = sprintf(
            'INSERT INTO "%s"."%s" (%s) VALUES (%s) RETURNING %s',
            $schemaName,
            $table,
            implode(', ', $cols),
            implode(', ', $ph),
            pg_ident($idCol)
        );
        $res = pg_query_params($conn, $sql, $params);
    }

    if ($res) {
        $row = pg_fetch_assoc($res);
        $newId = $row[$idCol] ?? null;

        // Log manual insert
        if ($newId !== null) {
            log_user_action($conn, $_SESSION['user_id'], 'INSERT', $table, (int)$newId);
        }

        header("Location: index.php");
        exit;
    } else {
        $error = pg_last_error($conn);
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>OpenSparrow | Add Record - <?php echo htmlspecialchars($tableCfg['display_name'] ?? $table); ?></title>
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

<main style="padding: 20px; max-width: 800px; margin: 0 auto;">
    <h2>Add new record: <?php echo htmlspecialchars($tableCfg['display_name'] ?? $table); ?></h2>
    
    <?php if ($error) : ?>
        <div style="color: red; margin-bottom: 15px; padding: 10px; border: 1px solid red; background: #fee;">
            Error: <?php echo htmlspecialchars($error); ?>
        </div>
    <?php endif; ?>

    <div class="form-wrapper">
        <form method="POST" class="editor-form">
            <?php foreach ($tableCfg['columns'] as $colName => $colCfg) : ?>
                <?php
                // Skip primary key and readonly fields during create
                if ($colName === $idCol || !empty($colCfg['readonly'])) {
                    continue;
                }
                if (isset($colCfg['show_in_edit']) && $colCfg['show_in_edit'] === false) {
                    continue;
                }

                $type = strtolower($colCfg['type'] ?? '');
                $isPrefilled = isset($_GET[$colName]);
                $prefillVal = $_GET[$colName] ?? '';

                $requiredAttr = !empty($colCfg['not_null']) ? 'required' : '';
                $disabledAttr = $isPrefilled ? 'disabled' : '';
                $nameAttr = $isPrefilled ? '' : 'name="' . $colName . '"';
                ?>
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; font-weight: bold; margin-bottom: 5px;">
                        <?php echo htmlspecialchars($colCfg['display_name'] ?? $colName); ?>
                        <?php if ($requiredAttr) {
                            echo '<span style="color:red; margin-left:3px;">*</span>';
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
                        <select <?php echo $nameAttr; ?> <?php echo $requiredAttr; ?> <?php echo $disabledAttr; ?> style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="">-- Select --</option>
                            <?php if ($refRes) :
                                while ($refRow = pg_fetch_assoc($refRes)) : ?>
                                    <?php 
                                    $selected = ($prefillVal == $refRow[$refPk]) ? 'selected' : ''; 
                                    
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
                                <?php endwhile;
                            endif; ?>
                        </select>
                        
                    <?php elseif ($type === 'enum' || str_starts_with($type, 'enum')) : ?>
                        <select <?php echo $nameAttr; ?> <?php echo $requiredAttr; ?> <?php echo $disabledAttr; ?> style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                            <option value="">-- Select --</option>
                            <?php if (!empty($colCfg['options']) && is_array($colCfg['options'])) : ?>
                                <?php foreach ($colCfg['options'] as $opt) : ?>
                                    <?php $selected = ($prefillVal === (string)$opt) ? 'selected' : ''; ?>
                                    <option value="<?php echo htmlspecialchars((string)$opt); ?>" <?php echo $selected; ?>>
                                        <?php echo htmlspecialchars((string)$opt); ?>
                                    </option>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </select>

                    <?php elseif (str_contains($type, 'bool')) : ?>
                        <?php $checked = ($prefillVal === 'true' || $prefillVal === 't' || $prefillVal === '1' || $prefillVal === 'on') ? 'checked' : ''; ?>
                        <input type="checkbox" <?php echo $nameAttr; ?> <?php echo $disabledAttr; ?> <?php echo $checked; ?> style="transform: scale(1.2); margin-top: 5px;" />
                    
                    <?php elseif (str_contains($type, 'date')) : ?>
                        <input type="date" <?php echo $nameAttr; ?> value="<?php echo htmlspecialchars($prefillVal); ?>" <?php echo $requiredAttr; ?> <?php echo $disabledAttr; ?> style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
                    
                    <?php else : ?>
                        <?php
                        $patternAttr = !empty($colCfg['validation_regexp']) ? 'data-pattern="' . htmlspecialchars($colCfg['validation_regexp']) . '"' : '';
                        $titleAttr = !empty($colCfg['validation_message']) ? 'data-message="' . htmlspecialchars($colCfg['validation_message']) . '"' : '';
                        ?>
                        <input type="text" <?php echo $nameAttr; ?> value="<?php echo htmlspecialchars($prefillVal); ?>" <?php echo $requiredAttr; ?> <?php echo $disabledAttr; ?> <?php echo $patternAttr; ?> <?php echo $titleAttr; ?> style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" />
                    <?php endif; ?>

                    <?php if ($isPrefilled) : ?>
                        <input type="hidden" name="<?php echo $colName; ?>" value="<?php echo htmlspecialchars($prefillVal); ?>" />
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>

            <div class="form-actions" style="margin-top: 25px; display: flex; gap: 10px;">
                <button type="submit" class="btn-save" style="padding: 10px 20px; background: #007ACC; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 4px;">Add Record</button>
                <button type="button" class="btn-cancel" onclick="window.history.back()" style="padding: 10px 20px; background: #eee; color: #333; border: 1px solid #ccc; cursor: pointer; border-radius: 4px;">Cancel</button>
            </div>
        </form>
    </div>
</main>

<script>
// Parse RegExp using standard JS engine to avoid strict v flag issues
// Handles validation before form submission
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
        validateInput();
    });
});
</script>

</body>
</html>