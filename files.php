<?php
// files.php
declare(strict_types=1);

// Set secure session cookie parameters before starting the session
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'domain'   => '',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();

// Redirect to login if no session
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Enforce absolute session lifetime (8 hours) regardless of browser state
$sessionMaxLifetime = 8 * 60 * 60;
if (isset($_SESSION['created_at']) && (time() - $_SESSION['created_at']) > $sessionMaxLifetime) {
    session_destroy();
    header("Location: login.php");
    exit;
}

// Verify session integrity by comparing the stored User-Agent hash against the current request.
// Eliminates opportunistic session hijacking with stolen cookies from different clients.
$sessionUserAgent = $_SESSION['user_agent'] ?? null;
$currentUserAgent = hash('sha256', $_SERVER['HTTP_USER_AGENT'] ?? '');
if ($sessionUserAgent !== null && !hash_equals($sessionUserAgent, $currentUserAgent)) {
    session_destroy();
    header("Location: login.php");
    exit;
}

// Generate CSRF token if it does not exist
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Generate a unique nonce for Content Security Policy
$cspNonce = bin2hex(random_bytes(16));

// Apply essential security headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
// style-src uses nonce instead of unsafe-inline to prevent CSS injection attacks
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'nonce-$cspNonce'; script-src 'self' 'nonce-$cspNonce'; connect-src 'self'");

$userRole = $_SESSION['role'] ?? 'readonly';

// Expose only capability flags to the client instead of the raw role name
// to reduce attack surface during reconnaissance
$userCaps = [
    'canEdit'   => $userRole === 'full',
    'canExport' => in_array($userRole, ['full', 'export'], true),
];

