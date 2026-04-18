<?php

declare(strict_types=1);

session_start();
// Check if user is logged in
if (!isset($_SESSION['sparrow_admin_logged_in']) || $_SESSION['sparrow_admin_logged_in'] !== true) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'error' => 'Unauthorized access. Log in first.']);
    exit;
}

$action = $_GET['action'] ?? '';
$file = $_GET['file'] ?? '';
// Set this to false for GitHub public release
$isDemoMode = false;
// CSRF Protection for state-changing POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '';
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['status' => 'error', 'error' => 'CSRF token mismatch.']);
        exit;
    }
}

// Ensure state-changing actions use POST method to prevent CSRF via GET
$postActions = ['save', 'import', 'init_db', 'users_add', 'users_toggle', 'users_update_role', 'create_table', 'add_column'];
if (in_array($action, $postActions, true) && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['status' => 'error', 'error' => 'Method Not Allowed. Use POST.']);
    exit;
}

// Initialize database tables and migrations
if ($action === 'init_db') {
    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();

        $schemaIdent = '"' . str_replace('"', '""', sys_schema()) . '"';
        $tUsers = sys_table('users');
        $tUsersLog = sys_table('users_log');
        $tUsersNotifications = sys_table('users_notifications');
        $tFiles = sys_table('files');
        $tLoginAttempts = sys_table('login_attempts');

        // Prepare missing DB updates and tables creation
        $queries = [
            "CREATE SCHEMA IF NOT EXISTS $schemaIdent",
            "CREATE TABLE IF NOT EXISTS $tUsers ( id serial4 NOT NULL, username varchar(50) NOT NULL, password_hash varchar(255) NOT NULL, is_active bool DEFAULT true, role varchar(20) DEFAULT 'full' NOT NULL, CONSTRAINT spw_users_pkey PRIMARY KEY (id), CONSTRAINT spw_users_username_key UNIQUE (username) )",
            "ALTER TABLE $tUsers ADD COLUMN IF NOT EXISTS is_active bool DEFAULT true",
            "ALTER TABLE $tUsers ADD COLUMN IF NOT EXISTS \"role\" varchar(20) DEFAULT 'full' NOT NULL",
            "CREATE TABLE IF NOT EXISTS $tUsersLog ( id serial4 NOT NULL, user_id int4 NOT NULL, \"action\" varchar(50) NOT NULL, target_table varchar(100), record_id int4, created_at timestamp DEFAULT CURRENT_TIMESTAMP, CONSTRAINT spw_users_log_pkey PRIMARY KEY (id) )",
            "CREATE TABLE IF NOT EXISTS $tUsersNotifications ( id serial4 NOT NULL, user_id int8 NOT NULL, title varchar(255) NOT NULL, link varchar(255), source_table varchar(100), source_id int8, is_read bool DEFAULT false, notify_date date NOT NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP, CONSTRAINT spw_users_notifications_pkey PRIMARY KEY (id), CONSTRAINT spw_users_notifications_user_id_source_table_source_id_notify_d_key UNIQUE (user_id, source_table, source_id, notify_date) )",
            "CREATE TABLE IF NOT EXISTS $tFiles ( id serial4 NOT NULL, \"uuid\" uuid DEFAULT gen_random_uuid() NOT NULL, \"name\" varchar(255) NOT NULL, display_name varchar(255) NULL, \"type\" varchar(50) NOT NULL, mime_type varchar(100) NOT NULL, \"extension\" varchar(20) NOT NULL, size_bytes int8 DEFAULT 0 NOT NULL, storage_path text NOT NULL, related_table varchar(100) NULL, related_id int4 NULL, related_field varchar(100) NULL, uploaded_by int4 NULL, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL, deleted_at timestamp NULL, description text NULL, tags _text NULL, metadata jsonb NULL, CONSTRAINT spw_files_pkey PRIMARY KEY (id), CONSTRAINT spw_files_uuid_key UNIQUE (uuid), CONSTRAINT spw_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES $tUsers(id) ON DELETE SET NULL)",
            "CREATE INDEX IF NOT EXISTS idx_spw_files_deleted_at ON $tFiles USING btree (deleted_at) WHERE (deleted_at IS NULL)",
            "CREATE INDEX IF NOT EXISTS idx_spw_files_metadata ON $tFiles USING gin (metadata)",
            "CREATE INDEX IF NOT EXISTS idx_spw_files_related ON $tFiles USING btree (related_table, related_id)",
            "CREATE INDEX IF NOT EXISTS idx_spw_files_tags ON $tFiles USING gin (tags)",
            "CREATE INDEX IF NOT EXISTS idx_spw_files_type ON $tFiles USING btree (type)",
            "CREATE INDEX IF NOT EXISTS idx_spw_files_uploaded_by ON $tFiles USING btree (uploaded_by)",
            "CREATE TABLE IF NOT EXISTS $tLoginAttempts ( id serial4 NOT NULL, username varchar(50) NOT NULL, ip_hash varchar(64) NOT NULL, attempted_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT spw_login_attempts_pkey PRIMARY KEY (id) )",
            "CREATE INDEX IF NOT EXISTS idx_spw_login_attempts_username ON $tLoginAttempts USING btree (username, attempted_at)",
            "CREATE INDEX IF NOT EXISTS idx_spw_login_attempts_ip ON $tLoginAttempts USING btree (ip_hash, attempted_at)",
            "INSERT INTO $tUsers (username, password_hash, is_active, role) SELECT 'test', '\$2y\$12\$oqxkKJu53qLCJSnmyxs1BeIDeP81M.cstuhm7T6hS0HPMXYqaK2Je', true, 'full' WHERE NOT EXISTS (SELECT 1 FROM $tUsers WHERE username = 'test')"
        ];
        
        foreach ($queries as $q) {
            $res = @pg_query($conn, $q);
            if (!$res) {
                throw new Exception(pg_last_error($conn));
            }
        }

        header('Content-Type: application/json');
        echo json_encode(['status' => 'success', 'message' => 'System tables initialized successfully.']);
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'error' => $e->getMessage()]);
    }
    exit;
}

