<?php
// templates/header_app.php
$currentPage = basename($_SERVER['PHP_SELF']);
$isFormPage  = in_array($currentPage, ['edit.php', 'create.php']);
$action      = $isFormPage ? 'back' : 'redirect';
// $action is always a hardcoded string — basename() + in_array() ensure no user input reaches output
$backText = "Back";
?>
<header>
    <button id="btn-go-back" data-action="<?php echo $action; ?>"><?php echo $backText; ?></button>
</header>
<div class="app-container">
<?php
// Guard: skip the inline script entirely if the parent page did not generate a nonce.
// Rendering a nonce-less script would either break CSP or execute unprotected.
if (!isset($cspNonce)) {
    return;
}
$nonceHtml = 'nonce="' . htmlspecialchars($cspNonce, ENT_QUOTES, 'UTF-8') . '"';
?>
<script <?php echo $nonceHtml; ?>>
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('btn-go-back');
        if (btn) {
            btn.addEventListener('click', function() {
                // Execute action based on data attribute
                if (this.getAttribute('data-action') === 'back') {
                    window.history.back();
                } else {
                    window.location.href = 'index.php';
                }
            });
        }
    });
</script>