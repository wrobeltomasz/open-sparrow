<?php
// cron/cron_notifications.php
declare(strict_types=1);

// Disable output buffering to force real-time rendering in the browser
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', '0');
while (ob_get_level() > 0) {
    ob_end_clean();
}

// Fix for PHP 8 strict typing: ob_implicit_flush requires a boolean parameter
ob_implicit_flush(true);

// Helper function to print logs in real-time
function print_log(string $msg): void {
    echo $msg . "<br>\n";
    // Pad with empty spaces to bypass internal browser buffers
    echo str_pad('', 4096) . "\n";
    flush();
}

require_once __DIR__ . '/../includes/db.php';

print_log("<h3>Start CRON - Diagnostics</h3>");

$configFile = __DIR__ . '/../includes/calendar.json';
if (!file_exists($configFile)) {
    print_log("<span style='color:red;'>Missing calendar.json file</span>");
    exit;
}

$config = json_decode(file_get_contents($configFile), true);
if (empty($config['sources'])) {
    print_log("<span style='color:red;'>No sources defined in calendar.</span>");
    exit;
}

print_log("Loaded calendar.json file. Number of sources: " . count($config['sources']) . "<br>");

try {
    print_log("Connecting to the database...");
    $conn = db_connect();
    print_log("Database connected successfully.<br><hr>");

    $insertedCount = 0;

    foreach ($config['sources'] as $source) {
        $table = $source['table'] ?? '';
        $dateCol = $source['date_column'] ?? '';
        $titleCol = $source['title_column'] ?? '';
        $notifiedUsers = $source['notified_users'] ?? []; 
        $days = (int)($source['notify_before_days'] ?? 0);
        $urlTemplate = $source['url_template'] ?? '';

        // Check if all required fields and at least one user are present
        if (!$table || !$dateCol || !$titleCol || empty($notifiedUsers) || !is_array($notifiedUsers)) {
            print_log("Skipping source <b>$table</b> (missing required columns or no users assigned).");
            continue;
        }

        $targetDate = date('Y-m-d', strtotime("+$days days"));
        print_log("Analyzing table: <b>$table</b> (looking for date: <b>$targetDate</b> in column <b>$dateCol</b>)");

        // Fetch records matching the date directly from the target table
        $sql = "
            SELECT 
                id AS record_id, 
                \"$titleCol\" AS title
            FROM app.\"$table\"
            WHERE DATE(\"$dateCol\") = $1
        ";
        
        $result = pg_query_params($conn, $sql, [$targetDate]);
        
        if (!$result) {
            print_log("<span style='color:red;'>SQL QUERY ERROR: " . pg_last_error($conn) . "</span>");
            continue;
        }
        
        $rowCount = pg_num_rows($result);
        print_log("Found matching records in database: <b>$rowCount</b>");

        while ($row = pg_fetch_assoc($result)) {
            $recordId = (int)$row['record_id'];
            
            // Prepend target date to the title
            $titleText = $targetDate . ": " . $row['title'];
            $link = str_replace('{id}', (string)$recordId, $urlTemplate);

            // Insert a notification for every user defined in the array
            foreach ($notifiedUsers as $userId) {
                $userId = (int)$userId;

                $insertSql = "
                    INSERT INTO app.users_notifications (user_id, title, link, source_table, source_id, notify_date)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (user_id, source_table, source_id, notify_date) DO NOTHING
                ";
                
                $res = pg_query_params($conn, $insertSql, [$userId, $titleText, $link, $table, $recordId, $targetDate]);
                
                if ($res && pg_affected_rows($res) > 0) {
                    print_log("&nbsp;&nbsp; Added notification for user ID $userId (Record ID: $recordId)");
                    $insertedCount++;
                } else {
                    print_log("&nbsp;&nbsp; Skipped (Notification for user $userId for record $recordId already exists).");
                }
            }
        }
        print_log("<hr>");
    }

    print_log("<h3>Finished. NEW notifications generated: $insertedCount</h3>");

} catch (Throwable $e) {
    print_log("<span style='color:red;'>Critical error: " . htmlspecialchars($e->getMessage()) . "</span>");
}