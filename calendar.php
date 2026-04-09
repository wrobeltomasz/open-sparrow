<?php
session_start();

// Redirect to login if not authenticated
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Define strict user role
$userRole = $_SESSION['role'] ?? 'readonly';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>OpenSparrow | Calendar</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="assets/css/styles.css" rel="stylesheet" />
    <style>
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .calendar-nav button {
            padding: 5px 15px;
            cursor: pointer;
            background: var(--panel, #fff);
            border: 1px solid var(--border, #ccc);
            border-radius: 4px;
        }
        .calendar-nav button:hover {
            background: var(--border-light, #f1f5f9);
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            background: var(--border-light, #e2e8f0);
            border: 1px solid var(--border-light, #e2e8f0);
            border-radius: 4px;
        }
        .calendar-day-name {
            background: #f8fafc;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
        }
        .calendar-cell {
            background: #fff;
            min-height: 120px;
            padding: 5px;
            display: flex;
            flex-direction: column;
        }
        .calendar-cell.empty {
            background: #f8fafc;
        }
        .calendar-date-num {
            font-size: 14px;
            font-weight: bold;
            color: #64748b;
            margin-bottom: 5px;
            text-align: right;
        }
        .calendar-event {
            font-size: 12px;
            padding: 4px 6px;
            margin-bottom: 4px;
            border-radius: 4px;
            color: white;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .calendar-event:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>

<header>
    <a href="index.php" class="brand-logo">
        <img src="assets/img/logo-blue.png" alt="OpenSparrow Logo" />
  </a>
    <button onclick="window.location.href='index.php'" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.4); color: white; margin-right: auto; margin-left: 20px; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
        &larr; Back to Grid
    </button>
</header>

<main style="padding: 20px;">
    <div class="calendar-header">
        <h2 id="calendarTitle">Month Year</h2>
        <div class="calendar-nav">
            <button id="btnPrev">Prev</button>
            <button id="btnNext">Next</button>
        </div>
    </div>
    
    <div id="calendarContainer" class="calendar-grid"></div>
</main>

<script>
    // Define global user role state
    window.USER_ROLE = '<?php echo htmlspecialchars($userRole ?? 'readonly', ENT_QUOTES, 'UTF-8'); ?>';
</script>

<script type="module" src="assets/js/calendar.js?v=<?php echo @filemtime('assets/js/calendar.js'); ?>"></script>

<footer>
    <div class="footer-content">
        <small>
            <a href="https://opensparrow.org/">OpenSparrow.org</a> | Open source | LGPL v3. | PHP + vanilla JS + Postgres
        </small>
    </div>
</footer>

</body>
</html>