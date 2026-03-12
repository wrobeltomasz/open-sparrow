
# OpenSparrow 🐦 

![License](https://img.shields.io/badge/license-LGPL%20v3-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.x-purple.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)

---

## 🇵🇱 Opis projektu

**OpenSparrow** to zaawansowana, napędzana konfiguracją JSON platforma do budowy systemów zarządzania bazą danych (ERP, CRM, panele administracyjne) wykorzystująca PHP, PostgreSQL oraz czysty JavaScript (Vanilla JS).

Rdzeniem systemu jest architektura "Schema-Driven". Zamiast pisać powtarzalny kod dla każdego widoku, definiujesz strukturę tabel, relacji i formularzy w plikach JSON. Platforma dynamicznie generuje na ich podstawie kompletny, bezpieczny interfejs użytkownika z możliwością edycji danych w locie, wizualizacji na wykresach oraz obsługą zdarzeń w czasie rzeczywistym.

### ✨ Główne funkcje platformy

* **Napędzany JSON-em Data Grid (CRUD):** Automatyczne generowanie tabel i formularzy na podstawie `schema.json`. Obsługuje m.in. relacje kluczy obcych (wyświetlanie nazw zamiast ID), zagnieżdżone podtabele (Subtables), walidację pól (`not_null`, `readonly`) oraz niestandardowe kolorowanie statusów (`enum_colors`).
* **Interfejs API & Bezpieczeństwo:**
    Wbudowane, dynamiczne `api.php` obsługujące zapytania GET, POST, PATCH (edycja komórek w locie) i DELETE. Posiada twardą weryfikację sesji użytkownika i automatycznie loguje wszystkie modyfikacje danych do wewnętrznego dziennika (Audit Trail).
* **Wizualny Panel Administratora:**
    Wbudowany interfejs graficzny (`/admin`) pozwalający na wyklikanie całej struktury aplikacji bez konieczności ręcznej edycji plików. Posiada dedykowane zakładki do edycji Schematu, Dashboardów i Kalendarza oraz przełącznik "Debug Mode" ułatwiający deweloperom analizę błędów.
* **Silnik Dashboardów:**
    Mechanizm agregacji danych prosto z bazy PostgreSQL (obsługa COUNT, SUM, AVG, MIN, MAX i GROUP BY). Pozwala na szybkie budowanie kafelków statystycznych, list rankingowych i wykresów konfigurowanych w `dashboard.json`.
* **Kalendarz i Automatyczne Powiadomienia (CRON):**
    Możliwość zmapowania dowolnej tabeli z datą na widok kalendarza. Dedykowany skrypt `cron_notifications.php` codziennie sprawdza nadchodzące zdarzenia, łączy je z przypisanymi użytkownikami i automatycznie umieszcza powiadomienia w bazie danych, nie dopuszczając do powstawania duplikatów.

### 🚀 Szybki start

1. Sklonuj repozytorium na swój serwer (wymagane PHP > 8.0 i baza PostgreSQL).
```bash
git clone [https://github.com/wrobeltomasz/open-sparrow.git](https://github.com/wrobeltomasz/open-sparrow.git)

```
2. Skonfiguruj dostęp do bazy danych w plikach konfiguracyjnych i zaimportuj startową bazę SQL.
3. Przejdź pod adres `/login.php`, zaloguj się i otwórz katalog `/admin`, aby w graficznym interfejsie zbudować swój system!

### 📄 Licencja

Projekt dystrybuowany jest na licencji **GNU Lesser General Public License v3.0 (LGPL v3)**.
Pozwala ona na darmowe, w tym komercyjne, korzystanie z platformy (również z zamkniętym kodem źródłowym oprogramowania własnego). Zmiany w plikach rdzennym OpenSparrow muszą zostać udostępnione na tej samej licencji. Szczegóły znajdują się w pliku `LICENSE`.

---

## 🇬🇧 English

**OpenSparrow** is an advanced, JSON schema-driven platform for building database management systems (like ERPs, CRMs, and Admin Panels) using PHP, PostgreSQL, and Vanilla JavaScript.

At the core of the system is its "Schema-Driven" architecture. Instead of writing repetitive code for every view, you define your tables, relationships, and forms in JSON files. The platform dynamically generates a complete, secure user interface with inline data editing, charting capabilities, and event management.

### ✨ Core Features

* **JSON-Driven Data Grid (CRUD):**
Automatically generates tables and forms based on `schema.json`. It fully supports foreign key resolution (displaying names instead of IDs), nested sub-tables, field constraints (`not_null`, `readonly`), and custom status coloring (`enum_colors`).
* **Dynamic API & Security:**
The built-in `api.php` safely processes GET, POST, PATCH (for inline cell edits), and DELETE requests. It enforces strict session-based authentication and automatically records all data modifications into a secure internal audit log.
* **Visual Admin Panel:**
A built-in GUI (`/admin`) that allows you to configure your entire application structure without touching a single line of code. It features dedicated tabs for Schema, Dashboards, and Calendar configurations, along with a "Debug Mode" toggle for developers.
* **Dashboard Engine:**
A robust data aggregation engine directly executing SQL operations (COUNT, SUM, AVG, MIN, MAX, GROUP BY) on PostgreSQL. It enables the quick construction of statistical tiles, ranked lists, and charts configured via `dashboard.json`.
* **Calendar & Automated CRON Notifications:**
Map any database table with a date column to a visual calendar. A dedicated background script (`cron_notifications.php`) checks for upcoming events, joins them with assigned users, and securely pushes smart notifications into the database without duplicating them.

### 🚀 Quick Start

1. Clone the repository to your server (PHP > 8.0 and PostgreSQL required).
```bash
git clone [https://github.com/wrobeltomasz/open-sparrow.git](https://github.com/wrobeltomasz/open-sparrow.git)

```


2. Configure your database access credentials and import the initial SQL structure.
3. Access `/login.php`, log in, and navigate to the `/admin` panel to start building your system visually!

### 📄 License

This project is licensed under the **GNU Lesser General Public License v3.0 (LGPL v3)**.
You are permitted to use this platform freely in both open-source and closed-source commercial projects. Any modifications made to the core OpenSparrow files must be released under the same open-source license. See the `LICENSE` file for full details.
