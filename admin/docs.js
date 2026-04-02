// admin/docs.js

export function renderDocumentation(ctx) {
    const { workspaceEl } = ctx;
    
    workspaceEl.innerHTML = `
        <div style="max-width: 900px; padding: 30px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); color: #334155; line-height: 1.6; margin-bottom: 40px;">
            <h2 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0; color: #0f172a;">
                Sparrow CRM - Admin Panel Documentation
            </h2>
            <p style="font-size: 15px; color: #64748b; margin-bottom: 30px;">
                Welcome to the Sparrow CRM Administration Panel. This tool allows you to configure your frontend application, manage database connections, and build dynamic dashboards without writing a single line of code.
            </p>

            <h3 style="color: #2563eb; margin-top: 30px;">1. Technical Requirements & Database Structure</h3>
            <p>Before configuring the CRM, ensure your PostgreSQL database meets these core requirements for the system to function correctly:</p>
            <ul style="padding-left: 20px;">
                <li><strong>Primary Keys (Mandatory):</strong> Every table <strong>must</strong> have a primary key column named <code>id</code> (typically defined as SERIAL or BIGSERIAL). The CRM relies on this exact column name to edit, delete, and view specific records.</li>
                <li><strong>Foreign Keys (Relationships):</strong> To link tables (e.g., assigning a Contact to a Company), use standard PostgreSQL foreign keys. The UI will automatically detect them. The recommended naming convention is <code>table_name_id</code> (e.g., <code>company_id</code>).</li>
                <li><strong>ENUM Types:</strong> Custom PostgreSQL ENUM types are fully supported. The CRM will automatically detect them and render them as dropdown <code>&lt;select&gt;</code> menus in the frontend forms.</li>
                <li><strong>Boolean Types:</strong> Boolean columns (true/false) will automatically render as switch toggles in edit forms and dropdown filters in the data grids.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">2. Schema & Grid Configuration</h3>
            <p>The <strong>Schema</strong> tab is the core of your CRM. It maps directly to your database tables and defines how they are displayed in the frontend Grid.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Sync DB Tables:</strong> Click this button to automatically fetch all tables and columns from your connected database.</li>
                <li><strong>Smart Type Mapping:</strong> When syncing columns, the system automatically reads native PostgreSQL data types (e.g., int4, varchar, boolean) and maps them to clean frontend types (Text, Number, Date, Boolean, Enum). You can manually adjust these using the provided dropdown lists.</li>
                <li><strong>Remove Tables:</strong> You can safely remove a table from your JSON configuration using the red "Delete Table" button without dropping the actual table from the PostgreSQL database.</li>
                <li><strong>Foreign Keys Search & Display:</strong> You can assign multiple display columns to a foreign key (e.g., <code>first_name, last_name</code>). In the frontend grid, these render as advanced searchable input fields, making it easy to find relations among thousands of records.</li>
                <li><strong>Visibility & Ordering:</strong> Toggle which columns are visible in the grid and use Up/Down arrows to reorder them.</li>
            </ul>

            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Configuring Subtables (One-to-Many Relationships)</h4>
            <p>The <strong>+ Add Subtable</strong> feature allows you to display related child records directly within the parent record's detail view (e.g., viewing all "Invoices" under a specific "Client" profile).</p>
            <ul style="padding-left: 20px;">
                <li>Click <strong>+ Add Subtable</strong> in the Schema editor of your parent table.</li>
                <li><strong>Target Table:</strong> The child table you want to display (e.g., <code>invoices</code>).</li>
                <li><strong>Foreign Key Column:</strong> The column in the child table that references the parent table's <code>id</code> (e.g., <code>client_id</code>).</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">3. Dashboard Builder</h3>
            <p>The <strong>Dashboard</strong> tab allows you to create dynamic analytical views using data from your database.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Global Settings:</strong> Define the main layout grid (using CSS properties like <code>repeat(auto-fit, minmax(300px, 1fr))</code>).</li>
                <li><strong>Stat Cards:</strong> Simple metric widgets displaying the total row count of a selected table.</li>
                <li><strong>KPI Cards:</strong> Small widgets to display single aggregate numbers based on specific columns (Count, Sum, Average).</li>
                <li><strong>Bar Charts:</strong> Visual widgets grouping data by X-Axis and aggregating on Y-Axis.</li>
                <li><strong>Data Lists:</strong> Top-N lists displaying recent or specific records directly on the dashboard.</li>
            </ul>
            
            <h4 style="color: #475569; margin-top: 20px; border-left: 3px solid #cbd5e1; padding-left: 15px;">Advanced Filtering (WHERE Clause)</h4>
            <p>You can apply custom SQL filtering to any dashboard widget to restrict the data it processes. Simply enter a valid PostgreSQL condition in the <strong>WHERE Clause</strong> field.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Do not include the word "WHERE".</strong> Just write the condition.</li>
                <li><strong>Examples:</strong> <code>status = 'pending'</code> or <code>price > 100 AND is_active = true</code>.</li>
                <li>Use single quotes for strings (e.g., <code>role = 'admin'</code>).</li>
                <li>This allows you to create specific widgets like "Total Pending Orders" or "Top Customers from the UK".</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">4. Calendar Module</h3>
            <p>The <strong>Calendar</strong> tab connects date-based columns from your database directly to a visual calendar interface.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Data Sources:</strong> You can overlay multiple tables on a single calendar. Select the source table, the target Date column, and the Title column.</li>
                <li><strong>Color Coding:</strong> Assign different colors to different data sources to easily distinguish events.</li>
                <li><strong>Row Data Context:</strong> The entire database row is passed to the calendar event, allowing for complex click interactions or dynamic modals.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">5. Workflows Builder</h3>
            <p>The <strong>Workflows</strong> tab enables you to construct multi-step wizards, guiding users through complex data entry processes across multiple related tables.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Global Settings:</strong> Click on the root "workflows.json" item to set the main menu name and menu icon for the frontend.</li>
                <li><strong>Workflow Details:</strong> Each workflow requires a Title, a Short Description, and an Icon to be beautifully displayed as a premium card in the frontend grid.</li>
                <li><strong>Steps Setup:</strong> Add sequential steps and select a Target Table for each form. You can also provide a dedicated description for each individual step.</li>
                <li><strong>Relational Linking (Foreign Keys):</strong> Link child records to parent records effortlessly. Select the Foreign Key column in the current step and map it to a previously completed step ID to automatically establish relationships.</li>
                <li><strong>Multiple Records:</strong> Use the "Allow adding multiple records" toggle to let users submit multiple entries in a single step (e.g., adding multiple employees to a company) before proceeding to the next stage.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">6. Users Management</h3>
            <p>The <strong>Users</strong> tab is dedicated to managing access to the frontend CRM interface.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Create Users:</strong> Add new frontend user accounts by providing a username and a secure password (which is heavily hashed in the database).</li>
                <li><strong>Active Status Toggle:</strong> You can instantly revoke or restore a user's login access by toggling their "Active / Inactive" status, without permanently deleting their historical records from the database.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">7. Database & Security</h3>
            <p>Manage your core connection and authentication settings.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Database Configuration:</strong> Update your PostgreSQL host, port, database name, username, and password. Changes applied here overwrite the environment configurations instantly.</li>
                <li><strong>Security:</strong> Change the master password used to access this Sparrow Admin Panel. Ensure you use a strong password to protect your configuration environment.</li>
            </ul>

            <h3 style="color: #2563eb; margin-top: 30px;">8. System Health & Backups</h3>
            <p>Ensure your system is running smoothly and data is safe.</p>
            <ul style="padding-left: 20px;">
                <li><strong>Initialize System Tables:</strong> Found in the Health tab, this critical feature builds the base <code>app.users</code>, <code>app.users_log</code>, and <code>app.users_notifications</code> tables. It must be executed on a fresh installation.</li>
                <li><strong>System Diagnostics:</strong> Performs live checks on your PHP version, ZIP extensions, directory write permissions, and database connectivity.</li>
                <li><strong>Export / Import Config:</strong> Use the top navigation buttons to download (Export) or upload (Import) a ZIP archive containing all your JSON settings. This is highly recommended for creating backups or migrating your setup to a production server.</li>
            </ul>
        </div>
    `;
}