<div align="center">
  <img src="assets/img/logo-blue.png" alt="OpenSparrow banner" width="220" />

  <h1>OpenSparrow</h1>

  <p><strong>Schema-driven PHP platform to build CRUD apps, dashboards, and calendars on PostgreSQL in minutes.</strong></p>

  <p>
    <a href="LICENCE"><img src="https://img.shields.io/badge/License-LGPL%20v3-blue.svg" alt="License: LGPL v3" /></a>
    <a href="https://www.php.net/"><img src="https://img.shields.io/badge/PHP-8.0%2B-777BB4?logo=php&logoColor=white" alt="PHP 8.0+" /></a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript ES6+" /></a>
  </p>
</div>

---

## Overview

OpenSparrow is a JSON schema-driven platform for internal systems such as CRM and ERP tools. Define your tables and relations once, and OpenSparrow generates data grids, forms, dashboard widgets, and calendar views.

Demo: http://www.demo.opensparrow.org

---

## Dashboard Preview

<img width="1899" height="869" alt="OpenSparrow data grid" src="assets/img/grid.png" />
Grid view.

<br /><br />

<img width="1893" height="850" alt="OpenSparrow dashboard and admin panel" src="https://github.com/user-attachments/assets/cdfcbf8f-e4fa-4897-8a03-98e5f8357ab2" />
Admin panel.

---

## Features

- **Zero-Configuration Setup:** Configure your PostgreSQL connection and initialize core system tables directly from the admin interface.
- **JSON-Driven Data Grid (CRUD):** Generate tables and forms from `schema.json` with support for nested relations, constraints, and enum color states.
- **Inline Editing and Safe API Flow:** Update records directly in the grid using PATCH while keeping request handling centralized in `api.php`.
- **Dashboard Engine:** Build metrics and grouped summaries using COUNT, SUM, AVG, MIN, MAX, and GROUP BY operations on PostgreSQL data.
- **Calendar and Notifications:** Map date-based records to calendar views and trigger scheduled reminders through the cron notification runner.
- **Visual Admin Panel:** Manage schema, dashboards, calendar settings, users, and security options from `/admin`.
- **Audit Logging:** Data changes are tracked in internal log tables for traceability.
- **Export and Navigation Tools:** Use CSV export and pagination modules for day-to-day data operations.

---

## Project Structure

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
|- assets/
|  |- css/                   # Frontend style files
|  |- icons/                 # Icon assets used by the UI
|  |- img/                   # Image assets (logos, screenshots)
|  `- js/                    # Frontend JavaScript modules
|- cron/
|  `- cron_notifications.php # Scheduled event notification runner
|- includes/
|  |- api_helpers.php        # Shared API validation/response helpers
|  `- db.php                 # PostgreSQL connection and DB utilities
|- templates/
|  `- template.php           # Base page template/layout wrapper
|- api.php                   # Main application API endpoint (CRUD)
|- api_notifications.php     # Notification API endpoint
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
|- README.md                 # Main project documentation
```

---

## Getting Started

### Prerequisites

- PHP 8.0+
- PostgreSQL 14+
- Web server (Apache or Nginx) or PHP built-in server
- Git

### 1. Clone the repository

```bash
git clone https://github.com/wrobeltomasz/open-sparrow.git
cd open-sparrow
```

### 2. Run with Docker (Quick Start)
If you have Docker installed, you can start the entire stack with a single command. This handles PHP, Nginx, and PostgreSQL for you:

```bash
# Set permissions and start containers
sudo chown -R 82:82 includes/ && docker compose up -d --build
```

Security Note
1. The includes/ directory stores database.json and dashboard.json.
2. .htaccess file is included to block public web access to these files.
3. Important: Ensure includes/*.json is added to your .gitignore before committing changes to avoid leaking credentials.

The app will be available at: http://localhost:8080

### 3. Install dependencies

There is no dependency install step required for the current repository state.

### 4. Set up environment variables (.env example)

OpenSparrow can read PostgreSQL environment variables:

```dotenv
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=opensparrow
PGUSER=postgres
PGPASSWORD=postgres
```

Important: there is no `.env` loader in the current codebase. Define these variables in your server or shell environment, or use the admin UI Database tab.

### 5. Configure database connection from Admin

Open the admin panel:

- http://localhost/open-sparrow/admin

Log in with default credentials:

- Password: `admin` (no username required — the admin panel only asks for a password)

Then go to the Database tab:

1. Enter host, port, database, username, and password.
2. Save configuration.

The settings are stored in `includes/database.json`.

### 6. Run database migrations (system initialization)

In Admin -> System Health, click Initialize System Tables.

This creates required tables in schema `app`, including:

- `app.users`
- `app.users_log`
- `app.users_notifications`

This is the migration-equivalent step for the current project.

### 7. Start the development server

Option A (recommended): serve through Apache/Nginx and open:

- http://localhost/open-sparrow/

Option B (quick local):

```bash
php -S localhost:8000
```

Then open:

- http://localhost:8000/admin

### 8. Start building your app

After setup:

1. Open the Schema tab and sync existing tables.
2. Configure views and field behavior.
3. Use `index.php`, `dashboard.php`, and `calendar.php` as your runtime entry points.

On a fresh install, a default app user is seeded automatically (username: `test`).
Use these credentials to log into the main app at `login.php`.
Change them before going to production.

---

## Contributing

Contributions are welcome. Please follow [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## License

This project is licensed under the **GNU Lesser General Public License v3.0 (LGPL v3)**.
You may use OpenSparrow in open-source and closed-source commercial projects.
If you modify core OpenSparrow files, those modifications must remain under the same license.
See [LICENCE](LICENCE) for full details.