// Fetch list of all system users
if ($action === 'users_list') {
    header('Content-Type: application/json');
    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();
        $sql = "SELECT id, username, is_active, role FROM " . sys_table('users') . " ORDER BY id ASC";
        $res = @pg_query($conn, $sql);
        if (!$res) {
            $err = pg_last_error($conn);
            if (str_contains($err, 'is_active') || str_contains($err, 'does not exist')) {
                throw new Exception("Database schema is outdated or missing. Please initialize tables.");
            }
            throw new Exception($err);
        }

        $users = [];
        while ($row = pg_fetch_assoc($res)) {
            $row['is_active'] = ($row['is_active'] === 't' || $row['is_active'] === true);
            $users[] = $row;
        }

        echo json_encode(['status' => 'success', 'users' => $users]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'error' => $e->getMessage()]);
    }
    exit;
}

// Add a new user securely
if ($action === 'users_add') {
    header('Content-Type: application/json');
    if ($isDemoMode) {
        echo json_encode(['status' => 'error', 'error' => 'Action disabled in Demo Mode.']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    $role = isset($data['role']) && $data['role'] === 'readonly' ? 'readonly' : 'full';
    
    if (empty($username) || empty($password)) {
        echo json_encode(['status' => 'error', 'error' => 'Username and password are required.']);
        exit;
    }

    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO " . sys_table('users') . " (username, password_hash, is_active, role) VALUES ($1, $2, true, $3)";
        $res = @pg_query_params($conn, $sql, [$username, $hash, $role]);
        if (!$res) {
            throw new Exception(pg_last_error($conn));
        }
        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'error' => $e->getMessage()]);
    }
    exit;
}

// Toggle user activation status
if ($action === 'users_toggle') {
    header('Content-Type: application/json');
    if ($isDemoMode) {
        echo json_encode(['status' => 'error', 'error' => 'Action disabled in Demo Mode.']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $userId = (int)($data['id'] ?? 0);
    $isActive = (bool)($data['is_active'] ?? false);
    if ($userId <= 0) {
        echo json_encode(['status' => 'error', 'error' => 'Invalid user ID.']);
        exit;
    }

    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();
        $sql = "UPDATE " . sys_table('users') . " SET is_active = $1 WHERE id = $2";
        $res = @pg_query_params($conn, $sql, [$isActive ? 'true' : 'false', $userId]);
        if (!$res) {
            throw new Exception(pg_last_error($conn));
        }
        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'error' => $e->getMessage()]);
    }
    exit;
}

