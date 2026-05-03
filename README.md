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

- **First-run setup wizard** — guided `setup.php` wizard appears automatically on first launch (no `database.json` present). Collects PostgreSQL credentials, tests the connection, creates the schema, initializes all system tables, and seeds the default admin account in one flow.
- **JSON-driven CRUD** — tables and forms generated from `schema.json` with nested relations, constraints, and enum color states.
- **Inline editing** — in-grid PATCH updates routed through a single `api.php` gateway.
- **Dashboard engine** — COUNT / SUM / AVG / MIN / MAX / GROUP BY widgets defined in `dashboard.json`.
- **Calendar & notifications** — date-based records on a calendar view, with scheduled reminders via cron.
- **Admin panel** — collapsible sidebar navigation with visual editors for schema, dashboards, calendar, workflows, files, and users at `/admin`. Unified login for all roles — no separate admin password.
- **Visual table builder** — create PostgreSQL tables from the admin UI with per-column type, NOT NULL, default value, index (btree/hash/unique), column comment (`COMMENT ON COLUMN`), and foreign key constraints. Timestamps preset adds `created_at`/`updated_at` automatically. Tables are registered in `schema.json` in the same step.
- **Audit logging & record snapshots** — every write is logged to `spw_users_log`; an optional record-snapshot module saves a full JSONB copy of each record after INSERT/UPDATE to `spw_record_snapshots`, toggled from the admin panel or via env var.
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
- **`setup.php` / `setup_api.php`** — first-run setup wizard and its API backend. Active only when `includes/database.json` is absent.
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
- `includes/database.json.example` — template for PostgreSQL connection configuration (see step 3 below)
- An empty `storage/files/` directory placeholder

**Steps:**

1. Download `opensparrow-vX.Y.Z.zip` from the Releases page.
2. Extract and upload the contents to your server root (e.g. `public_html/`) via FTP.
3. Make the `includes/` and `storage/files/` directories writable by the web server (typically `chmod 755` or `775`, depending on your host).
4. Open your site root in a browser — you will be automatically redirected to `/setup.php`. The **setup wizard** guides you through:
   - Testing your PostgreSQL connection
   - Choosing a schema name (default: `app`)
   - Initializing all system tables and creating the default admin account (`admin` / `admin`)
5. Go to `/login`, sign in as `admin` / `admin`. You are redirected to `/admin` automatically.
6. Go to **System → Users → Change pwd** and set a strong password immediately.

> **Note:** The ZIP contains no pre-configured JSON files except `database.json.example`. Your `includes/*.json` configuration files are created on first setup and are never overwritten during updates — existing configuration is always preserved.

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

All variables are read by `includes/config.php` on every request — the single source of configuration. If a variable is absent the documented default applies. There is no `.env` loader: export in your shell, container, or web-server virtual-host config.

**Docker dev shortcut:** `docker-compose.override.yml` sets `APP_ENV=development` and `SECURE_COOKIES=false` automatically when you run `docker compose up` locally.

#### Database

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host. Falls back to `PGHOST`. |
| `DB_PORT` | `5432` | PostgreSQL port. Falls back to `PGPORT`. |
| `DB_CONNECT_TIMEOUT` | `5` | Seconds before connection attempt times out. |
| `APP_TIMEZONE` | `Europe/Warsaw` | IANA timezone applied per PostgreSQL session. |
| `PGDATABASE` | — | PostgreSQL database name. |
| `PGUSER` | — | PostgreSQL user. |
| `PGPASSWORD` | — | PostgreSQL password. |
| `PGSCHEMA` | `app` | Schema for `spw_*` tables. Overridden by `schema` key in `database.json`. |

#### Session & cookies

| Variable | Default | Description |
|---|---|---|
| `SECURE_COOKIES` | `true` | Set `false` on plain HTTP (local dev). |
| `SESSION_SAMESITE` | `Lax` | Cookie SameSite policy. Do not change to `Strict` — it causes `ERR_TOO_MANY_REDIRECTS` on the login→admin redirect. |
| `SESSION_MAX_LIFETIME` | `28800` | Hard session expiry in seconds (8 h). |

