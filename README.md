<div align="center">

<img width="100" height="100" alt="opensparrow-logo" src="https://github.com/user-attachments/assets/b4793826-edc3-4ede-99e1-bdbd9c12f0bb" />

  <h1>OpenSparrow</h1>

  <p><strong>Schema-driven PHP platform to build CRUD apps, dashboards, and calendars on PostgreSQL in minutes.</strong></p>

  <p>
    <a href="LICENCE"><img src="https://img.shields.io/badge/License-LGPL%20v3-blue.svg" alt="License: LGPL v3" /></a>
    <a href="https://www.php.net/"><img src="https://img.shields.io/badge/PHP-8.1%2B-777BB4?logo=php&logoColor=white" alt="PHP 8.1+" /></a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript ES6+" /></a>
    <a href="#"><img src="https://img.shields.io/badge/dependencies-none-brightgreen" alt="No dependencies" /></a>
  </p>

  ![E2E Tests](https://github.com/wrobeltomasz/open-sparrow/actions/workflows/e2e-tests.yml/badge.svg)
  ![CodeQL Analysis](https://github.com/wrobeltomasz/open-sparrow/actions/workflows/codeql.yml/badge.svg)
  ![Docker Lint](https://github.com/wrobeltomasz/open-sparrow/actions/workflows/docker-lint.yml/badge.svg)
  [![Release ZIP](https://github.com/wrobeltomasz/open-sparrow/actions/workflows/release-zip.yml/badge.svg)](https://github.com/wrobeltomasz/open-sparrow/actions/workflows/release-zip.yml)

</div>

---

## Overview

OpenSparrow is a JSON schema-driven platform for building internal systems. Tables, forms, dashboards, and calendars are generated from configuration files, so business logic stays decoupled from infrastructure. Self-hosted on PostgreSQL — no vendor lock-in, full data ownership.

> **No Composer. No npm. No build step.**  
> Drop the files, point to PostgreSQL, open `/admin`. That's it.

Demo: https://demo.opensparrow.org

---

## Preview

<img width="1720" height="692" alt="20260420_banner" src="https://github.com/user-attachments/assets/0da4a0c6-667f-4559-87fc-1cb0a729473f" />

---

## Features

- **Zero-configuration setup** — configure PostgreSQL and initialize system tables from the admin UI.
- **JSON-driven CRUD** — tables and forms generated from `schema.json` with nested relations, constraints, and enum color states.
- **Inline editing** — in-grid PATCH updates routed through a single `api.php` gateway.
- **Dashboard engine** — COUNT / SUM / AVG / MIN / MAX / GROUP BY widgets defined in `dashboard.json`.
- **Calendar & notifications** — date-based records on a calendar view, with scheduled reminders via cron.
- **Admin panel** — visual editors for schema, dashboards, calendar, users, and security at `/admin`.
- **Audit logging** — data changes tracked in internal log tables.
- **CSV export & pagination** — built-in grid utilities.
- **Workflows builder** — multi-step wizards linking parent/child records across tables.
- **File management** — per-record attachments with tagging and search, configurable via the admin panel.
- **WCAG 2.1 focus** — accessibility-oriented UI.
- *(Planned)* REST API and webhook engine for n8n / Make / custom integrations.

---

## Project Structure

### Core directories
- **`src/`** — OOP application layer (PSR-4, no Composer). Namespaced under `App\`. Sub-directories: `Audit/`, `Csrf/`, `Domain/`, `Form/`, `Http/`, `Persistence/`, `Repository/`, `Support/`. Loaded via `includes/autoload.php`; wired in `includes/bootstrap.php`.
- **`admin/`** — management panel (schema editor, users, security settings).
- **`assets/`** — static frontend resources (`css/`, `js/`, `icons/`, `img/`).
- **`includes/`** — backend helpers. `config.php` centralizes env-driven configuration; `db.php` centralizes PostgreSQL access; `api_helpers.php` holds request/response helpers; `autoload.php` registers the PSR-4 class loader; `bootstrap.php` wires all OOP dependencies.
- **`cron/`** — scheduled workers (e.g. `cron_notifications.php`).
- **`templates/`** — layout wrappers (`template.php`).
- **`tests/`** — E2E Selenium suite.
- **`storage/files/`** — user-uploaded files.

### Key files
- **`api.php`** — main API gateway (GET / POST / PATCH / DELETE).
- **`index.php`** — default landing / data entry page.
- **`dashboard.php` / `calendar.php`** — user-facing visualization and scheduling modules.
- **`login.php` / `logout.php`** — session and authentication.
- **`create.php` / `edit.php`** — record create/update forms.
- **`api_schema.php`** — filtered schema endpoint for the frontend (hides backend-only structure).
- **`api_fk.php`** — proxy endpoint for foreign-key dropdowns (never exposes internal relations).
- **`Dockerfile` / `docker-compose.yml`** — containerized deployment.
- **`phpcs.xml`** — PSR-12 ruleset.

---

## Getting Started

### Prerequisites

- PHP 8.1+
- PostgreSQL 14+
- Apache, Nginx, or the PHP built-in server
- Git

### 1. Clone

```bash
git clone https://github.com/wrobeltomasz/open-sparrow.git
cd open-sparrow
```

### 2. Install via ZIP (FTP / shared hosting)

If you are deploying to shared hosting or any server without Docker, download the pre-built ZIP from the [Releases page](https://github.com/wrobeltomasz/open-sparrow/releases/latest) instead of cloning.

Each release ZIP is built automatically by GitHub Actions and includes:
- All PHP, JS, and CSS files ready to serve
- `includes/VERSION` stamped with the release tag (e.g. `v1.2.3`) — used by the admin System Health panel to display the current version
- An empty `storage/files/` directory placeholder

**Steps:**

1. Download `opensparrow-vX.Y.Z.zip` from the Releases page.
2. Extract and upload the contents to your server root (e.g. `public_html/`) via FTP.
3. Create the `includes/` directory and make it writable by the web server.
4. Open `/admin` in your browser and configure the database connection.
5. Run **Initialize System Tables** from the System Health tab.

> **Note:** The ZIP contains no JSON configuration files. Your `includes/*.json` files are never overwritten during an upload — existing configuration is always preserved.

### 3. Run with Docker (quick start)

```bash
# Create required directories
mkdir -p includes storage/files

# Set permissions (82:82 is www-data in Alpine)
sudo chown -R 82:82 includes/ storage/
sudo chmod -R 775 includes/ storage/

# Start the stack (PHP + Nginx + PostgreSQL)
docker compose up -d --build
```

Available at **http://localhost:8080**.

### 4. Dependencies

None. The repository has no composer/npm step.

### 5. Environment variables (optional)

All variables are read by `includes/config.php` on every request. If a variable is absent, the documented default applies.

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `production` | Runtime environment. Set to `development` to enable `SameSite=Lax` cookies (required on HTTP). |
| `SECURE_COOKIES` | `true` | Set to `false` when running on plain HTTP (local dev, Docker on localhost). |
| `DB_HOST` | `localhost` | PostgreSQL host. Falls back to `PGHOST` if `DB_HOST` is unset. |
| `DB_PORT` | `5432` | PostgreSQL port. Falls back to `PGPORT` if `DB_PORT` is unset. |
| `PGDATABASE` | — | PostgreSQL database name. |
| `PGUSER` | — | PostgreSQL user. |
| `PGPASSWORD` | — | PostgreSQL password. |
| `PGSCHEMA` | `app` | Schema for OpenSparrow system tables (`spw_*`). Overridden by `schema` key in `includes/database.json`. |

> There is no `.env` loader. Export these in your shell, container environment, or web-server virtual-host config. All connection details can alternatively be configured from the admin UI (written to `includes/database.json`).

**Docker dev shortcut:** `docker-compose.override.yml` (included in the repo) sets `APP_ENV=development` and `SECURE_COOKIES=false` automatically when you run `docker compose up` locally.

### 6. Configure the database from Admin

Open **http://localhost:8080/admin** and log in with the default master password: `admin` *(no username — the admin panel asks only for a master password)*.

In the **Database** tab:

1. Enter host, port, database, username, and password.
2. *(Optional)* In **System Schema**, set the PostgreSQL schema for OpenSparrow system tables (`spw_users`, `spw_files`, etc.). Defaults to `app`.
3. Click **Save File**.

Settings are written to `includes/database.json`. The `schema` key is read by `sys_schema()` in `includes/db.php` and used to qualify every system-table query.

### 7. Initialize system tables

In the admin panel → **System Health** → **Initialize System Tables**. This creates all `spw_`-prefixed tables in the configured schema:

- `spw_users`
- `spw_users_log`
- `spw_users_notifications`
- `spw_users_notifications_log`
- `spw_files`
- `spw_login_attempts`

Re-run this after every upgrade — it uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, so it is safe to execute on an existing database.

### 8. Run without Docker

*Skip this if you used Docker in step 2.*

**Option A** — serve via Apache/Nginx and open:
```
http://localhost/open-sparrow/
```

**Option B** — PHP built-in server:
```bash
php -S localhost:8000
```
Open **http://localhost:8000/admin**.

---

## Updating via FTP

1. Go to the [Releases page](https://github.com/wrobeltomasz/open-sparrow/releases/latest) and download the latest `opensparrow-vX.Y.Z.zip`.
2. **Before uploading** — export your configuration from the admin panel: **Configuration → Export config files**. Keep this backup safe.
3. Extract the ZIP and upload all files to your server via FTP, overwriting existing files.
4. Your `includes/*.json` files are **not included** in the ZIP, so your database connection, schema, dashboards, and all other settings are preserved automatically.
5. Log in to `/admin` → **System Health** → **Initialize System Tables** to apply any new system table migrations.
6. Check **System Health** — the version shown should match the release tag you just uploaded.

---

## Security & Configuration

Configuration lives in `includes/database.json`, protected by `.htaccess`. Environment variables (see section 5) take precedence and are the recommended approach for containerized deployments.

- **Production:** deny public web access to `includes/` at the web-server level.
- **Cookies:** `SECURE_COOKIES=true` (default) enforces the `Secure` flag. Set to `false` only on plain HTTP environments.

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and sign the [Contributor License Agreement (CLA)](CLA.md) before opening a pull request.

---

## License

Licensed under the **GNU Lesser General Public License v3.0 (LGPL v3)**. You may use OpenSparrow in open-source and closed-source commercial projects. Modifications to core OpenSparrow files must remain under the same license. See [LICENCE](LICENCE) for details.