// Handle user role update
if ($action === 'users_update_role') {
    header('Content-Type: application/json');
    if ($isDemoMode) {
        echo json_encode(['status' => 'error', 'error' => 'Action disabled in Demo Mode.']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $userId = (int)($data['id'] ?? 0);
    $role = isset($data['role']) && $data['role'] === 'readonly' ? 'readonly' : 'full';

    if ($userId <= 0) {
        echo json_encode(['status' => 'error', 'error' => 'Invalid user ID.']);
        exit;
    }

    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();
        $sql = "UPDATE " . sys_table('users') . " SET role = $1 WHERE id = $2";
        $res = @pg_query_params($conn, $sql, [$role, $userId]);
        if (!$res) {
            throw new Exception(pg_last_error($conn));
        }
        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'error' => $e->getMessage()]);
    }
    exit;
}

// Handle table creation
if ($action === 'create_table') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Sanitize schema and table variables
    $schemaName = preg_replace('/[^a-z0-9_]/', '', strtolower($input['schema'] ?? 'public'));
    $tableName = preg_replace('/[^a-z0-9_]/', '', strtolower($input['table'] ?? ''));

    if (empty($tableName) || empty($schemaName)) {
        echo json_encode(['status' => 'error', 'error' => 'Invalid schema or table name.']);
        exit;
    }

    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();
        
        // Prepare schema-prefixed identifiers
        $safeSchema = pg_escape_identifier($conn, $schemaName);
        $safeTable = pg_escape_identifier($conn, $tableName);

        // Execute table creation query
        $sql = "CREATE TABLE " . $safeSchema . "." . $safeTable . " (id serial4 NOT NULL PRIMARY KEY)";
        $res = @pg_query($conn, $sql);

        if (!$res) {
            throw new Exception(pg_last_error($conn));
        }

        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'error' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'add_column') {
    header('Content-Type: application/json');
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Strict input sanitization
    $schemaName = preg_replace('/[^a-z0-9_]/', '', strtolower($input['schema'] ?? 'public'));
    $tableName = preg_replace('/[^a-z0-9_]/', '', strtolower($input['table'] ?? ''));
    $colName = preg_replace('/[^a-z0-9_]/', '', strtolower($input['column'] ?? ''));
    $colType = $input['type'] ?? 'varchar(255)';

    if (empty($tableName) || empty($colName) || empty($schemaName)) {
        echo json_encode(['status' => 'error', 'error' => 'Invalid schema, table or column name.']);
        exit;
    }

    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();
        
        // Escape parameters properly
        $safeSchema = pg_escape_identifier($conn, $schemaName);
        $safeTable = pg_escape_identifier($conn, $tableName);
        $safeCol = pg_escape_identifier($conn, $colName);

        // Allow predefined data types only
        $allowedTypes = ['varchar(255)', 'int4', 'int8', 'boolean', 'text', 'date', 'timestamp'];
        if (!in_array($colType, $allowedTypes, true)) {
            throw new Exception('Invalid data type provided.');
        }

        // Alter table using explicit schema syntax
        $sql = "ALTER TABLE " . $safeSchema . "." . $safeTable . " ADD COLUMN " . $safeCol . " " . $colType;
        $res = @pg_query($conn, $sql);

        if (!$res) {
            throw new Exception(pg_last_error($conn));
        }

        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'error' => $e->getMessage()]);
    }
    exit;
}

// Check database connection and system health
if ($action === 'health') {
    $db_connected = false;
    $db_error = 'Unknown error';
    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();
        if ($conn) {
            $db_connected = true;
            $db_error = '';
            pg_close($conn);
        }
    } catch (Exception $e) {
        $db_error = $e->getMessage();
    }

    $data = [
        'php_version' => PHP_VERSION,
        'php_version_ok' => version_compare(PHP_VERSION, '8.0.0', '>='),
        'pgsql_ok' => extension_loaded('pgsql') || extension_loaded('pdo_pgsql'),
        'dir_writable' => is_writable(__DIR__ . '/../includes'),
        'db_connected' => $db_connected,
        'db_error' => $db_error
    ];
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Export JSON configurations as a ZIP file
if ($action === 'export') {
    if (!class_exists('ZipArchive')) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'PHP ZIP extension is disabled. Enable extension=zip in php.ini.']);
        exit;
    }

    $zip = new ZipArchive();
    $zipFile = sys_get_temp_dir() . '/sparrow_config_' . time() . '.zip';
    if ($zip->open($zipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
        $includesDir = __DIR__ . '/../includes/';
        // Dodałem files.json do backupu
        $filesToBackup = ['schema.json', 'dashboard.json', 'calendar.json', 'database.json', 'security.json', 'workflows.json', 'files.json'];
        foreach ($filesToBackup as $f) {
            if (file_exists($includesDir . $f)) {
                $zip->addFile($includesDir . $f, $f);
            }
        }
        $zip->close();
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="sparrow_backup.zip"');
        header('Content-Length: ' . filesize($zipFile));
        readfile($zipFile);
        unlink($zipFile);
        exit;
    } else {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Cannot create zip file']);
        exit;
    }
}

