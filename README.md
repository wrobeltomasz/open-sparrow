<div align="center">
 
![Banner](https://github.com/user-attachments/assets/5a1e24e3-f916-4222-aa1a-502b5e8988d6)

  <h1>OpenSparrow</h1>

  <p><strong>Schema-driven PHP platform to build CRUD apps, dashboards, and calendars on PostgreSQL in minutes.</strong></p>

  <p>
    <a href="LICENCE"><img src="https://img.shields.io/badge/License-LGPL%20v3-blue.svg" alt="License: LGPL v3" /></a>
    <a href="https://www.php.net/"><img src="https://img.shields.io/badge/PHP-8.0%2B-777BB4?logo=php&logoColor=white" alt="PHP 8.0+" /></a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript ES6+" /></a>
  </p>

  ![E2E Tests](https://github.com/wrobeltomasz/open-sparrow/actions/workflows/e2e-tests.yml/badge.svg)
  ![CodeQL Analysis](https://github.com/wrobeltomasz/open-sparrow/actions/workflows/codeql.yml/badge.svg)
  ![Docker Lint](https://github.com/wrobeltomasz/open-sparrow/actions/workflows/docker-lint.yml/badge.svg)

</div>

---

## Overview

OpenSparrow is a JSON schema-driven platform for building robust internal systems. It is designed to empower SMEs and organizations with **Digital Sovereignty** by providing a high-performance, self-hosted alternative to proprietary SaaS platforms. By decoupling business logic from the infrastructure, OpenSparrow ensures you maintain 100% ownership of your data and tools without vendor lock-in.

Demo: http://www.demo.opensparrow.org

---

## Preview

<img width="1536" height="1024" alt="opensparrow_screen" src="https://github.com/user-attachments/assets/d162cb35-a572-4cc8-aa16-6592b885a7ef" />

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
- **Standards-Based Interoperability:** (Planned) Built-in REST API and Webhook engine to prevent data silos and integrate with n8n, Make, or custom scripts.
- **Inclusive Design:** Focused on WCAG 2.1 compliance to ensure internal tools are accessible to everyone, including users with disabilities.
- **Workflows Builder:** Construct dynamic, multi-step wizards for complex data entry. Easily link parent and child records across multiple PostgreSQL tables and allow multiple record additions within a single guided process.
- **Files management:** A module for adding files to specific records, tagging, or searching. Configuration management via the admin panel.

---

## Project Structure

Below is an overview of the most important directories and files in the OpenSparrow project:

### Core Directories
* **`admin/`** – The administrative heart of the application. It contains the logic for the Management Panel, including database schema editing (`schema.js`), user management (`users.js`), and system security settings (`security.js`).
* **`assets/`** – Static resources for the frontend.
    * `css/` & `js/`: Application styles and core JavaScript logic (e.g., data grid, export, pagination).
    * `icons/` & `img/`: UI assets, logos, and visual elements.
* **`includes/`** – Essential backend components.
    * `db.php`: Central PostgreSQL connection and database utility functions.
    * `api_helpers.php`: Shared helpers for request validation and API responses.
* **`cron/`** – Background workers and scheduled tasks, such as `cron_notifications.php` for automated alerts.
* **`templates/`** – UI layout wrappers. The `template.php` file defines the standard look and feel of every page.
* **`tests/`** – Quality assurance suite, featuring end-to-end (E2E) Selenium tests.
* **`storage/files/`** – The location where files uploaded by system users are saved.

### Key Files
* **`api.php`** – The main application API gateway handling all CRUD operations.
* **`index.php`** – The default landing page and main data entry point for users.
* **`dashboard.php` / `calendar.php`** – Primary user-facing modules for data visualization and scheduling.
* **`login.php` / `logout.php`** – Secure session and authentication management.
* **`create.php` / `edit.php`** – Dedicated forms for creating and updating records.
* **`Dockerfile` / `docker-compose.yml`** – Containerization config for easy deployment and local development.
* **`phpcs.xml`** – Configuration for PHP CodeSniffer to ensure PSR-12 coding standards.
* **`api_schema.php`** – A secure endpoint that provides the necessary database structure to the frontend UI. It actively filters out sensitive, backend-only information (like hidden tables or exact relationship maps) and customizes the data validation rules based on the user's permission level.
* **`api_fk.php`** – A proxy endpoint designed to securely fetch related data (foreign keys) for dropdowns and inputs. It acts as a middleman, preventing the browser from ever knowing the exact internal database structure or table relationships while still providing the necessary options to the user.

---

## Getting Started

### Prerequisites

- PHP 8.0+
- PostgreSQL 14+
- Web server (Apache or Nginx) or PHP built-in server
- Git

Cieszę się, że wszystko w końcu działa! 

Zaktualizowałem Twoją instrukcję. Wprowadziłem do niej kilka kluczowych poprawek:
1. **Dodałem tworzenie folderu `storage/files` i nadawanie mu uprawnień** w sekcji Docker (krok 2) – dzięki temu nowi użytkownicy od razu unikną błędu z wgrywaniem plików, z którym przed chwilą walczyłeś. Ujednoliciłem też komendę `chmod`, by upewnić się, że foldery mają prawa zapisu.
2. **Ujednoliciłem adresy URL** – w kroku 2 piszesz, że aplikacja startuje na `localhost:8080`, więc poprawiłem ścieżki w kroku 5, aby wskazywały bezpośrednio na ten sam port.
3. W kroku 7 dopisałem informację, że dotyczy to tylko instalacji **bez użycia Dockera**, co zmniejszy zamieszanie (skoro uruchomili Dockera w kroku 2, to serwer już działa).

Oto gotowy do wklejenia w README (lub dokumentację) zaktualizowany kod w formacie Markdown:

***

### 1. Clone the repository

```bash
git clone https://github.com/wrobeltomasz/open-sparrow.git
cd open-sparrow
```

### 2. Run with Docker (Quick Start)

If you have Docker installed, you can start the entire stack with a single command. This handles PHP, Nginx, and PostgreSQL for you:

```bash
# Create required directories if they don't exist
mkdir -p includes storage/files

# Set permissions for the web server (82:82 is www-data in Alpine Linux)
sudo chown -R 82:82 includes/ storage/
sudo chmod -R 775 includes/ storage/

# Start the containers
docker compose up -d --build
```

The app will be available at: **http://localhost:8080**

### 3. Install dependencies

There is no dependency install step required for the current repository state.

### 4. Set up environment variables (.env example)

OpenSparrow can read PostgreSQL environment variables:
```env
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=opensparrow
PGUSER=postgres
PGPASSWORD=postgres
```
*Important:* there is no `.env` loader in the current codebase. Define these variables in your server or shell environment, or simply use the Admin UI Database tab.

### 5. Configure database connection from Admin

Open the admin panel:
**http://localhost:8080/admin**

Log in with default credentials:
* **Password:** `admin` *(no username required — the admin panel only asks for a master password)*

Then go to the **Database** tab:
1. Enter host, port, database, username, and password.
2. Click **Save configuration**.

*Note: The settings are stored securely in `includes/database.json`.*

### 6. Run database migrations (system initialization)

In the Admin Panel -> **System Health** tab, click **Initialize System Tables**.
This creates required tables in the `app` schema, including:
* `app.users`
* `app.users_log`
* `app.users_notifications`
* `app.files`

This is the migration-equivalent step for the current project.

### 7. Start the development server (Without Docker)

*If you used Docker in Step 2, you can skip this step!*

**Option A (recommended):** Serve through Apache/Nginx and open:
http://localhost/open-sparrow/

**Option B (quick local PHP server):**
```bash
php -S localhost:8000
```
Then open:
http://localhost:8000/admin

---

### Security & Configuration

Currently, settings are stored in `includes/database.json`. Access is restricted via `.htaccess`. 

- **Production Tip:** Ensure your web server is configured to deny public web access to the `includes/` directory. 
- **Planned Improvement:** Moving towards full Environment Variable (`.env`) support for improved security in containerized and cloud-native environments.

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and sign the
[Contributor License Agreement (CLA)](CLA.md) before opening a pull request.

---

## License

This project is licensed under the **GNU Lesser General Public License v3.0 (LGPL v3)**.
You may use OpenSparrow in open-source and closed-source commercial projects.
If you modify core OpenSparrow files, those modifications must remain under the same license.
See [LICENCE](LICENCE) for full details.
