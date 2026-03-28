<?php

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Load schema
$schemaPath = __DIR__ . '/includes/schema.json';
$schemaJson = file_get_contents($schemaPath);
if ($schemaJson === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Cannot read schema.json']);
    exit;
}
$schema = json_decode($schemaJson, true, 512, JSON_THROW_ON_ERROR);

// Connect to DB and load helpers
require __DIR__ . '/includes/db.php';
$conn = db_connect();
require __DIR__ . '/includes/api_helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
header('Content-Type: application/json; charset=utf-8');

try {
    // GET: SCHEMA DATA (Added to prevent 403 Forbidden for frontend)
    if ($method === 'GET' && ($_GET['api'] ?? '') === 'schema') {
        echo $schemaJson;
        exit;
    }

    // GET: WORKFLOWS DATA
    if ($method === 'GET' && ($_GET['api'] ?? '') === 'workflows') {
        $wfPath = __DIR__ . '/includes/workflows.json';
        if (!file_exists($wfPath)) {
            echo json_encode(['menu_name' => 'Workflows', 'workflows' => []]);
            exit;
        }

        $wfJson = file_get_contents($wfPath);
        $workflows = json_decode($wfJson, true, 512, JSON_THROW_ON_ERROR);

        echo json_encode($workflows);
        exit;
    }

    // GET: DASHBOARD DATA
    if ($method === 'GET' && ($_GET['api'] ?? '') === 'dashboard') {
        $dashPath = __DIR__ . '/includes/dashboard.json';
        if (!file_exists($dashPath)) {
            echo json_encode(['layout' => [], 'widgets' => []]);
            exit;
        }

        $dashJson = file_get_contents($dashPath);
        $dashboard = json_decode($dashJson, true, 512, JSON_THROW_ON_ERROR);

        // Include menu config so frontend can build the sidebar
        $response = [
            'menu_name' => $dashboard['menu_name'] ?? 'Dashboard',
            'menu_icon' => $dashboard['menu_icon'] ?? '',
            'layout' => $dashboard['layout'] ?? [],
            'widgets' => []
        ];

        foreach ($dashboard['widgets'] ?? [] as $widget) {
            $table = $widget['table'] ?? '';
            if (!$table) {
                continue;
            }

            try {
                $tableCfg = safe_table($schema, $table);
            } catch (Throwable $e) {
                continue;
            }

            $schemaName = $tableCfg['schema'] ?? 'public';
            $qType = $widget['query']['type'] ?? 'list';
            $data = null;

            if ($qType === 'count') {
                $col = $widget['query']['column'] ?? id_column();
                if (isset($tableCfg['columns'][$col]) || $col === id_column()) {
                    $sql = sprintf(
                        'SELECT COUNT(%s) AS count FROM "%s"."%s"',
                        pg_ident($col),
                        $schemaName,
                        $table
                    );
                    $res = pg_query($conn, $sql);
                    if ($res) {
                        $row = pg_fetch_assoc($res);
                        $data = (int)($row['count'] ?? 0);
                        pg_free_result($res);
                    }
                }
            } elseif ($qType === 'group_by') {
                $grpCol = $widget['query']['group_column'] ?? '';
                $aggCol = $widget['query']['agg_column'] ?? id_column();
                $aggType = strtoupper($widget['query']['agg_type'] ?? 'COUNT');
                $allowedAgg = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'];
                $aggType = in_array($aggType, $allowedAgg, true) ? $aggType : 'COUNT';

                if (isset($tableCfg['columns'][$grpCol])) {
                    $sql = sprintf(
                        'SELECT %s AS label, %s(%s) AS value FROM "%s"."%s" GROUP BY %s ORDER BY value DESC',
                        pg_ident($grpCol),
                        $aggType,
                        pg_ident($aggCol),
                        $schemaName,
                        $table,
                        pg_ident($grpCol)
                    );
                    $res = pg_query($conn, $sql);
                    if ($res) {
                        $data = [];
                        while ($r = pg_fetch_assoc($res)) {
                            $r['value'] = is_numeric($r['value']) ? (float)$r['value'] : $r['value'];
                            $data[] = $r;
                        }
                        pg_free_result($res);
                    }
                }
            } else {
                $limit = (int)($widget['query']['limit'] ?? 5);
                $orderBy = $widget['query']['order_by'] ?? id_column();
                $dir = strtoupper($widget['query']['dir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
                $displayCols = $widget['display_columns'] ?? [id_column()];
                $validCols = array_filter($displayCols, fn($c) => isset($tableCfg['columns'][$c]) || $c === id_column());
                if (empty($validCols)) {
                    $validCols = [id_column()];
                }

                $selectSql = implode(', ', array_map('pg_ident', $validCols));

                if (isset($tableCfg['columns'][$orderBy]) || $orderBy === id_column()) {
                    $sql = sprintf(
                        'SELECT %s FROM "%s"."%s" ORDER BY %s %s LIMIT %d',
                        $selectSql,
                        $schemaName,
                        $table,
                        pg_ident($orderBy),
                        $dir,
                        $limit
                    );
                    $res = pg_query($conn, $sql);
                    if ($res) {
                        $data = [];
                        while ($r = pg_fetch_assoc($res)) {
                            $data[] = $r;
                        }
                        pg_free_result($res);
                    }
                }
            }

            $widget['data'] = $data;
            $response['widgets'][] = $widget;
        }

        echo json_encode($response);
        exit;
    }

    // GET: CALENDAR DATA
    if ($method === 'GET' && ($_GET['api'] ?? '') === 'calendar') {
        $calPath = __DIR__ . '/includes/calendar.json';
        if (!file_exists($calPath)) {
            echo json_encode(['events' => []]);
            exit;
        }

        $calJson = file_get_contents($calPath);
        $calendar = json_decode($calJson, true, 512, JSON_THROW_ON_ERROR);
        $events = [];

        foreach ($calendar['sources'] ?? [] as $src) {
            $table = $src['table'] ?? '';
            if (!$table) {
                continue;
            }

            try {
                $tableCfg = safe_table($schema, $table);
            } catch (Throwable $e) {
                continue;
            }

            $schemaName = $tableCfg['schema'] ?? 'public';
            $idCol = id_column();
            $titleCol = $src['title_column'] ?? $idCol;
            $dateCol = $src['date_column'] ?? '';
            $color = $src['color'] ?? '#3b82f6';

            if (isset($tableCfg['columns'][$dateCol])) {
                // Fetch all columns just like in the grid
                $cols = column_list($tableCfg);
                $selectCols = array_values(array_unique(array_merge([$idCol], $cols)));
                $selectSql = implode(', ', array_map(fn($c) => pg_ident($c), $selectCols));

                $sql = sprintf(
                    'SELECT %s FROM "%s"."%s" WHERE %s IS NOT NULL',
                    $selectSql,
                    $schemaName,
                    $table,
                    pg_ident($dateCol)
                );
                $res = pg_query($conn, $sql);

                if ($res) {
                    $rows = [];
                    while ($r = pg_fetch_assoc($res)) {
                        $rows[] = $r;
                    }
                    pg_free_result($res);
                    // Resolve foreign keys (FK -> Display Name)
                    $rows = map_fk_display($schema, $tableCfg, $rows);
                    foreach ($rows as $r) {
                        $events[] = [
                            'id' => $r[$idCol],
                            'table' => $table,
                            'title' => $r[$titleCol] ?? 'No title',
                            'date' => substr($r[$dateCol], 0, 10),
                            'color' => $color,
                            'icon' => $src['icon'] ?? null,
                            'rowData' => $r // Pass the ENTIRE row to JavaScript
                        ];
                    }
                }
            }
        }

        // Include menu config so frontend can build the sidebar
        echo json_encode([
            'menu_name' => $calendar['menu_name'] ?? 'Calendar',
            'menu_icon' => $calendar['menu_icon'] ?? '',
            'events' => $events
        ]);
        exit;
    }

    // GET: LIST TABLE ROWS
    if ($method === 'GET' && ($_GET['api'] ?? '') === 'list') {
        $table = $_GET['table'] ?? '';
        $tableCfg = safe_table($schema, $table);
        $idCol = id_column();
        $schemaName = $tableCfg['schema'] ?? 'public';
        $cols = column_list($tableCfg);
        $selectCols = array_values(array_unique(array_merge([$idCol], $cols)));
        $selectSql = implode(', ', array_map(fn($c) => pg_ident($c), $selectCols));

        // Dynamic filtering support (for drill-down)
        $filterCol = $_GET['filter_col'] ?? '';
        $filterVal = $_GET['filter_val'] ?? '';
        $whereSql = '';
        $params = [];

        if ($filterCol !== '' && $filterVal !== '') {
            $whereSql = sprintf(' WHERE %s = $1', pg_ident($filterCol));
            $params[] = $filterVal;
        }

        $sql = sprintf(
            'SELECT %s FROM "%s"."%s"%s ORDER BY %s DESC',
            $selectSql,
            $schemaName,
            $table,
            $whereSql,
            pg_ident($idCol)
        );

        if (empty($params)) {
            $res = pg_query($conn, $sql);
        } else {
            $res = pg_query_params($conn, $sql, $params);
        }

        if (!$res) {
            http_response_code(500);
            echo json_encode(['error' => pg_last_error($conn)]);
            exit;
        }

        $rows = [];
        while ($r = pg_fetch_assoc($res)) {
            $rows[] = $r;
        }
        pg_free_result($res);
        $rows = map_fk_display($schema, $tableCfg, $rows);

        echo json_encode([
            'columns' => $selectCols,
            'rows' => $rows,
            'table' => [
                'name' => $table,
                'display_name' => to_display_name($tableCfg)
            ]
        ]);
        exit;
    }

    // POST / PATCH / DELETE
    if (in_array($method, ['POST','PATCH','DELETE'], true)) {
        $body = json_decode(file_get_contents('php://input') ?: '[]', true);
        $table = $body['table'] ?? '';
        $tableCfg = safe_table($schema, $table);
        $schemaName = $tableCfg['schema'] ?? 'public';
        $idCol = id_column();

        // PATCH: UPDATE SINGLE CELL
        if ($method === 'PATCH' && isset($body['id'], $body['column'], $body['value'])) {
            $col = $body['column'];
            if (!isset($tableCfg['columns'][$col])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid column specified']);
                exit;
            }

            if ($col === $idCol) {
                http_response_code(400);
                echo json_encode(['error' => 'Cannot edit PK']);
                exit;
            }

            $colType = strtolower($tableCfg['columns'][$col]['type'] ?? '');
            $cast = '';
            $val = $body['value'];

            if (str_contains($colType, 'bool')) {
                $val = normalize_boolean($val);
                $cast = '::boolean';
            } elseif ($val === '') {
                $val = null;
            }

            $sql = sprintf(
                'UPDATE "%s"."%s" SET %s = $1%s WHERE %s = $2',
                $schemaName,
                $table,
                pg_ident($col),
                $cast,
                pg_ident($idCol)
            );

            $res = pg_query_params($conn, $sql, [$val, $body['id']]);
            if (!$res) {
                http_response_code(422);
                echo json_encode(['error' => pg_last_error($conn)]);
                exit;
            }

            // Log inline update
            log_user_action($conn, (int)$_SESSION['user_id'], 'UPDATE', $table, (int)$body['id']);
            echo json_encode(['ok' => true]);
            exit;
        }

        // POST: INSERT NEW ROW
        if ($method === 'POST' && isset($body['data'])) {
            $cols = [];
            $vals = [];
            $ph   = [];
            $i    = 1;

            foreach ($tableCfg['columns'] as $colName => $colCfg) {
                if ($colName === $idCol) {
                    continue;
                }

                $type = strtolower($colCfg['type'] ?? '');
                $val = $body['data'][$colName] ?? null;

                if (str_contains($type, 'bool')) {
                    $val = normalize_boolean($val);
                } elseif ($val === '') {
                    $val = null;
                }

                $isNotNull = !empty($colCfg['not_null']);
                if ($val === null && $isNotNull) {
                    $val = type_min_value($type);
                }

                if ($val !== null) {
                    $cols[] = $colName;
                    $vals[] = $val;
                    $ph[]   = str_contains($type, 'bool') ? '$' . $i . '::boolean' : '$' . $i;
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
                    implode(', ', array_map('pg_ident', $cols)),
                    implode(', ', $ph),
                    pg_ident($idCol)
                );
                $res = pg_query_params($conn, $sql, $vals);
            }

            if (!$res) {
                http_response_code(422);
                echo json_encode(['error' => pg_last_error($conn)]);
                exit;
            }

            $row = pg_fetch_assoc($res);
            pg_free_result($res);
            $newId = $row[$idCol] ?? null;

            // Log insert
            if ($newId !== null) {
                log_user_action($conn, (int)$_SESSION['user_id'], 'INSERT', $table, (int)$newId);
            }

            echo json_encode(['ok' => true, 'id' => $newId]);
            exit;
        }

        // DELETE: REMOVE ROW
        if ($method === 'DELETE' && isset($body['id'])) {
            $sql = sprintf(
                'DELETE FROM "%s"."%s" WHERE %s=$1',
                $schemaName,
                $table,
                pg_ident($idCol)
            );

            $res = pg_query_params($conn, $sql, [$body['id']]);
            if (!$res) {
                http_response_code(422);
                echo json_encode(['error' => pg_last_error($conn)]);
                exit;
            }

            // Log delete
            log_user_action($conn, (int)$_SESSION['user_id'], 'DELETE', $table, (int)$body['id']);
            echo json_encode(['ok' => true]);
            exit;
        }
    }

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}