// Import JSON configurations from a ZIP file safely
if ($action === 'import' && isset($_FILES['backup_file'])) {
    if (!class_exists('ZipArchive')) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'PHP ZIP extension is disabled. Enable extension=zip in php.ini.']);
        exit;
    }

    $zip = new ZipArchive();
    if ($zip->open($_FILES['backup_file']['tmp_name']) === true) {
        $extractPath = __DIR__ . '/../includes/';
        $validFiles = [];

        // Validate each file inside the archive
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $filename = $zip->getNameIndex($i);
            // Block path traversal characters and enforce .json extension to prevent RCE
            if (str_contains($filename, '../') || str_contains($filename, '..\\') || substr($filename, -5) !== '.json') {
                $zip->close();
                http_response_code(400);
                header('Content-Type: application/json');
                echo json_encode(['error' => 'Invalid file detected. Only safe .json files are allowed.']);
                exit;
            }
            $validFiles[] = $filename;
        }

        // Extract only the validated files
        foreach ($validFiles as $file) {
            $zip->extractTo($extractPath, $file);
        }

        $zip->close();
        header('Content-Type: application/json');
        echo json_encode(['status' => 'success']);
        exit;
    }

    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid zip file']);
    exit;
}

// Scan directories for available icons
if ($action === 'list_icons') {
    $icons = [];
    $dirsToScan = [
        'assets/icons' => __DIR__ . '/../assets/icons',
        'assets/img' => __DIR__ . '/../assets/img'
    ];
    foreach ($dirsToScan as $prefix => $dirPath) {
        if (is_dir($dirPath)) {
            $files = scandir($dirPath);
            foreach ($files as $file) {
                if ($file !== '.' && $file !== '..') {
                    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                    if (in_array($ext, ['png', 'jpg', 'jpeg', 'svg', 'gif'])) {
                        $icons[] = $prefix . '/' . $file;
                    }
                }
            }
        }
    }
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'icons' => array_values(array_unique($icons))]);
    exit;
}

// Allowed config files for read and write operations
// Dodałem 'files' do autoryzowanych konfiguracji
$allowedFiles = ['schema', 'dashboard', 'calendar', 'database', 'security', 'workflows', 'files'];

// Get content of a JSON config file
if ($action === 'get' && in_array($file, $allowedFiles, true)) {
    $filePath = __DIR__ . '/../includes/' . $file . '.json';
    header('Content-Type: application/json');
    if (file_exists($filePath)) {
        $fileContent = file_get_contents($filePath);
        // Mask sensitive data in Demo Mode
        if ($isDemoMode && $file === 'database') {
            $dbData = json_decode($fileContent, true);
            $dbData['host'] = 'hidden-for-demo.postgres.database.azure.com';
            $dbData['user'] = 'demo_user_hidden';
            $dbData['password'] = '********';
            $dbData['dbname'] = 'demo_db';
            echo json_encode($dbData);
        } elseif ($isDemoMode && $file === 'security') {
            $secData = json_decode($fileContent, true);
            if (isset($secData['admin_password'])) {
                $secData['admin_password'] = '********';
            }
            echo json_encode($secData);
        } else {
            echo $fileContent;
        }
    } else {
        echo json_encode(new stdClass());
    }
    exit;
}

