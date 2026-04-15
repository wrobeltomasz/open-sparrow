<?php
// templates/header_app.php
$currentPage = basename($_SERVER['PHP_SELF']);
$isFormPage = in_array($currentPage, ['edit.php', 'create.php']);
$backAction = $isFormPage ? "window.history.back()" : "window.location.href='index.php'";
$backText = $isFormPage ? "Back" : "Back";
?>
<header>
<button onclick="<?php echo $backAction; ?>"><?php echo $backText; ?></button>
</header>
<div class="app-container">
