<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Sparrow | Open source | PHP + vanilla JS + Postgres</title>
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
        <div class="notifications-wrapper" style="position: relative; cursor: pointer; display: inline-block; margin-right: 15px; vertical-align: middle;">
            <span style="font-size: 20px;">🔔</span>
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
                <div style="padding: 12px; background: #f8f9fa; font-weight: bold; border-bottom: 1px solid #ddd; border-radius: 4px 4px 0 0;">
                    Notifications
                </div>
                <ul id="notif-list" style="list-style: none; margin: 0; padding: 0;"></ul>
            </div>
        </div>

        <a href="/admin/index.php" title="Admin" style="text-decoration: none; font-size: 20px; margin-right: 15px; vertical-align: middle; display: inline-block; transition: opacity 0.2s;">⚙️</a>

        <button onclick="window.location.href='logout.php'" class="btn-logout">
            Logout
        </button>
        
        <button id="hamburger" class="hamburger">☰</button>
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
                    <option value="add">Add row</option>
                    <option value="export">Export CSV</option>
                    <option value="refresh">Refresh table</option>
                </select>

                <button id="addRow" class="success" disabled>Add</button>
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
            <a href="https://opensparrow.org/">OpenSparrow.org</a> | Open source | LGPL v3. | PHP + vanilla JS + Postgres!
        </small>
    </div>
</footer>

<script>
    const schema = <?php echo isset($schemaJson) ? $schemaJson : '{}'; ?>;

    document.addEventListener("DOMContentLoaded", () => {
        
        const mobileActions = document.getElementById("mobileActions");
        const hamburger = document.getElementById("hamburger");
        const menu = document.getElementById("menu");

        if (mobileActions) {
            mobileActions.addEventListener("change", e => {
                const action = e.target.value;
                if (action === "add") document.getElementById("addRow").click();
                if (action === "export") document.getElementById("exportCsv").click();
                if (action === "refresh") location.reload();
                mobileActions.value = "";
            });
        }

        if (hamburger && menu) {
            hamburger.addEventListener("click", () => {
                menu.classList.toggle("open");
            });

            menu.addEventListener("click", e => {
                if (e.target.tagName === "A" || e.target.closest("A")) {
                    menu.classList.remove("open");
                }
            });
        }

        const badge = document.getElementById('notif-badge');
        const dropdown = document.getElementById('notif-dropdown');
        const notifList = document.getElementById('notif-list');
        const wrapper = document.querySelector('.notifications-wrapper');

        async function checkNotifications() {
            try {
                const res = await fetch('api_notifications.php?action=get_count');
                const data = await res.json();
                if (data.status === 'success') {
                    if (data.count > 0) {
                        badge.textContent = data.count;
                        badge.style.display = 'inline-block';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            } catch(e) { console.error("Notif error:", e); }
        }

        if (wrapper) {
            wrapper.addEventListener('click', async (e) => {
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                
                if (dropdown.style.display === 'block') {
                    notifList.innerHTML = '<li style="padding:15px; text-align:center;">Ładowanie...</li>';
                    const res = await fetch('api_notifications.php?action=get_list');
                    const data = await res.json();
                    
                    notifList.innerHTML = '';
                    if (data.notifications && data.notifications.length > 0) {
                        data.notifications.forEach(n => {
                            const li = document.createElement('li');
                            li.style.padding = '12px 15px';
                            li.style.borderBottom = '1px solid #eee';
                            li.style.background = (n.is_read === 't' || n.is_read === true) ? '#fff' : '#f0f4ff'; 
                            
                            // Poprawiona zawartość - tylko tytuł i link
                            li.innerHTML = `
                                <div style="font-size:14px; margin-bottom: 6px;">${n.title}</div>
                                ${n.link ? `<a href="${n.link}" style="font-size:13px; color:#007ACC; text-decoration:none; font-weight:bold;">Przejdź do rekordu ➔</a>` : ''}
                            `;
                            
                            if (n.link && n.is_read !== 't' && n.is_read !== true) {
                                li.querySelector('a').addEventListener('click', async (ev) => {
                                    await fetch('api_notifications.php?action=mark_read', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: n.id })
                                    });
                                });
                            }
                            
                            notifList.appendChild(li);
                        });
                    } else {
                        notifList.innerHTML = '<li style="padding:15px; text-align:center; color:#777;">No new notifications</li>';
                    }
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (wrapper && !e.target.closest('.notifications-wrapper')) {
                dropdown.style.display = 'none';
            }
        });

        checkNotifications();
        setInterval(checkNotifications, 120000);
    });
</script>

<script type="module" src="assets/js/app.js?v=<?php echo filemtime('assets/js/app.js'); ?>"></script>

</body>
</html>
