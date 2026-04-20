# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**OpenSparrow** — schema-driven PHP platform for generating CRUD apps, dashboards, and calendars on PostgreSQL. Configuration (not code) drives tables, forms, widgets, and workflows.

- Stack: PHP 8.0+, PostgreSQL 14+, vanilla JS (ES6+), no composer/npm
- Deploy: Docker (`docker-compose.yml`) or Apache/Nginx
- License: LGPL v3

## Layout

- `api.php` — single API gateway (GET/POST/PATCH/DELETE)
- `api_schema.php`, `api_fk.php`, `api_files.php`, `api_notifications.php` — specialized endpoints
- `admin/` — admin panel (schema/dashboard/calendar/user editors)
- `includes/` — backend helpers; `db.php` = PostgreSQL access, `api_helpers.php` = request/response
- `assets/` — static `css/`, `js/`, `icons/`, `img/`
- `cron/` — scheduled workers (e.g. notifications)
- `templates/` — layout wrappers
- `tests/` — Selenium E2E suite
- `storage/files/` — user uploads
- Config JSON: `schema.json`, `dashboard.json`, `includes/database.json`

System tables live in the PG schema from `includes/database.json` → `schema` (default `app`), all prefixed `spw_`.

## Conventions

- PSR-12 — enforced via `phpcs.xml`. Check with `php phpcs.phar`, fix with `php phpcbf.phar`.
- Route data through `api.php` rather than adding new endpoints unless a specialized one already exists.
- Never expose internal relations directly — use `api_schema.php` / `api_fk.php` proxies.
- Keep business logic out of templates.
- Accessibility target: WCAG 2.1.

## Common tasks

```bash
# Run the stack
docker compose up -d --build            # http://localhost:8080

# Lint
php phpcs.phar --standard=phpcs.xml .
php phpcbf.phar --standard=phpcs.xml .

# E2E tests
cd tests && # follow tests/README
```

## Safety

- Do not commit `includes/database.json` or anything in `storage/`.
- Treat `spw_*` tables as system-owned — migrations go through the admin **Initialize System Tables** flow, not ad-hoc SQL.
- Audit-logged data changes must keep writing to the existing `*_log` tables.
