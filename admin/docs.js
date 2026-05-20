// admin/docs.js

export function renderDocumentation(ctx) {
    const { workspaceEl } = ctx;
    workspaceEl.innerHTML = '';

    let lang = localStorage.getItem('sparrow_docs_lang') || 'en';

    const wrapper = document.createElement('div');

    const langBar = document.createElement('div');
    langBar.style.cssText = 'max-width:900px; display:flex; justify-content:flex-end; gap:8px; margin-bottom:8px;';
    ['en', 'pl'].forEach(l => {
        const btn = document.createElement('button');
        btn.textContent = l.toUpperCase();
        btn.dataset.lang = l;
        btn.style.cssText = `padding:4px 12px; border-radius:4px; border:1px solid #cbd5e1; cursor:pointer; font-size:13px; font-weight:600; background:${lang === l ? '#2563eb' : '#f8fafc'}; color:${lang === l ? '#fff' : '#475569'};`;
        btn.addEventListener('click', () => {
            lang = l;
            localStorage.setItem('sparrow_docs_lang', l);
            renderDocumentation(ctx);
        });
        langBar.appendChild(btn);
    });

    const content = document.createElement('div');
    content.style.cssText = 'max-width:900px; padding:30px; background:white; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,.1); color:#334155; line-height:1.6; margin-bottom:40px;';
    content.innerHTML = lang === 'pl' ? getContentPl() : getContentEn();

    wrapper.appendChild(langBar);
    wrapper.appendChild(content);
    workspaceEl.appendChild(wrapper);

    const itemListEl = document.getElementById('itemList');
    const sidebarTitle = document.getElementById('sidebarTitle');
    if (sidebarTitle) sidebarTitle.textContent = lang === 'pl' ? 'Spis treści' : 'Contents';

    if (itemListEl) {
        itemListEl.innerHTML = '';
        content.querySelectorAll('h3[id]').forEach(h => {
            const li = document.createElement('li');
            li.textContent = h.textContent.trim();
            li.style.cssText = 'cursor:pointer; font-size:12px; line-height:1.4; padding:5px 8px; border-radius:4px; color:#475569;';
            li.addEventListener('mouseover', () => { li.style.background = '#e2e8f0'; li.style.color = '#0f172a'; });
            li.addEventListener('mouseout',  () => { li.style.background = '';        li.style.color = '#475569'; });
            li.addEventListener('click', () => { h.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
            itemListEl.appendChild(li);
        });
    }
}

function getContentEn() {
    return `
        <div>
            <h2 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0; color: #0f172a;">
                OpenSparrow - Admin Panel Documentation
            </h2>
            <p style="font-size: 15px; color: #64748b; margin-bottom: 30px;">
                Configure your frontend application, manage database connections, and build dynamic dashboards, calendars and workflows without writing a single line of code.
            </p>

            <h3 id="doc-0" style="color: #2563eb; margin-top: 30px;">0. First-Run Setup</h3>
            <p style="background:#fef3c7;padding:10px 14px;border-left:3px solid #f59e0b;border-radius:4px;font-size:14px;">
                <strong>Fresh installation?</strong> The admin panel automatically detects that the database is not yet configured (no connection or missing <code>spw_users</code> table) and opens without requiring a login. Follow these steps exactly:
            </p>
            <ol style="padding-left: 20px;">
                <li>Open <code>/admin</code> in your browser — the panel loads in setup mode with a yellow banner.</li>
                <li>Go to <strong>System → Database</strong>, enter host, port, database name, user and password, then click <strong>Save config</strong>.</li>
                <li>Go to <strong>System → Migrations</strong> and click <strong>Apply Pending Migrations</strong>. This creates all <code>spw_*</code> tables and inserts a default admin account: username <code>admin</code>, password <code>admin</code>.</li>
                <li>Go to <code>/login</code>, log in as <code>admin</code> / <code>admin</code>. You are redirected to <code>/admin</code> automatically.</li>
                <li>Go to <strong>System → Users</strong>, find the <em>admin</em> row and click <strong>Change pwd</strong>. Enter your current password (<code>admin</code>) and set a strong new one.</li>
            </ol>
            <p>From that point the admin panel requires a valid session — the setup bypass is permanently closed once <code>spw_users</code> exists in the database.</p>

            <h3 id="doc-0b" style="color: #2563eb; margin-top: 30px;">0b. Admin Panel Layout</h3>
            <p>The admin panel uses a collapsible left sidebar with four sections. The header provides global actions.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Data Management:</strong> Schema, Dashboard, Calendar, Files, Menu Preview, Add Table.</li>
                <li><strong>Workflows:</strong> Workflow Manager.</li>
                <li><strong>System:</strong> Database, Users, Health Check, Backup Tables, Audit &amp; Snapshots, Migrations, Performance, Cron Notifications.</li>
                <li><strong>Configuration:</strong> Export Config, Import Config, Run Notifications Cron.</li>
                <li><strong>Save config:</strong> Persists the currently edited JSON file to <code>includes/</code>. After a successful save a green status pill appears next to the button confirming which file was written. Error pills stay visible for 6 seconds so they are not missed.</li>
                <li><strong>Unsaved-changes guard:</strong> Tracks pending changes in config-editing tabs (Schema, Dashboard, Calendar, etc.) and shows a confirmation prompt before discarding them. Tabs that save immediately via API (Users, Database, Health, Backup) never trigger this warning.</li>
                <li><strong>Debug FE mode:</strong> Toggle in the header. When enabled, the frontend exposes a <code>#debug</code> panel with raw payloads for schema/API responses — useful when building new tables or troubleshooting grids.</li>
                <li><strong>Docs icon (book):</strong> Opens this documentation page.</li>
            </ul>

            <h3 id="doc-1" style="color: #2563eb; margin-top: 30px;">1. Technical Requirements &amp; Database Structure</h3>
            <p>Before configuring OpenSparrow, make sure your PostgreSQL database meets these core requirements:</p>
            <ul style="padding-left: 20px;">
                <li><strong>Primary keys (mandatory):</strong> Every table <strong>must</strong> have a primary key column named <code>id</code> (typically <code>SERIAL</code> or <code>BIGSERIAL</code>). OpenSparrow relies on this exact column name to edit, delete, and view specific records.</li>
                <li><strong>Foreign keys (relationships):</strong> Use standard PostgreSQL foreign keys to link tables. The UI detects them automatically. Recommended naming convention: <code>table_name_id</code> (e.g. <code>company_id</code>).</li>
                <li><strong>ENUM types:</strong> Custom PostgreSQL ENUM types are fully supported and rendered as <code>&lt;select&gt;</code> menus in the frontend.</li>
                <li><strong>Boolean types:</strong> Boolean columns render as switch toggles in edit forms and as dropdown filters in data grids.</li>
                <li><strong>System schema:</strong> OpenSparrow stores its internal tables (<code>spw_*</code>) in a dedicated PostgreSQL schema (default: <code>app</code>). The schema is resolved in this order: <code>schema</code> key in <code>config/database.json</code>, then the <code>PGSCHEMA</code> environment variable, then the <code>app</code> fallback.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">System tables (<code>spw_*</code> prefix)</h4>
            <p>OpenSparrow reserves a small set of internal tables, all prefixed with <code>spw_</code> and created inside the configured system schema:</p>
            <ul style="padding-left: 20px;">
                <li><code>spw_users</code> — frontend user accounts (id, username, password hash, role, active flag).</li>
                <li><code>spw_users_log</code> — audit trail of user actions (LOGIN, LOGOUT, CRUD operations).</li>
                <li><code>spw_users_notifications</code> — per-user in-app notifications, produced by the cron runner.</li>
                <li><code>spw_users_notifications_log</code> — execution log for the notifications cron: start/end time, status (<code>running</code> / <code>success</code> / <code>error</code>), trigger source (<code>cron</code> or <code>admin</code>), number of sources processed and notifications created, and error message on failure.</li>
                <li><code>spw_files</code> — metadata for files uploaded through the Files module.</li>
                <li><code>spw_login_attempts</code> — rolling log used by the DB-backed rate limiter on <code>login.php</code> (IP-hash and username counters).</li>
                <li><code>spw_comments</code> — user comments attached to any record. Each row links to a specific record via <code>related_table</code> + <code>related_id</code>, stores the author (<code>user_id</code>), body text (max 4000 chars), and a soft-delete timestamp.</li>
                <li><code>spw_record_snapshots</code> — JSONB snapshots of records captured after every INSERT or UPDATE. Each row is linked to the corresponding <code>spw_users_log</code> entry via <code>log_id</code> (CASCADE DELETE). Only active when the Record Snapshots module is enabled (see section 9b).</li>
                <li><code>spw_record_owners</code> — append-only ownership log. Each row records who owns a specific record (<code>table_name</code> + <code>record_id</code>) and who made the change (<code>changed_by</code>). The current owner is the row where <code>is_current = true</code>; all previous rows form the full ownership history. Created automatically on INSERT; reassignable by editors via the Record Owner panel in the edit view (see section 9c).</li>
                <li><code>spw_migrations</code> — migration tracker. One row per applied migration name + timestamp. Bootstrapped automatically by the first run of <em>Apply Pending Migrations</em>. Used by <em>System → Migrations</em> to determine which schema changes have already been applied.</li>
            </ul>
            <p style="background: #fef3c7; padding: 10px 14px; border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 14px;">
                <strong>Note:</strong> Tables starting with <code>spw_</code> are treated as system tables. They are <strong>filtered out</strong> from the <em>Sync DB Tables</em> list in the Schema tab and will not appear in your application schema, even if they live in the same PostgreSQL schema as your business tables.
            </p>

            <h3 id="doc-2" style="color: #2563eb; margin-top: 30px;">2. Schema &amp; Grid Configuration</h3>
            <p>The <strong>Schema</strong> tab is the core of your configuration. It maps your database tables to frontend grids and forms.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Add Table (Data Management → Add Table)</h4>
            <p>The dedicated <strong>Add Table</strong> tab creates a new physical PostgreSQL table and optionally registers it in <code>schema.json</code> — no manual sync step required.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Table Name &amp; Database Schema:</strong> Lowercase identifiers only. The <code>id serial PRIMARY KEY</code> column is always added automatically.</li>
                <li><strong>Display Name:</strong> Auto-filled from the table name (underscores → spaces, title-case). Used as the label in menus and headings when registered in <code>schema.json</code>.</li>
                <li><strong>Column Presets:</strong> Check <em>Timestamps</em> to automatically add <code>created_at</code> and <code>updated_at</code> columns (<code>timestamp DEFAULT now() NOT NULL</code>).</li>
                <li><strong>Per-column options</strong> — each column block exposes:
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        <li><strong>Name &amp; Type:</strong> <code>varchar(255)</code>, <code>text</code>, <code>int4</code>, <code>int8</code>, <code>boolean</code>, <code>date</code>, <code>timestamp</code>.</li>
                        <li><strong>Not Null:</strong> Adds a <code>NOT NULL</code> constraint. Requires a Default value if the table already has rows.</li>
                        <li><strong>Default:</strong> Accepts safe SQL expressions (<code>now()</code>, <code>current_timestamp</code>, <code>true</code>, <code>false</code>, <code>null</code>), plain integers, or arbitrary strings (escaped as a literal).</li>
                        <li><strong>Index:</strong> <code>btree</code> (standard equality/range), <code>hash</code> (equality only), or <code>unique</code> (enforces uniqueness). Creates a <code>idx_tablename_colname</code> index.</li>
                        <li><strong>Comment:</strong> Stored as <code>COMMENT ON COLUMN</code> in PostgreSQL. Visible via <em>Sync Columns from DB</em> and as a tooltip in the grid.</li>
                        <li><strong>Foreign Key:</strong> Adds an <code>FK</code> constraint referencing any table and column already registered in <code>schema.json</code>.</li>
                    </ul>
                </li>
                <li><strong>Register in schema.json</strong> (checked by default): After the table and all columns are created in the database, the table entry — including display name, column types, NOT NULL flags, and FK references — is written to <code>config/schema.json</code> automatically.</li>
            </ul>

            <ul style="padding-left: 20px;">
                <li><strong>Add new columns (Schema tab):</strong> Inside an existing table's configuration, click <em>+ Add Column</em> to append a physical column to the database.</li>
                <li><strong>Sync DB Tables:</strong> Fetches all tables from the connected database and merges them into your schema configuration. System tables with the <code>spw_</code> prefix are skipped automatically.</li>
                <li><strong>Sync Columns from DB:</strong> Inside a table's configuration, fetches all columns for that table and adds any that are missing. Also reads PostgreSQL <code>COMMENT ON COLUMN</code> values for descriptions.</li>
                <li><strong>Column Description (tooltip):</strong> Appears as a native browser tooltip when hovering over column headers in the data grid.</li>
                <li><strong>Live sidebar preview:</strong> Updates in real time when editing Display Name, Icon, or Hide flag.</li>
                <li><strong>Smart type mapping:</strong> Native PostgreSQL types are mapped to clean frontend types (Text, Number, Date, Boolean, Enum).</li>
                <li><strong>Remove tables:</strong> Removes a table from JSON configuration only — does not drop the physical table.</li>
                <li><strong>Foreign-key search &amp; display:</strong> Assign multiple display columns to a foreign key. The frontend renders them as searchable inputs.</li>
                <li><strong>Visibility &amp; ordering:</strong> Toggle per-column visibility in the grid and reorder with Up/Down arrows.</li>
                <li><strong>Validation rules (regex):</strong> Enforce strict formats with regular expressions.
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        <li><strong>Email:</strong> <code>^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$</code></li>
                        <li><strong>Phone (9-15 digits, optional +):</strong> <code>^\\+?[0-9]{9,15}$</code></li>
                        <li><strong>Postal code (XX-XXX):</strong> <code>^[0-9]{2}-[0-9]{3}$</code></li>
                        <li><strong>URL (http/https):</strong> <code>^https?:\\/\\/.*$</code></li>
                        <li><strong>Username (3-16 chars):</strong> <code>^[a-zA-Z0-9_]{3,16}$</code></li>
                        <li><strong>Price / decimal:</strong> <code>^\\d+(\\.\\d{1,2})?$</code></li>
                        <li><strong>Date (YYYY-MM-DD):</strong> <code>^\\d{4}-\\d{2}-\\d{2}$</code></li>
                        <li><strong>Strong password:</strong> <code>^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$</code></li>
                    </ul>
                </li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Subtables (one-to-many relationships)</h4>
            <p><strong>+ Add Subtable</strong> displays related child records inside the parent record's detail view.</p>
            <ul style="padding-left: 20px;">
                <li>Open the Schema editor of the parent table and click <em>+ Add Subtable</em>.</li>
                <li><strong>Target table:</strong> the child table to display.</li>
                <li><strong>Foreign-key column:</strong> the column in the child table referencing the parent's <code>id</code>.</li>
            </ul>

            <h3 id="doc-3" style="color: #2563eb; margin-top: 30px;">3. Dashboard Builder</h3>
            <p>The <strong>Dashboard</strong> tab composes analytical views. The layout uses a fixed <strong>3-column grid</strong>; each widget occupies 1, 2, or 3 columns.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Widget types</h4>
            <ul style="padding-left: 20px;">
                <li><strong>Stat Card:</strong> Colored tile showing the total row count of a selected table.</li>
                <li><strong>KPI Card:</strong> Single aggregate number (COUNT, SUM, or AVG) with an optional icon.</li>
                <li><strong>Bar Chart (Horizontal / Vertical):</strong> Groups rows by a chosen column. Each bar is clickable.</li>
                <li><strong>Pie Chart:</strong> Same group/aggregate model, rendered as a conic-gradient pie. Each slice is clickable.</li>
                <li><strong>Data List:</strong> Top-N rows ordered by a selected column.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Widget proportions</h4>
            <ul style="padding-left: 20px;">
                <li><strong>Width:</strong> <code>1/3</code>, <code>2/3</code>, or <code>3/3 (full)</code>.</li>
                <li><strong>Height:</strong> Small (140 px), Medium (280 px), Large (440 px).</li>
            </ul>
            <p>On mobile screens all widgets collapse to a single column.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Filter Conditions (WHERE)</h4>
            <p>Every widget supports structured filter conditions combined with AND/OR. Column names are validated against the schema; values are escaped.</p>
            <ul style="padding-left: 20px;">
                <li>Available operators: <code>=</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>, <code>LIKE</code>, <code>ILIKE</code>, <code>IS NULL</code>, <code>IS NOT NULL</code>.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Live Preview</h4>
            <p>A <strong>Live Preview</strong> panel renders the actual widget with sample data and updates automatically. Uses fixed mock data — no database connection required.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Global settings</h4>
            <p>Controls dashboard menu entry and grid gap. Defaults to <code>20px</code>.</p>

            <h3 id="doc-4" style="color: #2563eb; margin-top: 30px;">4. Calendar Module</h3>
            <p>The <strong>Calendar</strong> tab binds date columns from your database to a visual calendar.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Data sources:</strong> Overlay multiple tables on a single calendar.</li>
                <li><strong>Color coding:</strong> Assign a color per source.</li>
                <li><strong>Row context:</strong> The full database row is attached to each calendar event.</li>
            </ul>

            <h3 id="doc-5" style="color: #2563eb; margin-top: 30px;">5. Workflows Builder</h3>
            <p>The <strong>Workflows</strong> tab composes multi-step wizards guiding users through structured data entry across related tables.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Steps setup:</strong> Add sequential steps and select a target table per step.</li>
                <li><strong>Relational linking:</strong> Link child records to parents by selecting the foreign-key column.</li>
                <li><strong>Multiple records:</strong> Enable <em>Allow adding multiple records</em> per step.</li>
            </ul>

            <h3 id="doc-6" style="color: #2563eb; margin-top: 30px;">6. Users Management</h3>
            <p>The <strong>Users</strong> tab (<em>System → Users</em>) manages all accounts.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Roles:</strong>
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        <li><strong>Admin</strong> — access to this admin panel only. Cannot log in to the frontend.</li>
                        <li><strong>Editor</strong> — full CRUD access to the frontend. Cannot access the admin panel.</li>
                        <li><strong>Viewer</strong> — read-only access to the frontend. Cannot access the admin panel.</li>
                    </ul>
                </li>
                <li><strong>Change password:</strong> Own account requires current password. Other accounts: admin override, no current password needed.</li>
                <li><strong>Active status:</strong> Toggle Active / Inactive to revoke or restore login access.</li>
            </ul>

            <h3 id="doc-7" style="color: #2563eb; margin-top: 30px;">7. Database Configuration</h3>
            <p>Manage the core PostgreSQL connection from <strong>System → Database</strong>.</p>
            <ul style="padding-left: 20px;">
                <li><strong>System Schema:</strong> Sets the PostgreSQL schema used for all <code>spw_*</code> tables. Defaults to <code>app</code>.</li>
                <li><strong>Test Saved Connection:</strong> Always click <em>Save config</em> first — the test reads persisted <code>database.json</code>, not in-form values.</li>
                <li><strong>Login protection:</strong> DB-backed rate limiter, CSRF tokens, session fingerprinting, 8-hour session lifetime, <code>SameSite=Lax</code> / <code>HttpOnly</code> cookies.</li>
            </ul>

            <h3 id="doc-8" style="color: #2563eb; margin-top: 30px;">8. Backup Tables</h3>
            <p><strong>System → Backup Tables</strong> creates timestamped copies of selected tables directly in PostgreSQL.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Backup name format:</strong> <code>YYYYMMDDHHII_tablename</code>.</li>
                <li><strong>What is copied:</strong> Column structure and all data rows. Indexes and constraints are <strong>not</strong> copied.</li>
            </ul>

            <h3 id="doc-9" style="color: #2563eb; margin-top: 30px;">9. System Health, Cron &amp; Config</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Database Migrations:</strong> <em>System → Migrations</em>. Click <strong>Apply Pending Migrations</strong> to run all unapplied schema changes.</li>
                <li><strong>System diagnostics:</strong> Live checks for PHP version, extensions, write permissions, and DB connectivity.</li>
                <li><strong>Run Notifications Cron:</strong> Executes <code>cron/cron_notifications.php</code> ad-hoc. Each run is recorded in <code>spw_users_notifications_log</code>.</li>
                <li><strong>Export / Import config:</strong> Downloads or uploads a ZIP of all JSON settings.</li>
            </ul>

            <h3 id="doc-9b" style="color: #2563eb; margin-top: 30px;">9b. Audit &amp; Record Snapshots</h3>
            <p><strong>System → Audit &amp; Snapshots</strong> controls the record snapshot module — captures full record state after every write.</p>
            <ul style="padding-left: 20px;">
                <li><strong>How it works:</strong> Every INSERT and UPDATE saves a JSONB copy to <code>spw_record_snapshots</code>, linked to <code>spw_users_log</code> via <code>log_id</code>.</li>
                <li><strong>Toggle:</strong> Writes to <code>config/settings.json</code>. Takes effect on the next request. Overridden by <code>RECORD_SNAPSHOTS_ENABLED</code> env var.</li>
                <li><strong>Storage growth:</strong> Monitor table size and implement a retention policy for high-volume installations.</li>
            </ul>

            <h3 id="doc-9c" style="color: #2563eb; margin-top: 30px;">9c. Database Migrations</h3>
            <p><strong>System → Migrations</strong> applies and tracks all schema changes to <code>spw_*</code> system tables.</p>
            <ul style="padding-left: 20px;">
                <li>Applied migrations are recorded in <code>spw_migrations</code>. Re-running is always safe.</li>
                <li><strong>Adding migrations (developers):</strong> Append to the <code>$migrations</code> array in <code>admin/api.php</code> <code>init_db</code>. Never modify existing entries.</li>
            </ul>

            <h3 id="doc-9d" style="color: #2563eb; margin-top: 30px;">9d. Record Ownership</h3>
            <p>Every record can have an <strong>owner</strong> tracked in <code>spw_record_owners</code>.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Auto-assignment:</strong> Creator is automatically set as owner on INSERT.</li>
                <li><strong>Changing the owner:</strong> Editor/Admin role: select user and click <em>Change Owner</em> in the Record History tab.</li>
                <li><strong>Full history:</strong> Every change appends a row. No data is deleted.</li>
            </ul>

            <h3 id="doc-9e" style="color: #2563eb; margin-top: 30px;">9e. Grid Default Sort &amp; Load Limit</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Default Sort Order:</strong> One or more sort rules (column + ASC/DESC). Fallback is <code>id DESC</code>.</li>
                <li><strong>Initial Load Limit:</strong> Max rows on first load. <code>0</code> means unlimited.</li>
                <li><strong>Stored in:</strong> <code>config/schema.json</code> as <code>"default_sort"</code> and <code>"initial_limit"</code>.</li>
            </ul>

            <h3 id="doc-9f" style="color: #2563eb; margin-top: 30px;">9f. Grid Drilldown — Quick Add</h3>
            <p>Subtable block headers show a <strong>+</strong> button that navigates to <code>create.php</code> pre-filling the foreign key. Visible to Editor and Admin only.</p>

            <h3 id="doc-9f2" style="color: #2563eb; margin-top: 30px;">9f2. Grid Action Buttons</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Edit</strong> — <code>edit_square.png</code> icon, navigates to <code>edit.php</code>.</li>
                <li><strong>Delete</strong> — <code>delete.png</code> icon (red hover), requires confirmation.</li>
                <li>Only visible to <strong>Editor</strong> role.</li>
            </ul>

            <h3 id="doc-9g" style="color: #2563eb; margin-top: 30px;">9g. Performance Tab</h3>
            <p><strong>Admin → System → Performance</strong> — read-only diagnostic panel with six independent sections.</p>
            <ul style="padding-left: 20px;">
                <li><strong>1. Missing Index Advisor:</strong> Finds columns lacking indexes. Generates ready-to-run <code>CREATE INDEX</code> SQL.</li>
                <li><strong>2. Unused Indexes:</strong> Queries indexes with <code>idx_scan = 0</code>. Generates <code>DROP INDEX</code> SQL.</li>
                <li><strong>3. Slow Query Analyzer:</strong> Reads <code>pg_stat_statements</code>. Highlights queries over 100 ms / 500 ms.</li>
                <li><strong>4. Table Statistics &amp; Bloat:</strong> Dead rows, bloat %, scan counts, last vacuum timestamps.</li>
                <li><strong>5. Database Health:</strong> Cache hit ratio, connections, deadlocks, DB size, PG version.</li>
                <li><strong>6. Schema Configuration Warnings:</strong> Flags tables &gt;20 columns, missing limits, missing sort, subtables without columns_to_show.</li>
            </ul>

            <h3 id="doc-9h" style="color: #2563eb; margin-top: 30px;">9h. Cron Notifications Tab</h3>
            <p><strong>Admin → System → Cron Notifications</strong> — five-section management interface for the notification cron.</p>
            <ul style="padding-left: 20px;">
                <li><strong>1. Manual Run:</strong> Execute <code>cron_notifications.php</code> immediately.</li>
                <li><strong>2. Run History:</strong> Last 50 entries from <code>spw_users_notifications_log</code>.</li>
                <li><strong>3. Notification Stats:</strong> Total, unread, due today, upcoming. Top 10 users by unread count.</li>
                <li><strong>4. Cron Setup:</strong> Ready-to-copy commands for Linux/macOS, Windows Task Scheduler, Docker.</li>
                <li><strong>5. Log Cleanup:</strong> Purge <code>spw_users_notifications_log</code> rows older than N days.</li>
            </ul>

            <h3 id="doc-9i" style="color: #2563eb; margin-top: 30px;">9i. Grid Page Size</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Admin default:</strong> Schema tab → <em>Global Grid Settings</em> → <em>Default Page Size</em> (10 / 25 / 50 / 100).</li>
                <li><strong>User override:</strong> <em>Rows per page</em> selector in the pagination bar, saved to <code>localStorage</code>.</li>
                <li><strong>Priority:</strong> <code>localStorage</code> → <code>schema.default_page_size</code> → fallback 25.</li>
            </ul>

            <h3 id="doc-9j" style="color: #2563eb; margin-top: 30px;">9j. Many-to-Many Relationships</h3>
            <p>M2M relationships link records across tables via a <strong>junction table</strong>. Rendered as a checkbox panel in edit/create forms.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #8b5cf6; padding-left: 15px;">How it works end-to-end</h4>
            <ol style="padding-left: 20px;">
                <li><strong>Create the junction table in PostgreSQL</strong> with two FK columns and a UNIQUE constraint.</li>
                <li><strong>Configure the relationship</strong>: Schema → parent table → <em>Many-to-Many Relationships</em> → <strong>+ Add Many-to-Many</strong>.</li>
                <li><strong>Save File</strong> — the checkbox panel appears automatically.</li>
            </ol>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #8b5cf6; padding-left: 15px;">Admin configuration fields</h4>
            <ul style="padding-left: 20px;">
                <li><strong>Display Label, Junction Table, Self FK, Other FK, Other Table, Display Column.</strong></li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #8b5cf6; padding-left: 15px;">Runtime behaviour</h4>
            <ul style="padding-left: 20px;">
                <li>On Save: all existing junction rows deleted and new rows inserted atomically in a single PostgreSQL transaction.</li>
                <li>Viewer role sees checkboxes in disabled state.</li>
            </ul>

            <h3 id="doc-9k" style="color: #2563eb; margin-top: 30px;">9k. Schema Map (ERD)</h3>
            <p><strong>Data Management → Schema Map</strong> renders an interactive ERD from <code>schema.json</code>. Uses force-directed auto-layout. No external libraries.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Connection types:</strong> FK (solid blue), Subtable (dashed green), M2M (dotted purple).</li>
                <li><strong>Controls:</strong> Pan, zoom, drag tables, click to highlight, search, show/hide hidden tables, Fit View, Export PNG.</li>
            </ul>

            <h3 id="doc-10" style="color: #2563eb; margin-top: 30px;">10. Files Module</h3>
            <p>Central repository for documents and media backed by <code>spw_files</code>.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Configuration:</strong> Max file size, allowed types, storage path (must not be web-accessible — downloads streamed through <code>file_download.php</code>).</li>
                <li><strong>Record relations:</strong> Optionally link uploads to specific rows in a target table.</li>
            </ul>

            <h3 id="doc-11" style="color: #2563eb; margin-top: 30px;">11. Menu Preview &amp; Navigation Editor</h3>
            <p>Renders the frontend sidebar and lets you rearrange or nest items by dragging. Every change is saved automatically.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Drag &amp; drop controls</h4>
            <ul style="padding-left: 20px;">
                <li><strong>Reorder:</strong> Drag above or below another item.</li>
                <li><strong>Nest:</strong> Drop onto the middle zone of a top-level item. Maximum depth: <strong>1 level</strong>.</li>
                <li><strong>Un-nest:</strong> Drag a child item to the top level.</li>
                <li><strong>Auto-save:</strong> Every drop triggers a save to <code>config/menu.json</code> after 350 ms debounce.</li>
            </ul>

            <h3 id="doc-11b" style="color: #2563eb; margin-top: 30px;">11b. Demo Systems (Quick-Start Templates)</h3>
            <p><strong>System → Demo Systems</strong> provides three pre-built demo applications: CRM, WMS, and Task Management.</p>
            <ul style="padding-left: 20px;">
                <li><strong>What gets installed:</strong> PostgreSQL schema, seed data, schema.json entries, dashboard widgets, calendar sources, workflows, SQL views.</li>
                <li><strong>Safety:</strong> Both install and uninstall require typing <code>CONFIRM</code>.</li>
                <li><strong>Cleanup on uninstall:</strong> Demo schema dropped (CASCADE). Config files cleaned if they contain only demo content.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Demo 1: CRM</h4>
            <p>Companies, contacts, deals, quotes, invoices, assets, activities. FK subtables, deal stage color coding, revenue drill-down by year → month.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Demo 2: WMS (Warehouse Management)</h4>
            <p>Warehouses, suppliers, products, batches, stock, purchase orders, customer orders, shipments. FIFO/FEFO batch tracking, expiry alerts, low-stock views, 3 workflows.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Demo 3: Task Management</h4>
            <p>Projects, team members, milestones, tasks, time logs. Sprint planning, workload view, time budget variance (logged vs estimated hours), drill-down summary view.</p>

            <h3 id="doc-13" style="color: #2563eb; margin-top: 30px;">13. Multilingual / i18n Module</h3>
            <p>OpenSparrow supports multiple UI languages via flat JSON translation files. The active language is resolved per session; both PHP templates and all JS modules share the same bundle.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Configuration — settings.json</h4>
            <ul style="padding-left: 20px;">
                <li><code>"default_language": "pl"</code> — locale used when no session preference is stored.</li>
                <li><code>"available_languages": ["en", "pl"]</code> — enables the language switcher; lists accepted locale codes.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Translation files</h4>
            <p>Each locale has one file: <code>languages/{locale}.json</code> (e.g. <code>languages/pl.json</code>). Structure:</p>
            <ul style="padding-left: 20px;">
                <li>Top-level keys are namespaces: <code>common</code>, <code>grid</code>, <code>form</code>, <code>auth</code>, <code>header</code>, <code>admin</code>, <code>pagination</code>, <code>filter</code>, <code>files</code>, <code>notifications</code>, <code>dashboard</code>, <code>workflow</code>, <code>comments</code>, <code>owners</code>, <code>views</code>, <code>calendar</code>.</li>
                <li>Plural values are objects: <code>{"one": "...", "few": "...", "many": "..."}</code> for Polish; <code>{"one": "...", "other": "..."}</code> for English.</li>
                <li>Variable placeholders use <code>{name}</code> syntax: e.g. <code>"showing": "Showing {from}–{to} of {total} records"</code>.</li>
                <li><strong>Critical:</strong> All double-quote characters inside JSON string values must be escaped as <code>\"</code>. An unescaped <code>"</code> silently breaks <code>json_decode</code>, causing the entire locale to fall back to English with no error shown.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">PHP API</h4>
            <ul style="padding-left: 20px;">
                <li><code>includes/i18n.php</code> — loaded via <code>includes/session.php</code>, available everywhere.</li>
                <li><code>I18n::locale()</code> — returns active locale string (e.g. <code>'pl'</code>). Use in <code>&lt;html lang="..."&gt;</code>.</li>
                <li><code>t($key, $vars = [], $count = null)</code> — translates a dot-notation key; replaces <code>{name}</code> placeholders; selects plural form when <code>$count</code> is provided.</li>
                <li>Bundle served to JS via <code>api.php?action=i18n_bundle</code> as a flat key→value JSON object.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">JavaScript API</h4>
            <ul style="padding-left: 20px;">
                <li><code>assets/js/i18n.js</code> — ES module singleton. Import: <code>import { I18n } from './i18n.js';</code></li>
                <li>Always call <code>await I18n.load()</code> before rendering any translated text — widgets that render before <code>load()</code> resolves will show raw key strings.</li>
                <li><code>I18n.t('common.save')</code> — basic lookup.</li>
                <li><code>I18n.t('grid.showing', { from: 1, to: 10, total: 42 })</code> — with variable substitution.</li>
                <li><code>I18n.t('files.count', { count: 3 }, 3)</code> — with plural selection.</li>
                <li>Build DOM nodes with <code>el.textContent = I18n.t(...)</code> — never inject translations via <code>innerHTML</code>.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Adding a new language</h4>
            <ol style="padding-left: 20px;">
                <li>Copy <code>languages/en.json</code> → <code>languages/{locale}.json</code>.</li>
                <li>Translate all values; update plural forms to match the target language rules.</li>
                <li>Add the locale code to <code>"available_languages"</code> in <code>config/settings.json</code>.</li>
                <li>Validate JSON before deploying: <code>node -e "JSON.parse(require('fs').readFileSync('languages/{locale}.json','utf8'))"</code>.</li>
            </ol>

            <h3 id="doc-12" style="color: #2563eb; margin-top: 30px;">12. Deployment Notes</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Deny public access to <code>config/</code>:</strong> An <code>.htaccess</code> rule is included by default.</li>
                <li><strong>Storage permissions:</strong> <code>config/</code> and <code>storage/</code> must be writable by the web-server user.</li>
                <li><strong>Backups:</strong> Export config ZIP before every upgrade and keep regular <code>pg_dump</code> snapshots.</li>
                <li><strong>Demo mode:</strong> Set <code>DEMO_MODE=true</code> to block all write operations in the admin API.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Environment variables</h4>
            <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:10px;">
                <thead><tr style="background:#f1f5f9;">
                    <th style="text-align:left;padding:6px 10px;border:1px solid #e2e8f0;">Variable</th>
                    <th style="text-align:left;padding:6px 10px;border:1px solid #e2e8f0;">Default</th>
                    <th style="text-align:left;padding:6px 10px;border:1px solid #e2e8f0;">Description</th>
                </tr></thead>
                <tbody>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>APP_ENV</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>production</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Runtime environment.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>DB_HOST</code> / <code>PGHOST</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>localhost</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">PostgreSQL host.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>DB_PORT</code> / <code>PGPORT</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>5432</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">PostgreSQL port.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>APP_TIMEZONE</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>Europe/Warsaw</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">IANA timezone for every PostgreSQL session.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>SECURE_COOKIES</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>true</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Set <code>false</code> on plain HTTP.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>SESSION_MAX_LIFETIME</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>28800</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Hard session expiry in seconds (8 h).</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>IP_HASH_SALT</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><em>none</em></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><strong>Required in production.</strong> HMAC secret for IP pseudonymisation.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>LOGIN_MAX_ATTEMPTS_PER_IP</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>20</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Failed login threshold per IP.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>LOGIN_MAX_ATTEMPTS_PER_USERNAME</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>5</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Failed login threshold per username.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>LOGIN_LOCKOUT_MINUTES</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>15</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Lockout window in minutes.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>DEMO_MODE</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>false</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Block all write operations in admin API.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>FILES_MAX_SIZE_MB</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>20</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Default upload size limit.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>RECORD_SNAPSHOTS_ENABLED</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>false</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Enable record snapshots system-wide.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>PGSCHEMA</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>app</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Schema for <code>spw_*</code> tables.</td></tr>
                </tbody>
            </table>
        </div>
    `;
}

function getContentPl() {
    return `
        <div>
            <h2 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0; color: #0f172a;">
                OpenSparrow - Dokumentacja Panelu Administracyjnego
            </h2>
            <p style="font-size: 15px; color: #64748b; margin-bottom: 30px;">
                Konfiguruj aplikację frontendową, zarządzaj połączeniami z bazą danych oraz buduj dynamiczne dashboardy, kalendarze i przepływy pracy — bez pisania ani jednej linii kodu.
            </p>

            <h3 id="doc-0" style="color: #2563eb; margin-top: 30px;">0. Pierwsze uruchomienie</h3>
            <p style="background:#fef3c7;padding:10px 14px;border-left:3px solid #f59e0b;border-radius:4px;font-size:14px;">
                <strong>Świeża instalacja?</strong> Panel administracyjny automatycznie wykrywa brak konfiguracji bazy danych (brak połączenia lub tabeli <code>spw_users</code>) i otwiera się bez wymagania logowania. Wykonaj następujące kroki:
            </p>
            <ol style="padding-left: 20px;">
                <li>Otwórz <code>/admin</code> w przeglądarce — panel uruchamia się w trybie konfiguracji z żółtym banerem.</li>
                <li>Przejdź do <strong>System → Baza danych</strong>, wprowadź host, port, nazwę bazy, użytkownika i hasło, a następnie kliknij <strong>Zapisz konfigurację</strong>.</li>
                <li>Przejdź do <strong>System → Migracje</strong> i kliknij <strong>Zastosuj oczekujące migracje</strong>. Spowoduje to utworzenie wszystkich tabel <code>spw_*</code> oraz dodanie domyślnego konta admina: login <code>admin</code>, hasło <code>admin</code>.</li>
                <li>Przejdź do <code>/login</code>, zaloguj się jako <code>admin</code> / <code>admin</code>. Zostaniesz automatycznie przekierowany do <code>/admin</code>.</li>
                <li>Przejdź do <strong>System → Użytkownicy</strong>, znajdź wiersz <em>admin</em> i kliknij <strong>Zmień hasło</strong>. Wprowadź aktualne hasło (<code>admin</code>) i ustaw silne nowe hasło.</li>
            </ol>
            <p>Od tego momentu panel administracyjny wymaga aktywnej sesji — możliwość obejścia logowania jest trwale zamknięta po utworzeniu tabeli <code>spw_users</code> w bazie danych.</p>

            <h3 id="doc-0b" style="color: #2563eb; margin-top: 30px;">0b. Układ panelu administracyjnego</h3>
            <p>Panel administracyjny korzysta ze zwijanego lewego paska bocznego z czterema sekcjami.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Zarządzanie danymi:</strong> Schemat, Dashboard, Kalendarz, Pliki, Podgląd menu, Dodaj tabelę.</li>
                <li><strong>Przepływy pracy:</strong> Menedżer przepływów.</li>
                <li><strong>System:</strong> Baza danych, Użytkownicy, Diagnostyka, Kopie zapasowe, Audyt i migawki, Migracje, Wydajność, Cron powiadomień.</li>
                <li><strong>Konfiguracja:</strong> Eksport konfiguracji, Import konfiguracji, Uruchom cron powiadomień.</li>
                <li><strong>Zapisz konfigurację:</strong> Zapisuje aktualnie edytowany plik JSON. Po zapisie pojawia się zielona pigułka potwierdzająca, który plik został zapisany.</li>
                <li><strong>Ochrona przed niezapisanymi zmianami:</strong> Wyświetla monit przed odrzuceniem zmian w zakładkach konfiguracyjnych.</li>
                <li><strong>Tryb Debug FE:</strong> Przełącznik w nagłówku. Po włączeniu udostępnia panel <code>#debug</code> z nieprzetworzonymi danymi odpowiedzi API.</li>
                <li><strong>Ikona dokumentacji (książka):</strong> Otwiera tę stronę dokumentacji.</li>
            </ul>

            <h3 id="doc-1" style="color: #2563eb; margin-top: 30px;">1. Wymagania techniczne i struktura bazy danych</h3>
            <p>Przed konfiguracją OpenSparrow upewnij się, że baza PostgreSQL spełnia następujące wymagania:</p>
            <ul style="padding-left: 20px;">
                <li><strong>Klucze główne (obowiązkowe):</strong> Każda tabela <strong>musi</strong> mieć kolumnę klucza głównego o nazwie <code>id</code> (zazwyczaj <code>SERIAL</code> lub <code>BIGSERIAL</code>). OpenSparrow opiera się na tej dokładnej nazwie do edycji, usuwania i wyświetlania rekordów.</li>
                <li><strong>Klucze obce (relacje):</strong> Używaj standardowych kluczy obcych PostgreSQL do łączenia tabel. Interfejs wykrywa je automatycznie. Zalecana konwencja nazewnictwa: <code>nazwa_tabeli_id</code> (np. <code>firma_id</code>).</li>
                <li><strong>Typy ENUM:</strong> Niestandardowe typy ENUM PostgreSQL są w pełni obsługiwane i renderowane jako menu <code>&lt;select&gt;</code>.</li>
                <li><strong>Typy Boolean:</strong> Kolumny logiczne renderowane są jako przełączniki w formularzach edycji i jako filtry rozwijane w siatkach danych.</li>
                <li><strong>Schemat systemowy:</strong> OpenSparrow przechowuje swoje wewnętrzne tabele (<code>spw_*</code>) w dedykowanym schemacie PostgreSQL (domyślnie: <code>app</code>).</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Tabele systemowe (prefiks <code>spw_*</code>)</h4>
            <ul style="padding-left: 20px;">
                <li><code>spw_users</code> — konta użytkowników frontendowych (id, nazwa, hash hasła, rola, flaga aktywności).</li>
                <li><code>spw_users_log</code> — ślad audytu akcji użytkowników (LOGIN, LOGOUT, operacje CRUD).</li>
                <li><code>spw_users_notifications</code> — powiadomienia w aplikacji dla każdego użytkownika, generowane przez cron.</li>
                <li><code>spw_users_notifications_log</code> — dziennik wykonania crona powiadomień: czas start/koniec, status, źródło wyzwolenia, liczba przetworzonych źródeł i utworzonych powiadomień.</li>
                <li><code>spw_files</code> — metadane plików przesłanych przez moduł Pliki.</li>
                <li><code>spw_login_attempts</code> — dziennik prób logowania używany przez ogranicznik częstotliwości.</li>
                <li><code>spw_comments</code> — komentarze użytkowników dołączone do dowolnego rekordu.</li>
                <li><code>spw_record_snapshots</code> — migawki JSONB rekordów przechwytywane po każdym INSERT lub UPDATE.</li>
                <li><code>spw_record_owners</code> — dziennik własności rekordów (append-only). Bieżący właściciel to wiersz z <code>is_current = true</code>.</li>
                <li><code>spw_migrations</code> — śledzenie migracji. Jeden wiersz na zastosowaną migrację.</li>
            </ul>
            <p style="background: #fef3c7; padding: 10px 14px; border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 14px;">
                <strong>Uwaga:</strong> Tabele zaczynające się od <code>spw_</code> są traktowane jako tabele systemowe i są <strong>pomijane</strong> na liście <em>Synchronizuj tabele z bazy danych</em>.
            </p>

            <h3 id="doc-2" style="color: #2563eb; margin-top: 30px;">2. Konfiguracja schematu i siatki</h3>
            <p>Zakładka <strong>Schemat</strong> to rdzeń konfiguracji — mapuje tabele bazy danych na siatki i formularze frontendowe.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Dodaj tabelę (Zarządzanie danymi → Dodaj tabelę)</h4>
            <p>Dedykowana zakładka <strong>Dodaj tabelę</strong> tworzy nową fizyczną tabelę PostgreSQL i opcjonalnie rejestruje ją w <code>schema.json</code>.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Nazwa tabeli i schemat bazy danych:</strong> Tylko małe litery. Kolumna <code>id serial PRIMARY KEY</code> jest zawsze dodawana automatycznie.</li>
                <li><strong>Opcje kolumn:</strong> Nazwa i typ, Not Null, Wartość domyślna, Indeks (<code>btree</code>, <code>hash</code>, <code>unique</code>), Komentarz, Klucz obcy.</li>
                <li><strong>Zarejestruj w schema.json</strong> (domyślnie zaznaczone): Wpis tabeli jest automatycznie zapisywany do <code>config/schema.json</code>.</li>
            </ul>

            <ul style="padding-left: 20px;">
                <li><strong>Dodaj nowe kolumny (zakładka Schemat):</strong> Kliknij <em>+ Dodaj kolumnę</em> wewnątrz konfiguracji istniejącej tabeli.</li>
                <li><strong>Synchronizuj tabele z bazy danych:</strong> Pobiera wszystkie tabele z podłączonej bazy i scala je z konfiguracją schematu.</li>
                <li><strong>Synchronizuj kolumny z bazy danych:</strong> Pobiera kolumny dla danej tabeli i dodaje brakujące. Odczytuje też komentarze <code>COMMENT ON COLUMN</code>.</li>
                <li><strong>Opis kolumny (tooltip):</strong> Pojawia się jako podpowiedź przy nagłówkach kolumn w siatce danych.</li>
                <li><strong>Podgląd paska bocznego na żywo:</strong> Aktualizuje się w czasie rzeczywistym podczas edycji Nazwy wyświetlanej, Ikony lub flagi Ukryj.</li>
                <li><strong>Inteligentne mapowanie typów:</strong> Typy PostgreSQL są automatycznie mapowane na typy frontendowe (Tekst, Liczba, Data, Boolean, Enum).</li>
                <li><strong>Usuń tabele:</strong> Usuwa tabelę tylko z konfiguracji JSON — nie usuwa fizycznej tabeli z PostgreSQL.</li>
                <li><strong>Wyszukiwanie i wyświetlanie klucza obcego:</strong> Przypisz wiele kolumn wyświetlanych do klucza obcego. Frontend renderuje je jako pola wyszukiwania.</li>
                <li><strong>Reguły walidacji (regex):</strong> Wymuszaj ścisłe formaty za pomocą wyrażeń regularnych.
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        <li><strong>Email:</strong> <code>^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$</code></li>
                        <li><strong>Telefon (9-15 cyfr, opcjonalny +):</strong> <code>^\\+?[0-9]{9,15}$</code></li>
                        <li><strong>Kod pocztowy (XX-XXX):</strong> <code>^[0-9]{2}-[0-9]{3}$</code></li>
                        <li><strong>URL (http/https):</strong> <code>^https?:\\/\\/.*$</code></li>
                        <li><strong>Nazwa użytkownika (3-16 znaków):</strong> <code>^[a-zA-Z0-9_]{3,16}$</code></li>
                        <li><strong>Cena / dziesiętna:</strong> <code>^\\d+(\\.\\d{1,2})?$</code></li>
                        <li><strong>Data (RRRR-MM-DD):</strong> <code>^\\d{4}-\\d{2}-\\d{2}$</code></li>
                        <li><strong>Silne hasło:</strong> <code>^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$</code></li>
                    </ul>
                </li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Podtabele (relacje jeden-do-wielu)</h4>
            <p><strong>+ Dodaj podtabelę</strong> wyświetla powiązane rekordy podrzędne wewnątrz widoku szczegółowego rekordu nadrzędnego.</p>
            <ul style="padding-left: 20px;">
                <li>Otwórz edytor schematu tabeli nadrzędnej i kliknij <em>+ Dodaj podtabelę</em>.</li>
                <li><strong>Tabela docelowa:</strong> tabela podrzędna do wyświetlenia.</li>
                <li><strong>Kolumna klucza obcego:</strong> kolumna w tabeli podrzędnej odwołująca się do <code>id</code> tabeli nadrzędnej.</li>
            </ul>

            <h3 id="doc-3" style="color: #2563eb; margin-top: 30px;">3. Kreator dashboardu</h3>
            <p>Zakładka <strong>Dashboard</strong> tworzy widoki analityczne z bazy danych. Układ używa stałej <strong>siatki 3-kolumnowej</strong>; każdy widget zajmuje 1, 2 lub 3 kolumny.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Typy widgetów</h4>
            <ul style="padding-left: 20px;">
                <li><strong>Kafelek statystyk (Stat Card):</strong> Kolorowy kafelek z łączną liczbą wierszy wybranej tabeli.</li>
                <li><strong>Karta KPI:</strong> Pojedyncza wartość agregatowa (COUNT, SUM lub AVG) z opcjonalną ikoną.</li>
                <li><strong>Wykres słupkowy (poziomy / pionowy):</strong> Grupuje wiersze według wybranej kolumny. Każdy słupek jest klikalny.</li>
                <li><strong>Wykres kołowy:</strong> Ten sam model grupowania/agregacji. Każdy wycinek jest klikalny.</li>
                <li><strong>Lista danych:</strong> Najlepsze N wierszy posortowane według wybranej kolumny.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Rozmiary widgetów</h4>
            <ul style="padding-left: 20px;">
                <li><strong>Szerokość:</strong> <code>1/3</code>, <code>2/3</code> lub <code>3/3 (pełna)</code>.</li>
                <li><strong>Wysokość:</strong> Mała (140 px), Średnia (280 px), Duża (440 px).</li>
            </ul>
            <p>Na urządzeniach mobilnych wszystkie widgety zwijają się do jednej kolumny.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Warunki filtrowania (WHERE)</h4>
            <p>Każdy widget obsługuje warunki filtrowania łączone operatorami AND/OR. Nazwy kolumn są weryfikowane względem schematu, a wartości są uciekane.</p>
            <ul style="padding-left: 20px;">
                <li>Dostępne operatory: <code>=</code>, <code>!=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>, <code>LIKE</code>, <code>ILIKE</code>, <code>IS NULL</code>, <code>IS NOT NULL</code>.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Podgląd na żywo</h4>
            <p>Panel <strong>Podgląd na żywo</strong> renderuje rzeczywisty widget z przykładowymi danymi i aktualizuje się automatycznie. Używa stałych danych testowych — nie wymaga połączenia z bazą danych.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Ustawienia globalne</h4>
            <p>Kontroluje pozycję dashboardu w menu i odstęp między widgetami. Domyślnie <code>20px</code>.</p>

            <h3 id="doc-4" style="color: #2563eb; margin-top: 30px;">4. Moduł kalendarza</h3>
            <p>Zakładka <strong>Kalendarz</strong> powiązuje kolumny dat z bazy danych z wizualnym kalendarzem.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Źródła danych:</strong> Nakładaj wiele tabel na jeden kalendarz.</li>
                <li><strong>Kodowanie kolorami:</strong> Przypisz kolor każdemu źródłu.</li>
                <li><strong>Kontekst wiersza:</strong> Pełny wiersz bazy danych jest dołączony do każdego zdarzenia kalendarza.</li>
            </ul>

            <h3 id="doc-5" style="color: #2563eb; margin-top: 30px;">5. Kreator przepływów pracy</h3>
            <p>Zakładka <strong>Przepływy pracy</strong> tworzy wieloetapowe kreatory prowadzące użytkowników przez ustrukturyzowane wprowadzanie danych w powiązanych tabelach.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Konfiguracja kroków:</strong> Dodawaj kolejne kroki i wybierz docelową tabelę dla każdego kroku.</li>
                <li><strong>Łączenie relacyjne:</strong> Powiąż rekordy podrzędne z nadrzędnymi przez wybór kolumny klucza obcego.</li>
                <li><strong>Wiele rekordów:</strong> Włącz <em>Zezwól na dodawanie wielu rekordów</em> dla wybranego kroku.</li>
            </ul>

            <h3 id="doc-6" style="color: #2563eb; margin-top: 30px;">6. Zarządzanie użytkownikami</h3>
            <p>Zakładka <strong>Użytkownicy</strong> (<em>System → Użytkownicy</em>) zarządza wszystkimi kontami.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Role:</strong>
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        <li><strong>Admin</strong> — dostęp tylko do panelu administracyjnego. Nie może logować się do aplikacji frontendowej.</li>
                        <li><strong>Edytor</strong> — pełny dostęp CRUD do aplikacji frontendowej. Nie ma dostępu do panelu administracyjnego.</li>
                        <li><strong>Przeglądający</strong> — dostęp tylko do odczytu frontendu. Nie może modyfikować rekordów ani uzyskać dostępu do panelu administracyjnego.</li>
                    </ul>
                </li>
                <li><strong>Zmiana hasła:</strong> Własne konto wymaga podania aktualnego hasła. Inne konta — bez aktualnego hasła (nadpisanie przez admina).</li>
                <li><strong>Status aktywności:</strong> Przełącz Aktywny / Nieaktywny, aby odwołać lub przywrócić dostęp do logowania.</li>
            </ul>

            <h3 id="doc-7" style="color: #2563eb; margin-top: 30px;">7. Konfiguracja bazy danych</h3>
            <p>Zarządzaj połączeniem PostgreSQL z <strong>System → Baza danych</strong>.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Schemat systemowy:</strong> Ustawia schemat PostgreSQL dla wszystkich tabel <code>spw_*</code>. Domyślnie <code>app</code>.</li>
                <li><strong>Testuj zapisane połączenie:</strong> Najpierw kliknij <em>Zapisz konfigurację</em> — test odczytuje zapisany <code>database.json</code>, nie wartości z formularza.</li>
                <li><strong>Ochrona logowania:</strong> Ogranicznik częstotliwości (IP + nazwa użytkownika), tokeny CSRF, odcisk palca sesji, 8-godzinny czas życia sesji, ciasteczka <code>SameSite=Lax</code> / <code>HttpOnly</code>.</li>
            </ul>

            <h3 id="doc-8" style="color: #2563eb; margin-top: 30px;">8. Kopie zapasowe tabel</h3>
            <p><strong>System → Kopie zapasowe tabel</strong> tworzy kopie wybranych tabel bezpośrednio w PostgreSQL.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Format nazwy kopii:</strong> <code>RRRRMMDDGGMM_nazwa_tabeli</code> — np. <code>202604211709_klienci</code>.</li>
                <li><strong>Co jest kopiowane:</strong> Struktura kolumn i wszystkie wiersze. Indeksy i ograniczenia <strong>nie</strong> są kopiowane.</li>
            </ul>

            <h3 id="doc-9" style="color: #2563eb; margin-top: 30px;">9. Diagnostyka systemu, Cron i konfiguracja</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Migracje bazy danych:</strong> <em>System → Migracje</em>. Kliknij <strong>Zastosuj oczekujące migracje</strong>.</li>
                <li><strong>Diagnostyka systemu:</strong> Bieżące sprawdzenie wersji PHP, rozszerzeń, uprawnień do zapisu i łączności z bazą danych.</li>
                <li><strong>Uruchom Cron powiadomień:</strong> Wykonuje <code>cron/cron_notifications.php</code> natychmiastowo. Każde uruchomienie jest rejestrowane w <code>spw_users_notifications_log</code>.</li>
                <li><strong>Eksport / Import konfiguracji:</strong> Pobiera lub przesyła plik ZIP ze wszystkimi ustawieniami JSON.</li>
            </ul>

            <h3 id="doc-9b" style="color: #2563eb; margin-top: 30px;">9b. Audyt i migawki rekordów</h3>
            <p><strong>System → Audyt i migawki</strong> steruje modułem migawek rekordów — przechwytuje pełny stan rekordu po każdej operacji zapisu.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Jak działa:</strong> Każdy INSERT i UPDATE zapisuje kopię JSONB do <code>spw_record_snapshots</code>, powiązaną z <code>spw_users_log</code> przez <code>log_id</code>.</li>
                <li><strong>Przełącznik:</strong> Zapisuje do <code>config/settings.json</code>. Wchodzi w życie przy następnym żądaniu. Nadpisywany przez zmienną środowiskową <code>RECORD_SNAPSHOTS_ENABLED</code>.</li>
                <li><strong>Wzrost przestrzeni dyskowej:</strong> Każda aktualizacja często zmienianej tabeli generuje wiersz. Monitoruj rozmiar tabeli i wdrożyj politykę przechowywania.</li>
            </ul>

            <h3 id="doc-9c" style="color: #2563eb; margin-top: 30px;">9c. Migracje bazy danych</h3>
            <p><strong>System → Migracje</strong> — jedyne miejsce do stosowania i śledzenia wszystkich zmian schematu tabel <code>spw_*</code>.</p>
            <ul style="padding-left: 20px;">
                <li>Zastosowane migracje są rejestrowane w <code>spw_migrations</code>. Ponowne uruchomienie jest zawsze bezpieczne.</li>
                <li><strong>Dodawanie migracji (deweloperzy):</strong> Dodaj nowy wpis do tablicy <code>$migrations</code> w <code>admin/api.php</code> <code>init_db</code>. Nigdy nie modyfikuj istniejących wpisów.</li>
            </ul>

            <h3 id="doc-9d" style="color: #2563eb; margin-top: 30px;">9d. Własność rekordów</h3>
            <p>Każdy rekord może mieć <strong>właściciela</strong> śledzonego w <code>spw_record_owners</code>.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Automatyczne przypisanie:</strong> Twórca rekordu jest automatycznie ustawiany jako właściciel przy INSERT.</li>
                <li><strong>Zmiana właściciela:</strong> Rola Edytora/Admina: wybierz użytkownika i kliknij <em>Zmień właściciela</em> w zakładce Historia rekordu.</li>
                <li><strong>Pełna historia:</strong> Każda zmiana dopisuje wiersz. Żadne dane nie są usuwane.</li>
            </ul>

            <h3 id="doc-9e" style="color: #2563eb; margin-top: 30px;">9e. Domyślne sortowanie i limit wczytywania siatki</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Domyślna kolejność sortowania:</strong> Jedna lub więcej reguł sortowania (kolumna + ASC/DESC). Awaryjnie stosowane jest <code>id DESC</code>.</li>
                <li><strong>Początkowy limit wczytywania:</strong> Maksymalna liczba wierszy przy pierwszym wczytaniu. <code>0</code> oznacza brak limitu.</li>
                <li><strong>Przechowywane w:</strong> <code>config/schema.json</code> jako <code>"default_sort"</code> i <code>"initial_limit"</code>.</li>
            </ul>

            <h3 id="doc-9f" style="color: #2563eb; margin-top: 30px;">9f. Szybkie dodawanie w podtabelach</h3>
            <p>Nagłówki bloków podtabel pokazują przycisk <strong>+</strong>, który przekierowuje do <code>create.php</code> z wstępnie wypełnionym kluczem obcym. Widoczny tylko dla ról Edytor i Admin.</p>

            <h3 id="doc-9f2" style="color: #2563eb; margin-top: 30px;">9f2. Przyciski akcji w siatce</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Edytuj</strong> — ikona <code>edit_square.png</code>, przekierowuje do <code>edit.php</code>.</li>
                <li><strong>Usuń</strong> — ikona <code>delete.png</code> (czerwony hover), wymaga potwierdzenia.</li>
                <li>Widoczne tylko dla roli <strong>Edytor</strong>.</li>
            </ul>

            <h3 id="doc-9g" style="color: #2563eb; margin-top: 30px;">9g. Zakładka Wydajność</h3>
            <p><strong>Admin → System → Wydajność</strong> — panel diagnostyczny tylko do odczytu z sześcioma niezależnymi sekcjami.</p>
            <ul style="padding-left: 20px;">
                <li><strong>1. Doradca brakujących indeksów:</strong> Wyszukuje kolumny bez indeksów. Generuje gotowy SQL <code>CREATE INDEX</code>.</li>
                <li><strong>2. Nieużywane indeksy:</strong> Indeksy z <code>idx_scan = 0</code>. Generuje SQL <code>DROP INDEX</code>.</li>
                <li><strong>3. Analizator wolnych zapytań:</strong> Odczytuje <code>pg_stat_statements</code>. Wyróżnia zapytania powyżej 100 ms / 500 ms.</li>
                <li><strong>4. Statystyki tabel i fragmentacja:</strong> Martwe wiersze, % fragmentacji, liczby skanów, czasy ostatniego vacuum.</li>
                <li><strong>5. Stan bazy danych:</strong> Współczynnik trafień cache, połączenia, zakleszczenia, rozmiar bazy, wersja PG.</li>
                <li><strong>6. Ostrzeżenia konfiguracji schematu:</strong> Flagi dla tabel &gt;20 kolumn, brakujących limitów, sortowania, podtabel bez columns_to_show.</li>
            </ul>

            <h3 id="doc-9h" style="color: #2563eb; margin-top: 30px;">9h. Zakładka Cron powiadomień</h3>
            <p><strong>Admin → System → Cron powiadomień</strong> — pięciosekcyjny interfejs zarządzania cronem powiadomień.</p>
            <ul style="padding-left: 20px;">
                <li><strong>1. Ręczne uruchomienie:</strong> Wykonuje <code>cron_notifications.php</code> natychmiastowo.</li>
                <li><strong>2. Historia uruchomień:</strong> Ostatnie 50 wpisów z <code>spw_users_notifications_log</code>.</li>
                <li><strong>3. Statystyki powiadomień:</strong> Łączne, nieprzeczytane, na dziś, nadchodzące. Top 10 użytkowników według liczby nieprzeczytanych.</li>
                <li><strong>4. Konfiguracja crona:</strong> Gotowe do skopiowania komendy dla Linux/macOS, Windows Task Scheduler i Docker.</li>
                <li><strong>5. Czyszczenie dziennika:</strong> Usuwa wpisy <code>spw_users_notifications_log</code> starsze niż N dni.</li>
            </ul>

            <h3 id="doc-9i" style="color: #2563eb; margin-top: 30px;">9i. Rozmiar strony siatki</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Domyślny administrator:</strong> Schemat → <em>Globalne ustawienia siatki</em> → <em>Domyślny rozmiar strony</em> (10 / 25 / 50 / 100).</li>
                <li><strong>Nadpisanie przez użytkownika:</strong> Selektor <em>Wierszy na stronie</em> w pasku paginacji, zapisywany w <code>localStorage</code>.</li>
                <li><strong>Priorytet:</strong> <code>localStorage</code> → <code>schema.default_page_size</code> → awaryjnie 25.</li>
            </ul>

            <h3 id="doc-9j" style="color: #2563eb; margin-top: 30px;">9j. Relacje wiele-do-wielu</h3>
            <p>Relacje M2M łączą rekordy poprzez <strong>tabelę łącznikową</strong>. Renderowane jako panel pól wyboru w formularzach edycji i tworzenia.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #8b5cf6; padding-left: 15px;">Jak działa</h4>
            <ol style="padding-left: 20px;">
                <li><strong>Utwórz tabelę łącznikową w PostgreSQL</strong> z dwiema kolumnami FK i ograniczeniem UNIQUE.</li>
                <li><strong>Skonfiguruj relację:</strong> Schemat → tabela nadrzędna → <em>Relacje wiele-do-wielu</em> → <strong>+ Dodaj wiele-do-wielu</strong>.</li>
                <li><strong>Zapisz plik</strong> — panel pól wyboru pojawia się automatycznie.</li>
            </ol>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #8b5cf6; padding-left: 15px;">Pola konfiguracji</h4>
            <ul style="padding-left: 20px;">
                <li><strong>Etykieta wyświetlana, Tabela łącznikowa, Własny FK, Obcy FK, Inna tabela, Kolumna wyświetlana.</strong></li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #8b5cf6; padding-left: 15px;">Zachowanie w czasie wykonania</h4>
            <ul style="padding-left: 20px;">
                <li>Przy zapisie: wszystkie istniejące wiersze łącznikowe są usuwane i nowe wiersze wstawiane atomowo w jednej transakcji PostgreSQL.</li>
                <li>Rola Przeglądającego widzi pola wyboru w stanie wyłączonym.</li>
            </ul>

            <h3 id="doc-9k" style="color: #2563eb; margin-top: 30px;">9k. Mapa schematu (ERD)</h3>
            <p><strong>Zarządzanie danymi → Mapa schematu</strong> renderuje interaktywny diagram ERD z <code>schema.json</code>. Automatyczny układ oparty na sile. Brak zewnętrznych bibliotek.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Typy połączeń:</strong> Klucz obcy (ciągła niebieska), Podtabela (przerywana zielona), M2M (kropkowana fioletowa).</li>
                <li><strong>Sterowanie:</strong> Przesuwanie, zoom, przeciąganie tabel, klik do podświetlenia, wyszukiwanie, pokaż/ukryj ukryte tabele, Dopasuj widok, Eksport PNG.</li>
            </ul>

            <h3 id="doc-10" style="color: #2563eb; margin-top: 30px;">10. Moduł plików</h3>
            <p>Centralne repozytorium dokumentów i multimediów wspierane przez <code>spw_files</code>.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Konfiguracja:</strong> Maksymalny rozmiar pliku, dozwolone typy, ścieżka przechowywania (nie może być dostępna przez www — pliki są przesyłane przez <code>file_download.php</code>).</li>
                <li><strong>Relacje z rekordami:</strong> Opcjonalnie powiąż przesłane pliki z konkretnymi wierszami w tabeli docelowej.</li>
            </ul>

            <h3 id="doc-11" style="color: #2563eb; margin-top: 30px;">11. Podgląd menu i edytor nawigacji</h3>
            <p>Renderuje pasek boczny frontendu dokładnie tak, jak widzą go użytkownicy, i pozwala zmieniać kolejność lub zagnieżdżać elementy przez przeciąganie. Każda zmiana jest zapisywana automatycznie.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Kontrolki przeciągnij i upuść</h4>
            <ul style="padding-left: 20px;">
                <li><strong>Zmiana kolejności:</strong> Przeciągnij powyżej lub poniżej innego elementu.</li>
                <li><strong>Zagnieżdżanie:</strong> Upuść na środkową strefę elementu najwyższego poziomu. Maksymalna głębokość: <strong>1 poziom</strong>.</li>
                <li><strong>Odgnieżdżanie:</strong> Przeciągnij element podrzędny na poziom główny.</li>
                <li><strong>Automatyczny zapis:</strong> Każde upuszczenie wyzwala zapis do <code>config/menu.json</code> po 350 ms opóźnienia.</li>
            </ul>

            <h3 id="doc-11b" style="color: #2563eb; margin-top: 30px;">11b. Systemy demo (szablony szybkiego startu)</h3>
            <p><strong>System → Systemy demo</strong> udostępnia trzy gotowe aplikacje demo: CRM, WMS i Zarządzanie zadaniami.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Co jest instalowane:</strong> Schemat PostgreSQL, dane testowe, wpisy schema.json, widgety dashboardu, źródła kalendarza, przepływy pracy, widoki SQL.</li>
                <li><strong>Bezpieczeństwo:</strong> Zarówno instalacja, jak i deinstalacja wymagają wpisania <code>CONFIRM</code>.</li>
                <li><strong>Czyszczenie przy deinstalacji:</strong> Schemat demo jest usuwany (CASCADE). Pliki konfiguracyjne są czyszczone, jeśli zawierają tylko treści demo.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Demo 1: CRM</h4>
            <p>Firmy, kontakty, szanse sprzedaży, oferty, faktury, zasoby, aktywności. Klucze obce z podtabelami, kodowanie kolorami etapów sprzedaży, drill-down przychodów rok → miesiąc.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Demo 2: WMS (Zarządzanie magazynem)</h4>
            <p>Magazyny, dostawcy, produkty, partie, stan, zamówienia zakupu, zamówienia klientów, wysyłki. Śledzenie partii FIFO/FEFO, alerty wygasania, widoki niskiego stanu, 3 przepływy pracy.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Demo 3: Zarządzanie zadaniami</h4>
            <p>Projekty, członkowie zespołu, kamienie milowe, zadania, dzienniki czasu. Planowanie sprintów, widok obciążenia, odchylenie budżetu czasu (zalogowany vs szacowany), drill-down widoku podsumowania.</p>

            <h3 id="doc-13" style="color: #2563eb; margin-top: 30px;">13. Moduł wielojęzyczny (i18n)</h3>
            <p>OpenSparrow obsługuje wiele języków interfejsu poprzez płaskie pliki JSON z tłumaczeniami. Aktywny język jest rozwiązywany per sesja; szablony PHP i wszystkie moduły JS korzystają z tego samego pakietu.</p>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Konfiguracja — settings.json</h4>
            <ul style="padding-left: 20px;">
                <li><code>"default_language": "pl"</code> — język używany gdy brak preferencji w sesji.</li>
                <li><code>"available_languages": ["en", "pl"]</code> — włącza przełącznik języka; lista akceptowanych kodów locale.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Pliki tłumaczeń</h4>
            <p>Każde locale ma jeden plik: <code>languages/{locale}.json</code> (np. <code>languages/pl.json</code>). Struktura:</p>
            <ul style="padding-left: 20px;">
                <li>Klucze najwyższego poziomu to przestrzenie nazw: <code>common</code>, <code>grid</code>, <code>form</code>, <code>auth</code>, <code>header</code>, <code>admin</code>, <code>pagination</code>, <code>filter</code>, <code>files</code>, <code>notifications</code>, <code>dashboard</code>, <code>workflow</code>, <code>comments</code>, <code>owners</code>, <code>views</code>, <code>calendar</code>.</li>
                <li>Wartości liczby mnogiej to obiekty: <code>{"one": "...", "few": "...", "many": "..."}</code> dla polskiego; <code>{"one": "...", "other": "..."}</code> dla angielskiego.</li>
                <li>Zmienne używają składni <code>{name}</code>: np. <code>"showing": "Wyniki {from}–{to} z {total} rekordów"</code>.</li>
                <li><strong>Krytyczne:</strong> Cudzysłów wewnątrz wartości JSON musi być poprzedzony ukośnikiem: <code>\"</code>. Nieescapowany <code>"</code> powoduje ciche niepowodzenie <code>json_decode</code> i powrót do języka angielskiego bez żadnego komunikatu błędu.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">API PHP</h4>
            <ul style="padding-left: 20px;">
                <li><code>includes/i18n.php</code> — ładowany przez <code>includes/session.php</code>, dostępny wszędzie.</li>
                <li><code>I18n::locale()</code> — zwraca aktywne locale (np. <code>'pl'</code>). Używaj w <code>&lt;html lang="..."&gt;</code>.</li>
                <li><code>t($key, $vars = [], $count = null)</code> — tłumaczy klucz w notacji kropkowej; zastępuje placeholdery <code>{name}</code>; wybiera formę liczby mnogiej gdy podany <code>$count</code>.</li>
                <li>Pakiet tłumaczeń serwowany do JS przez <code>api.php?action=i18n_bundle</code> jako płaski JSON klucz→wartość.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">API JavaScript</h4>
            <ul style="padding-left: 20px;">
                <li><code>assets/js/i18n.js</code> — singleton ES module. Import: <code>import { I18n } from './i18n.js';</code></li>
                <li>Zawsze wywołuj <code>await I18n.load()</code> przed renderowaniem przetłumaczonego tekstu — komponenty renderowane przed rozwiązaniem <code>load()</code> pokażą surowe klucze.</li>
                <li><code>I18n.t('common.save')</code> — podstawowe wyszukiwanie.</li>
                <li><code>I18n.t('grid.showing', { from: 1, to: 10, total: 42 })</code> — z podstawianiem zmiennych.</li>
                <li><code>I18n.t('files.count', { count: 3 }, 3)</code> — z wyborem formy liczby mnogiej.</li>
                <li>Buduj węzły DOM przez <code>el.textContent = I18n.t(...)</code> — nigdy nie wstrzykuj tłumaczeń przez <code>innerHTML</code>.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Dodawanie nowego języka</h4>
            <ol style="padding-left: 20px;">
                <li>Skopiuj <code>languages/en.json</code> → <code>languages/{locale}.json</code>.</li>
                <li>Przetłumacz wszystkie wartości; zaktualizuj formy liczby mnogiej zgodnie z zasadami docelowego języka.</li>
                <li>Dodaj kod locale do <code>"available_languages"</code> w <code>config/settings.json</code>.</li>
                <li>Zwaliduj JSON przed wdrożeniem: <code>node -e "JSON.parse(require('fs').readFileSync('languages/{locale}.json','utf8'))"</code>.</li>
            </ol>

            <h3 id="doc-12" style="color: #2563eb; margin-top: 30px;">12. Uwagi dotyczące wdrożenia</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Zablokuj publiczny dostęp do <code>config/</code>:</strong> Reguła <code>.htaccess</code> jest domyślnie dołączona.</li>
                <li><strong>Uprawnienia do przechowywania:</strong> <code>config/</code> i <code>storage/</code> muszą być zapisywalne przez użytkownika serwera www.</li>
                <li><strong>Kopie zapasowe:</strong> Eksportuj ZIP konfiguracji przed każdą aktualizacją i regularnie wykonuj migawki <code>pg_dump</code>.</li>
                <li><strong>Tryb demo:</strong> Ustaw <code>DEMO_MODE=true</code>, aby zablokować wszystkie operacje zapisu w API administracyjnym.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Zmienne środowiskowe</h4>
            <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:10px;">
                <thead><tr style="background:#f1f5f9;">
                    <th style="text-align:left;padding:6px 10px;border:1px solid #e2e8f0;">Zmienna</th>
                    <th style="text-align:left;padding:6px 10px;border:1px solid #e2e8f0;">Domyślnie</th>
                    <th style="text-align:left;padding:6px 10px;border:1px solid #e2e8f0;">Opis</th>
                </tr></thead>
                <tbody>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>APP_ENV</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>production</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Środowisko uruchomieniowe.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>DB_HOST</code> / <code>PGHOST</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>localhost</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Host PostgreSQL.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>DB_PORT</code> / <code>PGPORT</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>5432</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Port PostgreSQL.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>APP_TIMEZONE</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>Europe/Warsaw</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Strefa czasowa IANA dla każdej sesji PostgreSQL.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>SECURE_COOKIES</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>true</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Ustaw <code>false</code> przy zwykłym HTTP.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>SESSION_MAX_LIFETIME</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>28800</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Bezwzględny czas wygaśnięcia sesji w sekundach (8 h).</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>IP_HASH_SALT</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><em>brak</em></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><strong>Wymagane na produkcji.</strong> Sekret HMAC dla pseudonimizacji IP.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>LOGIN_MAX_ATTEMPTS_PER_IP</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>20</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Próg nieudanych logowań na IP.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>LOGIN_MAX_ATTEMPTS_PER_USERNAME</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>5</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Próg nieudanych logowań na nazwę użytkownika.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>LOGIN_LOCKOUT_MINUTES</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>15</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Czas blokady w minutach.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>DEMO_MODE</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>false</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Zablokuj wszystkie operacje zapisu w API administracyjnym.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>FILES_MAX_SIZE_MB</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>20</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Domyślny limit rozmiaru przesyłania.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>RECORD_SNAPSHOTS_ENABLED</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>false</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Włącz migawki rekordów w całym systemie.</td></tr>
                    <tr><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>PGSCHEMA</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;"><code>app</code></td><td style="padding:5px 10px;border:1px solid #e2e8f0;">Schemat dla tabel <code>spw_*</code>.</td></tr>
                </tbody>
            </table>
        </div>
    `;
}
