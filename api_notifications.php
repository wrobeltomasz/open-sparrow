<?php
declare(strict_types=1);

session_start();

// Enforce strict session validation
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Load database helpers
require __DIR__ . '/includes/db.php';

$conn = db_connect();

// Securely assign authenticated user ID
$userId = (int)$_SESSION['user_id'];

header('Content-Type: application/json; charset=utf-8');

try {
    // Fetch notifications only for the currently logged-in user
    $sql = 'SELECT id, message, is_read, created_at FROM "app"."users_notifications" WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50';
    $res = pg_query_params($conn, $sql, [$userId]);

    if (!$res) {
        http_response_code(500);
        echo json_encode(['error' => 'Database query failed']);
        exit;
    }

    $notifications = [];
    while ($row = pg_fetch_assoc($res)) {
        $notifications[] = $row;
    }
    pg_free_result($res);

    echo json_encode(['notifications' => $notifications]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
    exit;
}