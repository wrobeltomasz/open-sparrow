<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>OpenSparrow | Open source | PHP + vanilla JS + Postgres</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content="<?php echo htmlspecialchars($_SESSION['csrf_token'] ?? '', ENT_QUOTES, 'UTF-8'); ?>" />
    <link href="/assets/css/styles.css" rel="stylesheet" />
    <link href="/assets/css/mobile.css" rel="stylesheet" media="only screen and (max-width: 768px)" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>

<?php
$headerControls = '
    <input id="globalSearch" type="text" placeholder="Find..." />
    <select id="columnFilter"><option value="">All columns</option></select>
    <div id="filterBar" style="display:flex;gap:10px;"></div>
    <button id="clearFilters" title="Clear all filters" style="display:none;">Clear Filters</button>
';
include __DIR__ . '/header.php';
?>
<main>
    <section id="gridSection">
        <h2 id="gridTitle">Table</h2>

        <div id="grid"></div>

        <div id="actions" class="actions">
            <div class="left">
                <select id="mobileActions">
                    <option value="">Choose action…</option>
                    <?php if (($userRole ?? '') === 'editor') : ?>
                    <option value="add">Add row</option>
                    <?php endif; ?>
                    <option value="export">Export CSV</option>
                    <option value="refresh">Refresh table</option>
                </select>

                <?php if (($userRole ?? '') === 'editor') : ?>
                <button id="addRow" class="success">Add</button>
                <?php endif; ?>
                <button id="exportCsv">Export CSV</button>
            </div>

            <div id="pagination" class="pagination"></div>
        </div>
    </section>
</main>
</div>

<pre id="debug"></pre>

<?php include 'templates/footer.php'; ?>

<script nonce="<?php echo $cspNonce ?? ''; ?>">
    window.USER_ROLE = '<?php echo htmlspecialchars($userRole ?? 'viewer', ENT_QUOTES, 'UTF-8'); ?>';
    document.addEventListener("DOMContentLoaded", () => {
        const mobileActions = document.getElementById("mobileActions");
        if (mobileActions) {
            mobileActions.addEventListener("change", e => {
                const action = e.target.value;
                if (action === "add") { const b = document.getElementById("addRow"); if (b) b.click(); }
                if (action === "export") { const b = document.getElementById("exportCsv"); if (b) b.click(); }
                if (action === "refresh") location.reload();
                mobileActions.value = "";
            });
        }
    });
</script>
<script type="module" src="assets/js/app.js?v=<?php echo @filemtime('assets/js/app.js'); ?>"></script>

</body>
</html>