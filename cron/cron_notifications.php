<?php
// cron/cron_notifications.php

require_once __DIR__ . '/../includes/db.php';

echo "<h3>Start CRON - Diagnostics</h3>";

$configFile = __DIR__ . '/../includes/calendar.json';
if (!file_exists($configFile)) {
    die("Missing calendar.json file\n");
}

$config = json_decode(file_get_contents($configFile), true);
if (empty($config['sources'])) {
    die("No sources defined in calendar.\n");
}

echo "Loaded calendar.json file. Number of sources: " . count($config['sources']) . "<br><br>";

try {
    $conn = db_connect();

    $createTableSql = "
    CREATE TABLE IF NOT EXISTS app.users_notifications (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        title VARCHAR(255) NOT NULL,
        link VARCHAR(255),
        source_table VARCHAR(100),
        source_id BIGINT,
        is_read BOOLEAN DEFAULT FALSE,
        notify_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, source_table, source_id, notify_date)
    );";
    
    if (!pg_query($conn, $createTableSql)) {
         echo "Error creating table: " . pg_last_error($conn) . "<br>";
    } else {
         echo "Table app.users_notifications is ready.<br><hr>";
    }

    $insertedCount = 0;

    foreach ($config['sources'] as $source) {
        $table = $source['table'] ?? '';
        $dateCol = $source['date_column'] ?? '';
        $titleCol = $source['title_column'] ?? '';
        $userCol = $source['user_id_column'] ?? ''; // USE THE CORRECT NAME HERE
        $days = (int)($source['notify_before_days'] ?? 0);
        $urlTemplate = $source['url_template'] ?? '';

        if (!$table || !$dateCol || !$titleCol || !$userCol) {
            echo "Skipping source (missing required columns).<br>";
            continue;
        }

        $targetDate = date('Y-m-d', strtotime("+$days days"));
        echo "Analyzing table: <b>$table</b> (looking for date: <b>$targetDate</b> in column <b>$dateCol</b>)<br>";

        // HARD JOIN WITH USERS
        $sql = "
            SELECT 
                t.id as record_id, 
                t.\"$userCol\" as user_id, 
                t.\"$titleCol\" as title
            FROM app.\"$table\" t
            JOIN app.users u ON u.id = t.\"$userCol\"
            WHERE DATE(t.\"$dateCol\") = $1 AND t.\"$userCol\" IS NOT NULL
        ";
        
        $result = pg_query_params($conn, $sql, array($targetDate));
        
        if (!$result) {
            // IF SQL RETURNS AN ERROR (e.g., missing app.users table), PRINT IT:
            echo "<span style='color:red;'>SQL QUERY ERROR: " . pg_last_error($conn) . "</span><br>";
            continue;
        }
        
        $rowCount = pg_num_rows($result);
        echo "Found matching records in database: <b>$rowCount</b><br>";

        while ($row = pg_fetch_assoc($result)) {
            $userId = $row['user_id'];
            $recordId = $row['record_id'];
            
            // --- CHANGE: Prepend date to title instead of "Today" ---
            $titleText = $targetDate . ": " . $row['title'];
            // -----------------------------------------------------------------

            $link = str_replace('{id}', $recordId, $urlTemplate);

            $insertSql = "
                INSERT INTO app.users_notifications (user_id, title, link, source_table, source_id, notify_date)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, source_table, source_id, notify_date) DO NOTHING
            ";
            
            $res = pg_query_params($conn, $insertSql, array($userId, $titleText, $link, $table, $recordId, $targetDate));
            
            if ($res && pg_affected_rows($res) > 0) {
                echo "&nbsp;&nbsp; Added notification for user ID $userId (Order ID: $recordId)<br>";
                $insertedCount++;
            } else {
                echo "&nbsp;&nbsp; Skipped (Notification for order $recordId on this day already exists).<br>";
            }
        }
        echo "<hr>";
    }

    echo "<h3>Finished. NEW notifications generated: $insertedCount</h3>";

} catch (Exception $e) {
    echo "<span style='color:red;'>Critical error: " . $e->getMessage() . "</span><br>";
}
?>