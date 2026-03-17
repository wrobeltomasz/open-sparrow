# OpenSparrow 🐦 

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



### ✨ Core Features

* **Zero-Configuration Setup:** Forget about manual config file editing. Connect to your database and initialize the entire system structure with a single click directly from your browser!
* **JSON-Driven Data Grid (CRUD):** Automatically generates tables and forms based on `schema.json`. It fully supports foreign key resolution (displaying names instead of IDs), nested sub-tables, field constraints (`not_null`, `readonly`), and custom status coloring (`enum_colors`).
* **Dynamic API & Security:** The built-in `api.php` safely processes GET, POST, PATCH (for inline cell edits), and DELETE requests. It enforces strict session-based authentication and automatically records all data modifications into a secure internal audit log.
* **Visual Admin Panel:** A built-in GUI (`/admin`) that allows you to configure your entire application structure without touching a single line of code. It features dedicated tabs for Schema, Dashboards, Calendar configurations, built-in Server Diagnostics (System Health), and a "Debug Mode" toggle.
* **Dashboard Engine:** A robust data aggregation engine directly executing SQL operations (COUNT, SUM, AVG, MIN, MAX, GROUP BY) on PostgreSQL. It enables the quick construction of statistical tiles, ranked lists, and charts configured via `dashboard.json`.
* **Calendar & Automated CRON Notifications:** Map any database table with a date column to a visual calendar. A dedicated background script (`cron_notifications.php`) securely pushes smart notifications to users based on upcoming events.

### 🚀 Quick Start (60-Second Setup)

1. Clone the repository to your server (PHP > 8.0 and PostgreSQL required).


git clone [https://github.com/wrobeltomasz/open-sparrow.git](https://github.com/wrobeltomasz/open-sparrow.git)


2. Open your project URL in the browser pointing to the `/admin` directory (e.g., `http://localhost/open-sparrow/admin`).
3. Log in using the default password: **`admin`** (We highly recommend changing this in the *Security* tab later).
4. Navigate to the **Database** tab, enter your PostgreSQL credentials, and click **Save File**.
5. Navigate to the **System Health** tab and click the **"Initialize System Tables"** button. The system will automatically create the `app` schema and the required core user/log tables.
6. Done! Go to the **Schema** tab, click "Sync DB Tables," and start building your CRM visually!

### 📄 License

This project is licensed under the **GNU Lesser General Public License v3.0 (LGPL v3)**.
You are permitted to use this platform freely in both open-source and closed-source commercial projects. Any modifications made to the core OpenSparrow files must be released under the same open-source license. See the `LICENSE` file for full details.

---

## 🇵🇱 Opis projektu

**OpenSparrow** to zaawansowana, napędzana konfiguracją JSON platforma do budowy systemów zarządzania bazą danych (ERP, CRM, panele administracyjne) wykorzystująca PHP, PostgreSQL oraz czysty JavaScript (Vanilla JS).

Rdzeniem systemu jest architektura "Schema-Driven". Zamiast pisać powtarzalny kod dla każdego widoku, definiujesz strukturę tabel, relacji i formularzy w plikach JSON. Platforma dynamicznie generuje na ich podstawie kompletny, bezpieczny interfejs użytkownika z możliwością edycji danych w locie, wizualizacji na wykresach oraz obsługą zdarzeń w czasie rzeczywistym.

### ✨ Główne funkcje platformy

* **Zero-Configuration Setup:** Zapomnij o ręcznym edytowaniu plików PHP. Połączysz się z bazą danych i zainicjujesz strukturę systemu za pomocą jednego kliknięcia prosto z poziomu przeglądarki!
* **Napędzany JSON-em Data Grid (CRUD):** Automatyczne generowanie tabel i formularzy na podstawie `schema.json`. Obsługuje m.in. relacje kluczy obcych (wyświetlanie nazw zamiast ID), zagnieżdżone podtabele (Subtables), walidację pól (`not_null`, `readonly`) oraz niestandardowe kolorowanie statusów (`enum_colors`).
* **Interfejs API & Bezpieczeństwo:** Wbudowane, dynamiczne `api.php` obsługujące zapytania GET, POST, PATCH (edycja komórek w locie) i DELETE. Posiada twardą weryfikację sesji użytkownika i automatycznie loguje wszystkie modyfikacje danych do wewnętrznego dziennika (Audit Trail).
* **Wizualny Panel Administratora:** Wbudowany interfejs graficzny (`/admin`) pozwalający na wyklikanie całej struktury aplikacji. Posiada dedykowane zakładki do edycji Schematu, Dashboardów, Kalendarza, a także wbudowaną Diagnostykę Serwera (System Health) i przełącznik "Debug Mode".
* **Silnik Dashboardów:** Mechanizm agregacji danych prosto z bazy PostgreSQL (obsługa COUNT, SUM, AVG, MIN, MAX i GROUP BY). Pozwala na szybkie budowanie kafelków statystycznych, list rankingowych i wykresów konfigurowanych w `dashboard.json`.
* **Kalendarz i Automatyczne Powiadomienia (CRON):** Możliwość zmapowania dowolnej tabeli z datą na widok kalendarza. Dedykowany skrypt `cron_notifications.php` codziennie sprawdza nadchodzące zdarzenia i bezpiecznie wysyła powiadomienia do użytkowników.

### 🚀 Szybki start (Instalacja w 60 sekund)

1. Sklonuj repozytorium na swój serwer (wymagane PHP > 8.0 i baza PostgreSQL).

git clone [https://github.com/wrobeltomasz/open-sparrow.git](https://github.com/wrobeltomasz/open-sparrow.git)


2. Otwórz w przeglądarce adres Twojego projektu z końcówką `/admin` (np. `http://localhost/open-sparrow/admin`).
3. Zaloguj się domyślnym hasłem: **`admin`** (Zalecamy jego zmianę w zakładce *Security* po zalogowaniu).
4. Przejdź do zakładki **Database**, wpisz dane dostępowe do swojej (pustej) bazy PostgreSQL i kliknij **Save File**.
5. Przejdź do zakładki **System Health** i kliknij niebieski przycisk **"Initialize System Tables"**. System automatycznie utworzy schemat `app`, wymagane tabele użytkowników oraz logów.
6. Gotowe! Przejdź do zakładki **Schema**, kliknij "Sync DB Tables" i rozpocznij budowę swojego CRM-a!

### 📄 Licencja

Projekt dystrybuowany jest na licencji **GNU Lesser General Public License v3.0 (LGPL v3)**.
Pozwala ona na darmowe, w tym komercyjne, korzystanie z platformy (również z zamkniętym kodem źródłowym oprogramowania własnego). Zmiany w plikach rdzennym OpenSparrow muszą zostać udostępnione na tej samej licencji. Szczegóły znajdują się w pliku `LICENSE`.
