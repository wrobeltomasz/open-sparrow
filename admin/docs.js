// admin/docs.js

export function renderDocumentation(ctx) {
    const { workspaceEl } = ctx;

    // Render the static documentation content
    workspaceEl.innerHTML = `
        <div style="max-width: 900px; padding: 30px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); color: #334155; line-height: 1.6; margin-bottom: 40px;">
            <h2 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0; color: #0f172a;">
                OpenSparrow - Admin Panel Documentation
            </h2>
            <p style="font-size: 15px; color: #64748b; margin-bottom: 30px;">
                Configure your frontend application, manage database connections, and build dynamic dashboards, calendars and workflows without writing a single line of code.
            </p>

            <h3 style="color: #2563eb; margin-top: 30px;">0. Admin Panel Layout</h3>
            <p>The admin header exposes the main configuration tabs plus two drop-downs:</p>
            <ul style="padding-left: 20px;">
                <li><strong>Main tabs:</strong> Schema, Dashboard, Calendar, Workflows, Files.</li>
                <li><strong>System drop-down:</strong> Database, Security, Users, System Health.</li>
                <li><strong>Configuration drop-down:</strong> Export / Import the entire configuration as a ZIP archive (recommended before every production deployment).</li>
                <li><strong>Save config:</strong> Persists the currently edited JSON file to <code>includes/</code>. After a successful save a green status pill appears next to the button confirming which file was written. Error pills stay visible for 6 seconds so they are not missed.</li>
                <li><strong>Unsaved-changes guard:</strong> The admin panel tracks whether any field has been modified since the last save. Switching to a different tab while there are pending changes shows a confirmation prompt so edits are not silently discarded. The browser also intercepts page reloads and closures when changes are pending.</li>
                <li><strong>Debug FE mode:</strong> Toggle in the header. When enabled, the frontend exposes a <code>#debug</code> panel with raw payloads for schema/API responses — useful when building new tables or troubleshooting grids.</li>
                <li><strong>Docs icon (book):</strong> Opens this documentation page.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">1. Technical Requirements & Database Structure</h3>
            <p>Before configuring OpenSparrow, make sure your PostgreSQL database meets these core requirements:</p>
            <ul style="padding-left: 20px;">
                <li><strong>Primary keys (mandatory):</strong> Every table <strong>must</strong> have a primary key column named <code>id</code> (typically <code>SERIAL</code> or <code>BIGSERIAL</code>). OpenSparrow relies on this exact column name to edit, delete, and view specific records.</li>
                <li><strong>Foreign keys (relationships):</strong> Use standard PostgreSQL foreign keys to link tables. The UI detects them automatically. Recommended naming convention: <code>table_name_id</code> (e.g. <code>company_id</code>).</li>
                <li><strong>ENUM types:</strong> Custom PostgreSQL ENUM types are fully supported and rendered as <code>&lt;select&gt;</code> menus in the frontend.</li>
                <li><strong>Boolean types:</strong> Boolean columns render as switch toggles in edit forms and as dropdown filters in data grids.</li>
                <li><strong>System schema:</strong> OpenSparrow stores its internal tables (<code>spw_*</code>) in a dedicated PostgreSQL schema (default: <code>app</code>). The schema is resolved in this order: <code>schema</code> key in <code>includes/database.json</code>, then the <code>PGSCHEMA</code> environment variable, then the <code>app</code> fallback.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">System tables (<code>spw_*</code> prefix)</h4>
            <p>OpenSparrow reserves a small set of internal tables, all prefixed with <code>spw_</code> and created inside the configured system schema:</p>
            <ul style="padding-left: 20px;">
                <li><code>spw_users</code> — frontend user accounts (id, username, password hash, role, active flag).</li>
                <li><code>spw_users_log</code> — audit trail of user actions (LOGIN, LOGOUT, CRUD operations).</li>
                <li><code>spw_users_notifications</code> — per-user in-app notifications, produced by the cron runner.</li>
                <li><code>spw_files</code> — metadata for files uploaded through the Files module.</li>
                <li><code>spw_login_attempts</code> — rolling log used by the DB-backed rate limiter on <code>login.php</code> (IP-hash and username counters).</li>
            </ul>
            <p style="background: #fef3c7; padding: 10px 14px; border-left: 3px solid #f59e0b; border-radius: 4px; font-size: 14px;">
                <strong>Note:</strong> Tables starting with <code>spw_</code> are treated as system tables. They are <strong>filtered out</strong> from the <em>Sync DB Tables</em> list in the Schema tab and will not appear in your application schema, even if they live in the same PostgreSQL schema as your business tables.
            </p>

            <h3 style="color: #2563eb; margin-top: 30px;">2. Schema & Grid Configuration</h3>
            <p>The <strong>Schema</strong> tab is the core of your configuration. It maps your database tables to frontend grids and forms.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Add new tables:</strong> Use <em>+ Add Table</em> to create new physical tables in PostgreSQL. You specify the schema and table name; the system automatically creates the mandatory <code>id</code> primary key.</li>
                <li><strong>Add new columns:</strong> Inside a table's configuration, click <em>+ Add Column</em> to append a physical column to the database. Specify name and native SQL type (e.g. <code>varchar(255)</code>, <code>boolean</code>, <code>int4</code>).</li>
                <li><strong>Sync DB Tables:</strong> Fetches all tables and columns from the connected database and merges them into your schema configuration. System tables with the <code>spw_</code> prefix are skipped automatically.</li>
                <li><strong>Live sidebar preview:</strong> When editing a table's Display Name, Icon or the <em>Hide from Sidebar Menu</em> flag, a small dark preview strip updates in real time showing exactly how the entry will appear in the frontend navigation — including the icon image, the display name, and a red <em>HIDDEN</em> badge when the table is hidden.</li>
                <li><strong>Smart type mapping:</strong> Native PostgreSQL types (<code>int4</code>, <code>varchar</code>, <code>boolean</code>, etc.) are mapped to clean frontend types (Text, Number, Date, Boolean, Enum). You can override the mapping with the provided dropdowns.</li>
                <li><strong>Remove tables:</strong> The red <em>Delete Table</em> button removes a table from your JSON configuration <strong>only</strong> — it does not drop the physical table from PostgreSQL.</li>
                <li><strong>Foreign-key search &amp; display:</strong> Assign multiple display columns to a foreign key (e.g. <code>first_name, last_name</code>). The frontend grid renders them as searchable inputs — practical across thousands of records.</li>
                <li><strong>Visibility &amp; ordering:</strong> Toggle per-column visibility in the grid and reorder with the Up/Down arrows.</li>
                <li><strong>Validation rules (regex):</strong> Enforce strict formats with regular expressions. When user input does not match, your custom error message is shown. Common patterns:
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        <li><strong>Email:</strong> <code>^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$</code></li>
                        <li><strong>Phone (9-15 digits, optional +):</strong> <code>^\+?[0-9]{9,15}$</code></li>
                        <li><strong>Postal code (XX-XXX):</strong> <code>^[0-9]{2}-[0-9]{3}$</code></li>
                        <li><strong>URL (http/https):</strong> <code>^https?:\/\/.*$</code></li>
                        <li><strong>Username (3-16 chars, letters/digits/_ ):</strong> <code>^[a-zA-Z0-9_]{3,16}$</code></li>
                        <li><strong>Price / decimal (up to 2 places):</strong> <code>^\d+(\.\d{1,2})?$</code></li>
                        <li><strong>Date (YYYY-MM-DD):</strong> <code>^\d{4}-\d{2}-\d{2}$</code></li>
                        <li><strong>Time (HH:MM, 24h):</strong> <code>^([01]\\d|2[0-3]):[0-5]\\d$</code></li>
                        <li><strong>Strong password (min 8 chars, upper, lower, digit):</strong> <code>^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$</code></li>
                        <li><strong>IPv4 address:</strong> <code>^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$</code></li>
                    </ul>
                </li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Subtables (one-to-many relationships)</h4>
            <p><strong>+ Add Subtable</strong> lets you display related child records directly inside the parent record's detail view (e.g. all <em>Invoices</em> under a <em>Client</em>).</p>
            <ul style="padding-left: 20px;">
                <li>Open the Schema editor of the parent table and click <em>+ Add Subtable</em>.</li>
                <li><strong>Target table:</strong> the child table to display (e.g. <code>invoices</code>).</li>
                <li><strong>Foreign-key column:</strong> the column in the child table that references the parent's <code>id</code> (e.g. <code>client_id</code>).</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">3. Dashboard Builder</h3>
            <p>The <strong>Dashboard</strong> tab composes analytical views from your database.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Global settings:</strong> Define the menu name, icon, visibility and the main layout grid (CSS grid properties, e.g. <code>repeat(auto-fit, minmax(300px, 1fr))</code>). A live sidebar preview updates as you type so you can see the final menu entry before saving.</li>
                <li><strong>Stat cards:</strong> Simple metric widgets showing the total row count of a selected table.</li>
                <li><strong>KPI cards:</strong> Single aggregate numbers based on specific columns (COUNT, SUM, AVG, MIN, MAX).</li>
                <li><strong>Bar charts:</strong> Group by X-axis column and aggregate on the Y-axis column.</li>
                <li><strong>Data lists:</strong> Top-N lists displaying recent or filtered records directly on the dashboard.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Advanced filtering (WHERE clause)</h4>
            <p>Every widget supports a custom SQL filter that restricts the data it processes. Enter a valid PostgreSQL condition in the <strong>WHERE clause</strong> field.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Do not include the word <code>WHERE</code></strong> — just the condition.</li>
                <li><strong>Examples:</strong> <code>status = 'pending'</code>, <code>price &gt; 100 AND is_active = true</code>.</li>
                <li>Use single quotes for strings, e.g. <code>role = 'admin'</code>.</li>
                <li>Useful for targeted widgets like "Total pending orders" or "Top customers from the UK".</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">4. Calendar Module</h3>
            <p>The <strong>Calendar</strong> tab binds date columns from your database directly to a visual calendar.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Global settings:</strong> The <em>Global Settings</em> sidebar item lets you set the menu name, icon and visibility of the Calendar entry in the frontend navigation. A live sidebar preview reflects changes immediately.</li>
                <li><strong>Data sources:</strong> Overlay multiple tables on a single calendar. For each source select the table, the date column and the title column.</li>
                <li><strong>Color coding:</strong> Assign a color per source to distinguish events at a glance.</li>
                <li><strong>Row context:</strong> The full database row is attached to each calendar event, enabling click-through modals or custom actions.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">5. Workflows Builder</h3>
            <p>The <strong>Workflows</strong> tab composes multi-step wizards that guide users through structured data entry across related tables.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Global settings:</strong> Click <em>Global Settings</em> in the sidebar to set the menu name, icon and visibility of the Workflows entry. A live sidebar preview shows the result immediately, including a <em>HIDDEN</em> badge when the section is hidden.</li>
                <li><strong>Workflow details:</strong> Each workflow requires Title, short description and icon — rendered as a card in the frontend workflows grid.</li>
                <li><strong>Steps setup:</strong> Add sequential steps and select a target table per step. Each step can have its own description.</li>
                <li><strong>Relational linking:</strong> Link child records to parents by selecting the foreign-key column in the current step and mapping it to a previously completed step.</li>
                <li><strong>Multiple records:</strong> Enable <em>Allow adding multiple records</em> to let users submit several entries in a single step (e.g. several employees for a company) before moving on.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">6. Users Management</h3>
            <p>The <strong>Users</strong> tab manages access to the frontend application (records are stored in <code>spw_users</code>).</p>
            <ul style="padding-left: 20px;">
                <li><strong>Create users:</strong> Provide a username and password. Passwords are hashed with <code>password_hash()</code> before being written to the database. A live strength meter ranks passwords from <em>Weak</em> to <em>Strong</em>.</li>
                <li><strong>FE Permission (role):</strong> Each user has a frontend role that controls what they can do in the app:
                    <ul style="padding-left: 20px; margin-top: 5px;">
                        <li><strong>Full Access</strong> — default. Can create, read, update and delete records per schema permissions.</li>
                        <li><strong>Read Only</strong> — can browse data and dashboards but cannot modify records. Enforced both in the UI and in <code>api_schema.php</code>, which returns reduced permissions for read-only sessions.</li>
                    </ul>
                </li>
                <li><strong>Active status:</strong> Toggle Active / Inactive to revoke or restore login access without deleting the user's historical records.</li>
                <li><strong>Audit:</strong> Login events and data changes are written to <code>spw_users_log</code>.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">7. Database &amp; Security</h3>
            <p>Manage the core PostgreSQL connection and admin-panel authentication.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Database configuration:</strong> Update host, port, database name, username and password. Settings are written to <code>includes/database.json</code> and take effect immediately.</li>
                <li><strong>System Schema:</strong> The <em>System Schema</em> field sets the PostgreSQL schema used for all <code>spw_*</code> tables. Defaults to <code>app</code>. This value is read by <code>sys_schema()</code> in <code>includes/db.php</code> and used to qualify every system-table query (<code>sys_table('users')</code>, <code>sys_table('files')</code>, …).</li>
                <li><strong>Test Saved Connection:</strong> Always click <em>Save config</em> first — the button reads the persisted <code>database.json</code>, not the in-form values.</li>
                <li><strong>Security tab:</strong> Changes the master password for this admin panel (default after install: <code>admin</code>). Passwords stored in <code>includes/security.json</code> are auto-migrated to <code>password_hash()</code> on first successful login.</li>
                <li><strong>Login protection:</strong> <code>login.php</code> applies a DB-backed rate limiter (IP-hash: 20 attempts / 15 min, username: 5 attempts / 15 min) plus CSRF tokens and strict session cookies.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">8. System Health &amp; Backups</h3>
            <p>Keep the environment healthy and configuration portable.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Initialize System Tables:</strong> In the Health tab this creates <code>spw_users</code>, <code>spw_users_log</code>, <code>spw_users_notifications</code>, <code>spw_files</code> and <code>spw_login_attempts</code> inside the configured schema (default <code>app</code>). Run it once on a fresh installation. The call is CSRF-protected via the <code>X-CSRF-Token</code> header.</li>
                <li><strong>System diagnostics:</strong> Live checks for PHP version, ZIP / pgsql extensions, write permissions on <code>includes/</code>, and database connectivity.</li>
                <li><strong>Export / Import config:</strong> The <em>Configuration</em> drop-down downloads or uploads a ZIP of all JSON settings. Recommended for backups and migrations to production.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">9. Files Module</h3>
            <p>The <strong>Files</strong> tab is a central repository for documents and media, backed by the <code>spw_files</code> table.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Global settings:</strong> The <em>Global Settings</em> sidebar item lets you set the menu name, icon and visibility of the Files entry. A live sidebar preview updates as you change these values.</li>
                <li><strong>Configuration:</strong> Set maximum file size (MB), allowed file types (images, PDFs, docs, spreadsheets, archives) and the storage path. The storage path must <strong>not</strong> be web-accessible — downloads are streamed through <code>file_download.php</code>.</li>
                <li><strong>Record relations:</strong> Optionally link uploads to specific rows in a target table, so files appear attached to business records (e.g. contracts on a client).</li>
                <li><strong>File library:</strong> Upload, search, filter by type, preview images and delete files from the admin UI. Deletions are logged to the audit trail.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">10. Deployment Notes</h3>
            <ul style="padding-left: 20px;">
                <li><strong>Deny public access to <code>includes/</code>:</strong> Configure your web server so <code>database.json</code>, <code>security.json</code> and <code>schema.json</code> cannot be fetched directly.</li>
                <li><strong>Environment variables:</strong> <code>PGHOST</code>, <code>PGPORT</code>, <code>PGDATABASE</code>, <code>PGUSER</code>, <code>PGPASSWORD</code>, <code>PGSCHEMA</code>. <code>PGSCHEMA</code> is the fallback for the system schema when <code>database.json</code> does not define <code>schema</code>.</li>
                <li><strong>Storage permissions:</strong> Under Docker, <code>includes/</code> and <code>storage/</code> must be writable by the web-server user (UID/GID <code>82:82</code> for musl-based slim PHP images).</li>
                <li><strong>Backups:</strong> Export the config ZIP before every upgrade and keep regular <code>pg_dump</code> snapshots of both application and <code>spw_*</code> tables.</li>
            </ul>
        </div>
    `;
}