#### Authentication & rate limiting

| Variable | Default | Description |
|---|---|---|
| `IP_HASH_SALT` | *(none)* | **Required in production.** HMAC secret for IP pseudonymisation in login rate-limiting. |
| `LOGIN_MAX_ATTEMPTS_PER_IP` | `20` | Failed login threshold per IP before lockout. |
| `LOGIN_MAX_ATTEMPTS_PER_USERNAME` | `5` | Failed login threshold per username before lockout. |
| `LOGIN_LOCKOUT_MINUTES` | `15` | Lockout window in minutes. |

#### Application behaviour

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `production` | Runtime environment. |
| `DEMO_MODE` | `false` | Set `true` to block all write operations in the admin API (safe for public demos). |
| `RECORD_SNAPSHOTS_ENABLED` | `false` | Enable record snapshot capture after every INSERT/UPDATE. Overrides the admin panel toggle in `includes/settings.json`. |
| `FILES_MAX_SIZE_MB` | `20` | Default upload size limit when not set in `files.json`. |
| `THUMBNAIL_MAX_WIDTH` | `300` | Max thumbnail width in pixels. |
| `NOTIFICATIONS_DROPDOWN_LIMIT` | `10` | Max items in the bell notification dropdown. |
| `HSTS_MAX_AGE` | `31536000` | HSTS `max-age` in seconds (1 year). Set `0` to disable on plain HTTP. |

### 6. First-run setup (Docker or bare server)

On a fresh installation — when `includes/database.json` does not exist — any request to the application is automatically redirected to the **setup wizard** at `/setup.php`.

The wizard walks you through four steps:

1. **Welcome** — intro and requirements overview.
2. **Database Connection** — enter host, port, database name, username, and password. Click **Test Connection** to verify before proceeding.
3. **Schema** — choose the PostgreSQL schema name (default: `app`). Optionally tick *Create schema if not exists*. The default admin account (`admin` / `admin`) is shown here for reference.
4. **Review & Initialize** — confirm settings and click **Initialize System Tables**. The wizard creates all `spw_*` tables, seeds the admin account, and writes `includes/database.json`.

After initialization you are redirected to `/login`. Sign in as `admin` / `admin`, then immediately go to **System → Users → Change pwd** and set a strong password.

> Once `includes/database.json` exists, the setup wizard is permanently inaccessible — all entry points redirect to `/login` instead.

### 7. User roles

All accounts are stored in `spw_users` and managed from **System → Users**. Three roles are available:

| Role | Admin panel | Frontend app |
|---|---|---|
| `admin` | ✅ Full access | ❌ Blocked |
| `editor` | ❌ Blocked | ✅ Full CRUD |
| `viewer` | ❌ Blocked | 👁 Read-only |

- **Password reset:** click **Change pwd** next to any user. For your own account the current password is required; for other accounts the admin can override without it.
- Re-run **Initialize System Tables** after every upgrade — it uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE … ADD COLUMN IF NOT EXISTS` and also migrates legacy roles (`full → editor`, `readonly → viewer`).

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
- **Authentication:** all roles share a single login page (`/login`). The admin panel (`/admin`) requires role `admin`. Frontend pages require role `editor` or `viewer`. There is no separate admin password file — all accounts live in `spw_users`.
- **Session security:** sessions include a User-Agent fingerprint and an 8-hour absolute lifetime to guard against hijacking and stale sessions.

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and sign the [Contributor License Agreement (CLA)](CLA.md) before opening a pull request.

---

## License

Licensed under the **GNU Lesser General Public License v3.0 (LGPL v3)**. You may use OpenSparrow in open-source and closed-source commercial projects. Modifications to core OpenSparrow files must remain under the same license. See [LICENCE](LICENCE) for details.
