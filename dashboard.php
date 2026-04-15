<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$userRole = $_SESSION['role'] ?? 'readonly';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>OpenSparrow | Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="assets/css/styles.css" rel="stylesheet" />
    <link href="assets/css/mobile.css" rel="stylesheet" media="only screen and (max-width: 768px)" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>

<?php include 'templates/header_app.php'; ?>

<main style="padding: 20px; width: 100%; overflow-y: auto;">
    <h2 id="gridTitle" style="margin-bottom: 20px;">Dashboard</h2>

    <section id="dashboardSection" class="dashboard-grid"></section>
</main>

</div><!-- /.app-container -->

<?php include 'templates/footer.php'; ?>

<script>
    window.USER_ROLE = '<?php echo htmlspecialchars($userRole, ENT_QUOTES, 'UTF-8'); ?>';
</script>
<script type="module" src="assets/js/dashboard.js"></script>

</body>
</html>