// Save content to a JSON config file
if ($action === 'save' && in_array($file, $allowedFiles, true)) {
    // Block saving sensitive files in Demo Mode
    if ($isDemoMode && in_array($file, ['database', 'security'])) {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'error' => 'Saving ' . $file . ' configuration is disabled in Demo Mode.']);
        exit;
    }

    $data = file_get_contents('php://input');
    $filePath = __DIR__ . '/../includes/' . $file . '.json';
    header('Content-Type: application/json');
    $parsedData = json_decode($data, true);
    if ($parsedData !== null) {
        // Hash the admin password securely before saving if it is not hashed already
        if ($file === 'security' && !empty($parsedData['admin_password'])) {
            $info = password_get_info($parsedData['admin_password']);
            if ($info['algoName'] === 'unknown') {
                $parsedData['admin_password'] = password_hash($parsedData['admin_password'], PASSWORD_DEFAULT);
            }
        }

        if (!is_dir(__DIR__ . '/../includes/')) {
            mkdir(__DIR__ . '/../includes/', 0777, true);
        }
        file_put_contents($filePath, json_encode($parsedData, JSON_PRETTY_PRINT));
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'error' => 'Invalid JSON']);
    }
    exit;
}

// Fetch all tables from a specific database schema
// Parameters are accepted via POST JSON body (preferred — avoids WAF/ModSecurity
// rules that flag SQL-looking GET query strings on shared hosting) with a GET
// fallback for backward compatibility.
if ($action === 'sync_schema') {
    header('Content-Type: application/json');
    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();
        $body = json_decode((string) file_get_contents('php://input'), true) ?: [];
        $schemaName = $body['schema_name'] ?? $_POST['schema_name'] ?? $_GET['schema_name'] ?? 'public';
        // Exclude OpenSparrow system tables (spw_*) so they cannot be imported as user tables.
        $sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE' AND table_name NOT LIKE 'spw\\_%' ESCAPE '\\'";
        $res = @pg_query_params($conn, $sql, [$schemaName]);
        if (!$res) {
            throw new Exception(pg_last_error($conn));
        }

        $tables = [];
        while ($row = pg_fetch_assoc($res)) {
            $tables[] = $row['table_name'];
        }

        echo json_encode(['status' => 'success', 'tables' => $tables]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'error' => $e->getMessage()]);
    }
    exit;
}

// Fetch all columns and their data types for a specific table
// Parameters are accepted via POST JSON body (preferred — avoids WAF/ModSecurity
// rules that flag SQL-looking GET query strings on shared hosting) with a GET
// fallback for backward compatibility.
if ($action === 'get_db_columns') {
    header('Content-Type: application/json');
    try {
        require_once __DIR__ . '/../includes/db.php';
        $conn = db_connect();
        $body = json_decode((string) file_get_contents('php://input'), true) ?: [];
        $tableName = $body['table'] ?? $_POST['table'] ?? $_GET['table'] ?? '';
        $schemaName = $body['schema_name'] ?? $_POST['schema_name'] ?? $_GET['schema_name'] ?? 'public';
        $sql = "SELECT column_name, data_type, is_nullable, udt_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2";
        $res = @pg_query_params($conn, $sql, [$schemaName, $tableName]);
        if (!$res) {
            throw new Exception(pg_last_error($conn));
        }

        $columns = [];
        while ($row = pg_fetch_assoc($res)) {
            $colName = $row['column_name'];
            $dataType = $row['data_type'];
            $udtName = $row['udt_name'];
            $enumValues = null;
            // Fetch ENUM values only for user-defined types safely using pg_escape_identifier
            if ($dataType === 'USER-DEFINED') {
                $safeSchema = pg_escape_identifier($conn, $schemaName);
                $safeUdt = pg_escape_identifier($conn, $udtName);
                $enumSql = "SELECT unnest(enum_range(NULL::$safeSchema.$safeUdt))::varchar AS enum_value";
                $enumRes = @pg_query($conn, $enumSql);
                if ($enumRes) {
                    $enumValues = [];
                    while ($e = pg_fetch_assoc($enumRes)) {
                        $enumValues[] = $e['enum_value'];
                    }
                }
            }

            // Create standard array and append column name
            $colData = [
                'column_name' => $colName,
                'type' => $dataType,
                'not_null' => ($row['is_nullable'] === 'NO'),
                'display_name' => ucfirst(str_replace('_', ' ', $colName))
            ];
            if ($enumValues !== null) {
                $colData['enum_values'] = $enumValues;
            }

            // Append element to array to force PHP to output JSON Array
            $columns[] = $colData;
        }

        echo json_encode(['status' => 'success', 'columns' => $columns]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'error' => $e->getMessage()]);
    }
    exit;
}