?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>OpenSparrow | Files</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="/assets/css/styles.css" rel="stylesheet" />
    <link href="/assets/css/mobile.css" rel="stylesheet" media="only screen and (max-width: 768px)" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <style nonce="<?php echo $cspNonce; ?>">
        /* Modern UI Variables */
        :root {
            --f-primary: #0f172a;
            --f-accent: #3b82f6;
            --f-danger: #ef4444;
            --f-bg-light: #f8fafc;
            --f-border: #e2e8f0;
            --f-text-main: #334155;
            --f-text-muted: #64748b;
        }

        /* Layout & Cards */
        .files-container { max-width: 1400px; margin: 0 auto; color: var(--f-text-main); font-family: system-ui, -apple-system, sans-serif; }
        .f-card { background: #fff; border: 1px solid var(--f-border); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 24px; margin-bottom: 24px; }

        /* Upload Area */
        .file-upload-box { border: 2px dashed #cbd5e1; background: var(--f-bg-light); border-radius: 8px; padding: 30px 20px; text-align: center; transition: border-color 0.2s, background 0.2s; }
        .file-upload-box:hover { border-color: var(--f-accent); background: #f1f6ff; }
        .file-upload-inputs { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 15px; align-items: center; }

        /* Form Controls */
        .f-input { padding: 10px 14px; border: 1px solid var(--f-border); border-radius: 6px; font-size: 14px; color: var(--f-text-main); outline: none; transition: all 0.2s; background: #fff; box-sizing: border-box; }
        .f-input:focus { border-color: var(--f-accent); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .f-input:disabled { background: #f1f5f9; cursor: not-allowed; color: #94a3b8; }
        .f-input-file { background: transparent; border: none; box-shadow: none; padding: 0; }
        .f-input-w200 { width: 200px; }
        .f-input-w280 { width: 280px; }
        .f-search-input { flex: 1; min-width: 250px; }
        .f-filter-select { min-width: 180px; }

        /* Toolbar */
        .files-toolbar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; background: #fff; padding: 16px; border: 1px solid var(--f-border); border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }

        /* Buttons */
        .f-btn { padding: 10px 18px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; }
        .f-btn-primary { background: var(--f-primary); color: #fff; }
        .f-btn-primary:hover { background: #1e293b; box-shadow: 0 4px 6px rgba(15, 23, 42, 0.2); }
        .f-btn-accent { background: var(--f-accent); color: #fff; }
        .f-btn-accent:hover { background: #2563eb; }
        .f-btn-danger { background: var(--f-danger); color: #fff; }
        .f-btn-danger:hover { background: #dc2626; }
        .f-btn-outline { background: #fff; border: 1px solid #cbd5e1; color: var(--f-text-main); }
        .f-btn-outline:hover { background: var(--f-bg-light); border-color: #94a3b8; }
        .f-btn-upload { margin-top: 10px; min-width: 150px; }
        .f-btn-sm { padding: 6px 12px; font-size: 13px; text-decoration: none; }
        .f-btn-sm-ml { margin-left: 6px; }

        /* Table Grid */
        .table-responsive { overflow-x: auto; border: 1px solid var(--f-border); border-radius: 8px; background: #fff; }
        .file-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; white-space: nowrap; }
        .file-table th { background: var(--f-bg-light); color: var(--f-text-muted); font-weight: 600; padding: 14px 16px; border-bottom: 2px solid var(--f-border); text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
        .file-table td { padding: 14px 16px; border-bottom: 1px solid var(--f-border); color: var(--f-text-main); vertical-align: middle; }
        .file-table tbody tr { transition: background 0.15s; }
        .file-table tbody tr:hover { background: #f8fafc; }
        .file-table tbody tr:last-child td { border-bottom: none; }

        /* Type cell — replaces inline styles in JS-rendered rows */
        .f-td-type { padding: 10px 16px; }
        .f-type-cell { display: flex; align-items: center; gap: 8px; }
        .f-type-icon { width: 20px; height: 20px; opacity: 0.8; }
        .f-type-label { font-weight: bold; color: #64748b; font-size: 12px; }
        .f-td-name { font-weight: 500; }
        .f-td-empty { text-align: center; padding: 30px; color: #64748b; }
        .f-td-error { color: #ef4444; text-align: center; padding: 30px; }

        /* Badges & Typography */
        .file-icon { font-size: 12px; font-weight: 700; color: var(--f-text-muted); background: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block; width: 45px; text-align: center; margin-right: 10px; }
        .related-badge { background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px; border: 1px solid #bfdbfe; display: inline-block; text-decoration: none; transition: background 0.2s; }
        .related-badge:hover { background: #dbeafe; }
        .f-title { margin-top: 0; color: var(--f-primary); font-size: 18px; margin-bottom: 16px; font-weight: 600; }
        .tag-badge { background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #cbd5e1; margin-right: 4px; display: inline-block; }

        /* Upload status states */
        .f-upload-status { margin-top: 15px; font-weight: 500; font-size: 14px; }
        .f-status-success { color: #10b981; }
        .f-status-error   { color: var(--f-danger); }
        .f-status-neutral { color: var(--f-text-main); }

        /* Pagination */
        .f-pagination { display: flex; gap: 8px; justify-content: center; margin-top: 24px; }
        .f-pagination button { padding: 8px 14px; border: 1px solid var(--f-border); background: #fff; border-radius: 6px; cursor: pointer; color: var(--f-text-main); transition: all 0.2s; font-weight: 500; font-size: 14px; }
        .f-pagination button:hover { background: var(--f-bg-light); border-color: #cbd5e1; }
        .f-pagination button.active { background: var(--f-primary); color: #fff; border-color: var(--f-primary); }

        /* Section & hidden scaffold */
        #filesSection { padding: 24px; }
        .f-hidden { display: none; }
    </style>
</head>
<body>

<?php include 'templates/header_app.php'; ?>

<main>
    <section id="filesSection">
        <div class="files-container">

            <div class="f-card">
                <h3 class="f-title">Upload New File</h3>
                <div class="file-upload-box">
                    <div class="file-upload-inputs">
                        <input type="file" id="fileInput" class="f-input f-input-file">
                        <input type="text" id="fileNameInput" class="f-input f-input-w200" placeholder="Optional display name">
                        <input type="text" id="fileTagsInput" class="f-input f-input-w200" placeholder="Tags (comma separated)">
                        <select id="fileRelatedTable" class="f-input f-input-w200">
                            <option value="">-- Target table --</option>
                        </select>
                        <select id="fileRelatedId" class="f-input f-input-w280" disabled>
                            <option value="">-- Select table first --</option>
                        </select>
                    </div>
                    <button id="btnUpload" class="f-btn f-btn-primary f-btn-upload">Upload File</button>
                    <div id="uploadStatus" class="f-upload-status"></div>
                </div>
            </div>

            <div class="files-toolbar">
                <input type="text" id="fileSearch" class="f-input f-search-input" placeholder="Search files by name or tag...">
                <select id="fileTypeFilter" class="f-input f-filter-select">
                    <option value="all">All File Types</option>
                    <option value="image">Images</option>
                    <option value="pdf">PDFs</option>
                    <option value="doc">Documents</option>
                    <option value="spreadsheet">Spreadsheets</option>
                    <option value="archive">Archives</option>
                </select>
                <button id="btnRefreshFiles" class="f-btn f-btn-outline">Refresh List</button>
            </div>

            <div class="table-responsive">
                <table class="file-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>File Name</th>
                            <th>Tags</th>
                            <th>Size</th>
                            <th>Related To</th>
                            <th>Uploaded Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="fileTableBody">
                        <tr><td colspan="7" class="f-td-empty">Loading files...</td></tr>
                    </tbody>
                </table>
            </div>

            <div id="filePagination" class="f-pagination"></div>

        </div>
    </section>
</main>

</div><!-- /.app-container -->

<?php include 'templates/footer.php'; ?>

<script nonce="<?php echo $cspNonce; ?>">
    // Expose binary capability flags only — never the raw role string
    window.USER_CAPS = <?php echo json_encode($userCaps, JSON_THROW_ON_ERROR); ?>;
    // CSRF token for all POST requests originating from this page
    window.CSRF_TOKEN = <?php echo json_encode($_SESSION['csrf_token'], JSON_THROW_ON_ERROR); ?>;
</script>

<script src="assets/js/sidebar.js" nonce="<?php echo $cspNonce; ?>"></script>
<script src="assets/js/notifications.js" nonce="<?php echo $cspNonce; ?>"></script>
<script type="module" src="assets/js/user-menu.js" nonce="<?php echo $cspNonce; ?>"></script>

<script nonce="<?php echo $cspNonce; ?>">
document.addEventListener("DOMContentLoaded", () => {
    const API_URL = 'api_files.php';
    let currentPage = 1;
    let currentSearch = '';
    let currentType = 'all';

    const fileInput       = document.getElementById('fileInput');
    const fileNameInput   = document.getElementById('fileNameInput');
    const fileTagsInput   = document.getElementById('fileTagsInput');
    const tableSelect     = document.getElementById('fileRelatedTable');
    const recordSelect    = document.getElementById('fileRelatedId');
    const btnUpload       = document.getElementById('btnUpload');
    const uploadStatus    = document.getElementById('uploadStatus');
    const tbody           = document.getElementById('fileTableBody');
    const searchInput     = document.getElementById('fileSearch');
    const typeFilter      = document.getElementById('fileTypeFilter');
    const btnRefresh      = document.getElementById('btnRefreshFiles');

    const icons = {
        image:       'assets/icons/image.png',
        pdf:         'assets/icons/picture_as_pdf.png',
        doc:         'assets/icons/docs.png',
        spreadsheet: 'assets/icons/grid_on.png',
        archive:     'assets/icons/folder_zip.png',
        other:       'assets/icons/file_present.png'
    };

    // Cache for related record labels
    const relationCache = {};

    // Initialize lists
    loadConfiguredTables();
    loadFiles();

    // Events
    btnUpload.addEventListener('click', uploadFile);
    btnRefresh.addEventListener('click', () => loadFiles());
    typeFilter.addEventListener('change', (e) => { currentType = e.target.value; currentPage = 1; loadFiles(); });
    tableSelect.addEventListener('change', loadRelatedRecords);

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { currentSearch = e.target.value; currentPage = 1; loadFiles(); }, 400);
    });

    // Event delegation for delete buttons — avoids inline onclick handlers blocked by CSP
    // and keeps the delete function out of the global window scope
    tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action="delete-file"]');
        if (!btn) return;
        const uuid = btn.dataset.uuid;
        if (!uuid || !confirm('Are you sure you want to delete this file?')) return;
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Include CSRF token in all mutating requests
                body: JSON.stringify({ action: 'delete', uuid, csrf_token: window.CSRF_TOKEN })
            });
            const data = await res.json();
            if (data.success) {
                loadFiles();
            } else {
                alert('Delete error: ' + (data.error || 'Unknown'));
            }
        } catch (err) {
            alert('Network error.');
        }
    });

    // Fetch allowed relation tables from config
    async function loadConfiguredTables() {
        try {
            const res = await fetch(API_URL + '?action=get_relations_config');
            const data = await res.json();
            if (data.success && data.relations && data.relations.length > 0) {
                data.relations.forEach(r => {
                    const opt = document.createElement('option');
                    opt.value = r.table;
                    opt.textContent = r.table;
                    tableSelect.appendChild(opt);
                });
            } else {
                tableSelect.disabled = true;
                recordSelect.disabled = true;
                tableSelect.innerHTML = '<option value="">-- No relations active --</option>';
            }
        } catch (err) {
            tableSelect.innerHTML = '<option value="">-- Network error --</option>';
        }
    }

    // Fetch records when a table is chosen
    async function loadRelatedRecords() {
        const tableName = tableSelect.value;
        recordSelect.innerHTML = '<option value="">-- Select record --</option>';
        if (!tableName) {
            recordSelect.disabled = true;
            return;
        }
        recordSelect.disabled = true;
        recordSelect.innerHTML = '<option value="">-- Loading... --</option>';
        try {
            const res = await fetch(`${API_URL}?action=get_related_records&table=${encodeURIComponent(tableName)}`);
            const data = await res.json();
            if (data.success && data.records) {
                recordSelect.innerHTML = '<option value="">-- Select record --</option>';
                data.records.forEach(r => {
                    const opt = document.createElement('option');
                    opt.value = r.id;
                    opt.textContent = r.label;
                    recordSelect.appendChild(opt);
                });
                recordSelect.disabled = false;
            } else {
                recordSelect.innerHTML = '<option value="">-- Load error --</option>';
            }
        } catch (err) {
            recordSelect.innerHTML = '<option value="">-- Network error --</option>';
        }
    }

    // Fetch paginated files
    async function loadFiles() {
        tbody.innerHTML = '<tr><td colspan="7" class="f-td-empty">Loading files...</td></tr>';
        try {
            const params = new URLSearchParams({ action: 'list', page: currentPage, limit: 20, type: currentType, search: currentSearch });
            const res = await fetch(`${API_URL}?${params}`);
            const data = await res.json();

            if (!data.success) {
                tbody.innerHTML = `<tr><td colspan="7" class="f-td-error">Error: ${escapeHtml(data.error || 'Unknown')}</td></tr>`;
                return;
            }

            // Gather tables to fetch labels
            const tablesToFetch = new Set();
            data.files.forEach(f => {
                if (f.related_table && !relationCache[f.related_table]) {
                    tablesToFetch.add(f.related_table);
                }
            });

            // Fetch labels for related records
            const fetchPromises = Array.from(tablesToFetch).map(async (table) => {
                try {
                    const lRes = await fetch(`${API_URL}?action=get_related_records&table=${encodeURIComponent(table)}`);
                    const lData = await lRes.json();
                    relationCache[table] = {};
                    if (lData.success && lData.records) {
                        lData.records.forEach(r => { relationCache[table][r.id] = r.label; });
                    }
                } catch (e) {
                    console.error('Failed to fetch labels for', table);
                }
            });

            await Promise.all(fetchPromises);
            renderTable(data.files);
            renderPagination(data.total_pages);
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="7" class="f-td-error">Network error.</td></tr>';
        }
    }

    function renderTable(files) {
        if (!files || files.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="f-td-empty">No files found matching your criteria.</td></tr>';
            return;
        }

        tbody.innerHTML = files.map(f => {
            const iconPath = icons[f.type] || icons.other;
            const size     = formatBytes(f.size_bytes);
            const date     = new Date(f.created_at).toLocaleDateString();

            // Render related badge with link and proper label
            let relatedBadge = '-';
            if (f.related_table && f.related_id) {
                const displayLabel = relationCache[f.related_table] && relationCache[f.related_table][f.related_id]
                    ? relationCache[f.related_table][f.related_id]
                    : `${f.related_table} #${f.related_id}`;
                relatedBadge = `
                    <a href="edit.php?table=${encodeURIComponent(f.related_table)}&id=${encodeURIComponent(f.related_id)}" class="related-badge" title="Go to record">
                        ${escapeHtml(displayLabel)}
                    </a>
                `;
            }

            // Parse PostgreSQL array syntax {tag1,tag2}
            let tagsHtml = '-';
            if (f.tags && f.tags !== '{}') {
                const rawTags = f.tags.replace(/(^{|}$)/g, '').replace(/"/g, '').split(',');
                tagsHtml = rawTags.map(t => `<span class="tag-badge">${escapeHtml(t.trim())}</span>`).join(' ');
            }

            // Delete button uses data-uuid + event delegation — no inline onclick, no global function
            const deleteBtn = window.USER_CAPS.canEdit
                ? `<button class="f-btn f-btn-danger f-btn-sm f-btn-sm-ml" data-action="delete-file" data-uuid="${escapeHtml(f.uuid)}">Delete</button>`
                : '';

            return `
                <tr>
                    <td class="f-td-type">
                        <div class="f-type-cell">
                            <img src="${escapeHtml(iconPath)}" alt="" class="f-type-icon">
                            <span class="f-type-label">${escapeHtml(f.type.toUpperCase())}</span>
                        </div>
                    </td>
                    <td class="f-td-name">${escapeHtml(f.display_name || f.name)}</td>
                    <td>${tagsHtml}</td>
                    <td>${size}</td>
                    <td>${relatedBadge}</td>
                    <td>${date}</td>
                    <td>
                        <a href="file_download.php?uuid=${encodeURIComponent(f.uuid)}" target="_blank" rel="noopener noreferrer" class="f-btn f-btn-outline f-btn-sm">Download</a>
                        ${deleteBtn}
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderPagination(totalPages) {
        const pagEl = document.getElementById('filePagination');
        pagEl.innerHTML = '';
        if (totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            // Use CSS class instead of inline style — avoids CSP violation
            if (i === currentPage) btn.classList.add('active');
            btn.addEventListener('click', () => { currentPage = i; loadFiles(); });
            pagEl.appendChild(btn);
        }
    }

    // Upload with relations, tags, and CSRF token
    async function uploadFile() {
        if (!fileInput.files.length) {
            setUploadStatus('Please select a file.', 'error');
            return;
        }
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('file', fileInput.files[0]);
        // Include CSRF token in all mutating requests
        formData.append('csrf_token', window.CSRF_TOKEN);
        if (fileNameInput.value.trim()) formData.append('display_name', fileNameInput.value.trim());
        if (fileTagsInput.value.trim()) formData.append('tags', fileTagsInput.value.trim());
        if (!tableSelect.disabled && tableSelect.value.trim()) formData.append('related_table', tableSelect.value.trim());
        if (!recordSelect.disabled && recordSelect.value.trim()) formData.append('related_id', recordSelect.value.trim());

        setUploadStatus('Uploading...', 'neutral');

        try {
            const res = await fetch(API_URL, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                setUploadStatus('File uploaded successfully!', 'success');
                fileInput.value = '';
                fileNameInput.value = '';
                fileTagsInput.value = '';
                tableSelect.value = '';
                recordSelect.innerHTML = '<option value="">-- Select table first --</option>';
                recordSelect.disabled = true;
                loadFiles();
                setTimeout(() => { uploadStatus.textContent = ''; uploadStatus.className = 'f-upload-status'; }, 4000);
            } else {
                setUploadStatus('Error: ' + (data.error || 'Failed'), 'error');
            }
        } catch (err) {
            setUploadStatus('Network error during upload.', 'error');
        }
    }

    // Helper: set upload status text and CSS state class without inline styles
    function setUploadStatus(message, state) {
        uploadStatus.textContent = message;
        uploadStatus.className = `f-upload-status f-status-${state}`;
    }

    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function escapeHtml(unsafe) {
        return (unsafe || '').toString().replace(/[&<>"']/g, m => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
        ));
    }
});
</script>
</body>
</html>
