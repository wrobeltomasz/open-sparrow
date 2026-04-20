<?php
// Disable HTML error output to prevent corrupting JSON payload
ini_set('display_errors', 0);

// Safely start session only if not already active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Deny access if unauthorized
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Ensure response is JSON and prevent caching
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');

// Restrict to GET method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

// Enforce AJAX request
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    http_response_code(403);
    exit;
}

$userRole = $_SESSION['role'] ?? 'readonly';
$schemaPath = __DIR__ . '/includes/schema.json';

if (!file_exists($schemaPath)) {
    http_response_code(500);
    exit;
}

// Read and validate schema JSON strictly
$raw = file_get_contents($schemaPath);
if ($raw === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Cannot read schema file']);
    exit;
}

$schemaData = json_decode($raw, true);
if (!is_array($schemaData) || !isset($schemaData['tables'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid schema format']);
    exit;
}

$publicSchema = [];

foreach ($schemaData['tables'] as $tableName => $tableConfig) {
    // Skip hidden tables completely
    if (!empty($tableConfig['hidden'])) continue;

    $publicColumns = [];
    foreach ($tableConfig['columns'] as $colName => $colDef) {
        // Build minimal column object
        $pub = [
            'display_name'  => $colDef['display_name'] ?? $colName,
            'type'          => $colDef['type'] ?? 'text',
            'show_in_grid'  => $colDef['show_in_grid'] ?? true,
            'show_in_edit'  => $colDef['show_in_edit'] ?? true,
            'readonly'      => $colDef['readonly'] ?? false,
            'not_null'      => $colDef['not_null'] ?? false,
        ];

        // Send validation rules only to users with full access
        if ($userRole === 'full') {
            if (!empty($colDef['validation_regexp'])) {
                $pub['validation_regexp'] = $colDef['validation_regexp'];
            }
            if (!empty($colDef['validation_message'])) {
                $pub['validation_message'] = $colDef['validation_message'];
            }
        }

        if (!empty($colDef['description'])) {
            $pub['description'] = $colDef['description'];
        }

        // Keep dropdown options for UI
        if (!empty($colDef['options'])) {
            $pub['options'] = $colDef['options'];
        }
        if (!empty($colDef['enum_colors'])) {
            $pub['enum_colors'] = $colDef['enum_colors'];
        }

        $publicColumns[$colName] = $pub;
    }

    // Filter foreign keys
    $foreignKeys = [];
    if (!empty($tableConfig['foreign_keys'])) {
        foreach ($tableConfig['foreign_keys'] as $col => $fk) {
            $foreignKeys[$col] = [
                'display_column' => $fk['display_column'] ?? 'id'
            ];
        }
    }

    $publicSchema[$tableName] = [
        'display_name' => $tableConfig['display_name'] ?? $tableName,
        'columns'      => $publicColumns,
        'icon'         => $tableConfig['icon'] ?? null,
        'foreign_keys' => $foreignKeys,
        'subtables'    => $tableConfig['subtables'] ?? [],
    ];
}

echo json_encode(['tables' => $publicSchema]);