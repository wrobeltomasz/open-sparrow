<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>OpenSparrow | Open source | PHP + vanilla JS + Postgres</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="/assets/css/styles.css" rel="stylesheet" />
    <link href="/assets/css/mobile.css" rel="stylesheet" media="only screen and (max-width: 768px)" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>

<header>
    <a href="index.php" class="brand-logo">
        <img src="assets/img/logo-blue.png" alt="Sparrow Logo" />
    </a>

    <input id="globalSearch" type="text" placeholder="Find..." />

    <select id="columnFilter">
        <option value="">All columns</option>
    </select>

    <div id="filterBar" style="display: flex; gap: 10px;"></div>

    <button id="clearFilters" title="Clear all filters" style="display:none;">Clear Filters</button>

    <div class="header-user-menu">
        <div class="notifications-wrapper" 
             style="position: relative; cursor: pointer; display: inline-block; margin-right: 15px; vertical-align: middle;">
            <span style="font-size: 20px;"><img style="height:20px;" title="User notifications" src="assets/img/notifications.png"></span>
            <span id="notif-badge" style="
                display: none;
                position: absolute;
                top: -8px;
                right: -10px;
                background: var(--danger);
                color: white;
                border-radius: 50%;
                padding: 2px 6px;
                font-size: 11px;
                font-weight: bold;
            ">0</span>
            
            <div id="notif-dropdown" style="
                display: none;
                position: absolute;
                top: 40px;
                right: -50px;
                width: 320px;
                background: white;
                border: 1px solid #ccc;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                max-height: 400px;
                overflow-y: auto;
                color: #333;
                text-align: left;
                border-radius: 4px;
            ">
                <div style="padding: 12px; background: #f8f9fa; font-weight: bold; 
                            border-bottom: 1px solid #ddd; border-radius: 4px 4px 0 0;">
                    Notifications
                </div>
                <ul id="notif-list" style="list-style: none; margin: 0; padding: 0;"></ul>
            </div>
        </div>

        <?php if (($userRole ?? '') === 'full') : ?>
        <a href="/admin/index.php" title="Admin" 
           style="text-decoration: none; font-size: 20px; margin-right: 15px; 
                  vertical-align: middle; display: inline-block; transition: opacity 0.2s;">
           <img style="height:20px;" title="Admin panel" src="assets/img/settings.png">
        </a>
        <?php endif; ?>
        
        <?php if (isset($_SESSION['username'])) : ?>
            <span class="header-username"><?= htmlspecialchars($_SESSION['username'], ENT_QUOTES, 'UTF-8') ?></span>
        <?php endif; ?>
        
        <button onclick="window.location.href='logout.php'" class="btn-logout">
            Logout
        </button>
    </div>
</header>

<nav id="menu" class="menu"></nav>

<main>
    <section id="gridSection">
        <h2 id="gridTitle">Table</h2>

        <div id="grid"></div>

        <div id="actions" class="actions">
            <div class="left">
                <select id="mobileActions">
                    <option value="">Choose action…</option>
                    <?php if (($userRole ?? '') === 'full') : ?>
                    <option value="add">Add row</option>
                    <?php endif; ?>
                    <option value="export">Export CSV</option>
                    <option value="refresh">Refresh table</option>
                </select>

                <?php if (($userRole ?? '') === 'full') : ?>
                <button id="addRow" class="success">Add</button>
                <?php endif; ?>
                <button id="exportCsv">Export CSV</button>
            </div>

            <div id="pagination" class="pagination"></div>
        </div>
    </section>
</main>

<pre id="debug"></pre>

<footer>
    <div class="footer-content">
        <small>
            <a href="https://opensparrow.org/">OpenSparrow.org</a> | Open source | LGPL v3. | PHP + vanilla JS + Postgres
        </small>
    </div>
</footer>

<script>
    // Define global user role state
    window.USER_ROLE = '<?php echo htmlspecialchars($userRole ?? 'readonly', ENT_QUOTES, 'UTF-8'); ?>';

    document.addEventListener("DOMContentLoaded", () => {
        const mobileActions = document.getElementById("mobileActions");
        const menu = document.getElementById("menu");

        if (mobileActions) {
            mobileActions.addEventListener("change", e => {
                const action = e.target.value;
                if (action === "add") {
                    const addBtn = document.getElementById("addRow");
                    if (addBtn) addBtn.click();
                }
                if (action === "export") {
                    const exportBtn = document.getElementById("exportCsv");
                    if (exportBtn) exportBtn.click();
                }
                if (action === "refresh") location.reload();
                mobileActions.value = "";
            });
        }

        const badge = document.getElementById('notif-badge');
        const dropdown = document.getElementById('notif-dropdown');
        const notifList = document.getElementById('notif-list');
        const wrapper = document.querySelector('.notifications-wrapper');

        async function checkNotifications() {
            try {
                const res = await fetch('api_notifications.php?action=get_count', {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                const data = await res.json();
                if (data.count > 0) {
                    if (badge) {
                        badge.style.display = 'block';
                        badge.textContent = data.count;
                    }
                } else {
                    if (badge) badge.style.display = 'none';
                }
            } catch (error) {
                console.error('Error checking notifications:', error);
            }
        }

        if (wrapper) {
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                if (dropdown.style.display === 'none') {
                    dropdown.style.display = 'block';
                    loadNotifications();
                } else {
                    dropdown.style.display = 'none';
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (wrapper && !e.target.closest('.notifications-wrapper')) {
                if (dropdown) dropdown.style.display = 'none';
            }
        });

        function loadNotifications() {
            fetch('api_notifications.php?action=get_list', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(data => {
                if (!notifList) return;
                notifList.innerHTML = '';
                if (data.length > 0) {
                    data.forEach(notification => {
                        const li = document.createElement('li');
                        li.style.padding = '15px';
                        li.style.textAlign = 'center';
                        li.style.color = '#777';
                        li.textContent = notification.title;
                        notifList.appendChild(li);
                    });
                } else {
                    const emptyMsg = document.createElement('li');
                    emptyMsg.style.padding = '15px';
                    emptyMsg.style.textAlign = 'center';
                    emptyMsg.style.color = '#777';
                    emptyMsg.textContent = 'No new notifications';
                    notifList.appendChild(emptyMsg);
                }
            })
            .catch(error => console.error('Error loading notifications:', error));
        }

        checkNotifications();
        setInterval(checkNotifications, 120000);
    });
</script>

<script type="module" src="assets/js/app.js?v=<?php echo @filemtime('assets/js/app.js'); ?>"></script>

</body>
</html>