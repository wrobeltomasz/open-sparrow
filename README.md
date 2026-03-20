# OpenSparrow

![License](https://img.shields.io/badge/license-LGPL%20v3-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.x-purple.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)

---

## 🇬🇧 English

**OpenSparrow** is an advanced, JSON schema-driven platform for building database management systems (like ERPs, CRMs, and Admin Panels) using PHP, PostgreSQL, and Vanilla JavaScript.

![Data Grid](assets/img/grid.png)
Grid view.<br /><br />

<img width="1893" height="850" alt="OpenSparrow-admin" src="https://github.com/user-attachments/assets/cdfcbf8f-e4fa-4897-8a03-98e5f8357ab2" />
Admin panel.<br /><br />

At the core of the system is its "Schema-Driven" architecture. Instead of writing repetitive code for every view, you define your tables, relationships, and forms in JSON files. The platform dynamically generates a complete, secure user interface with inline data editing, charting capabilities, and event management.



### Core Features

* **Zero-Configuration Setup:** Forget about manual config file editing. Connect to your database and initialize the entire system structure with a single click directly from your browser!
* **JSON-Driven Data Grid (CRUD):** Automatically generates tables and forms based on `schema.json`. It fully supports foreign key resolution (displaying names instead of IDs), nested sub-tables, field constraints (`not_null`, `readonly`), and custom status coloring (`enum_colors`).
* **Dynamic API & Security:** The built-in `api.php` safely processes GET, POST, PATCH (for inline cell edits), and DELETE requests. It enforces strict session-based authentication and automatically records all data modifications into a secure internal audit log.
* **Visual Admin Panel:** A built-in GUI (`/admin`) that allows you to configure your entire application structure without touching a single line of code. It features dedicated tabs for Schema, Dashboards, Calendar configurations, built-in Server Diagnostics (System Health), and a "Debug Mode" toggle.
* **Dashboard Engine:** A robust data aggregation engine directly executing SQL operations (COUNT, SUM, AVG, MIN, MAX, GROUP BY) on PostgreSQL. It enables the quick construction of statistical tiles, ranked lists, and charts configured via `dashboard.json`.
* **Calendar & Automated CRON Notifications:** Map any database table with a date column to a visual calendar. A dedicated background script (`cron_notifications.php`) securely pushes smart notifications to users based on upcoming events.

### 🗂️ Project Structure

```text
open-sparrow/
|- admin/
|  |- api.php                # Admin-side API endpoints
|  |- app.js                 # Admin app bootstrap and shared logic
|  |- calendar.js            # Calendar configuration UI logic
|  |- dashboard.js           # Dashboard builder/configuration logic
|  |- database.js            # Database settings and connection UI logic
|  |- docs.js                # Documentation/help tab logic in admin
|  |- health.js              # System health checks and diagnostics UI
|  |- index.php              # Admin panel entry point
|  |- schema.js              # Schema editor logic (tables/fields/relations)
|  |- security.js            # Security settings UI (auth/debug controls)
|  |- style.css              # Admin-specific styles
|  |- ui.js                  # Shared admin UI components/helpers
|  `- users.js               # User management tab logic
|
|- assets/
|  |- css/
|  |  |- mobile.css          # Responsive/mobile styling overrides
|  |  `- styles.css          # Main frontend styling
|  |- icons/                 # Icon assets used by the UI
|  |- img/                   # Image assets (screenshots, illustrations)
|  `- js/
|     |- app.js              # Main frontend app initialization
|     |- calendar.js         # Calendar view behaviors
|     |- dashboard.js        # Dashboard rendering logic
|     |- debug.js            # Debug mode/client-side diagnostics
|     |- export_csv.js       # CSV export actions
|     |- grid_actions.js     # Data grid row/action handlers
|     |- grid_fk.js          # Foreign key rendering/resolution helpers
|     |- grid.js             # Core data grid rendering and interaction
|     `- pagination.js       # Pagination controls and state
|
|- cron/
|  `- cron_notifications.php # Scheduled event notification runner
|
|- includes/
|  |- api_helpers.php        # Shared API validation/response helpers
|  `- db.php                 # PostgreSQL connection and DB utilities
|
|- templates/
|  `- template.php           # Base page template/layout wrapper
|
|- api_notifications.php     # Notification API endpoint
|- api.php                   # Main application API endpoint (CRUD)
|- calendar.php              # Calendar page entry point
|- create.php                # Record creation form/page
|- dashboard.php             # Dashboard page entry point
|- edit.php                  # Record editing page
|- index.php                 # Main app landing page/data grid
|- login.php                 # Authentication/login page
|- logout.php                # Session logout handler
|- CONTRIBUTING.md           # Contribution guidelines
|- COPYING                   # License text copy
|- LICENCE                   # Additional license file variant
`- README.md                 # Project documentation
```

### Structure Notes

* The root-level `*.php` files are the main runtime entry points for users and APIs.
* The `admin/` folder contains a separate administrative interface for configuration and maintenance.
* Frontend behavior is split into focused modules in `assets/js/` (grid, dashboard, calendar, export, etc.).
* Shared backend building blocks live in `includes/` to avoid duplicate DB/API logic.
* Reusable view scaffolding is centralized in `templates/template.php`.

### Quick Start (60-Second Setup)

1. Clone the repository to your server (PHP > 8.0 and PostgreSQL required).


git clone [https://github.com/wrobeltomasz/open-sparrow.git](https://github.com/wrobeltomasz/open-sparrow.git)


2. Open your project URL in the browser pointing to the `/admin` directory (e.g., `http://localhost/open-sparrow/admin`).
3. Log in using the default password: **`admin`** (We highly recommend changing this in the *Security* tab later).
4. Navigate to the **Database** tab, enter your PostgreSQL credentials, and click **Save File**.
5. Navigate to the **System Health** tab and click the **"Initialize System Tables"** button. The system will automatically create the `app` schema and the required core user/log tables.
6. Done! Go to the **Schema** tab, click "Sync DB Tables," and start building your CRM visually!

### License

This project is licensed under the **GNU Lesser General Public License v3.0 (LGPL v3)**.
You are permitted to use this platform freely in both open-source and closed-source commercial projects. Any modifications made to the core OpenSparrow files must be released under the same open-source license. See the `LICENSE` file for full details.
