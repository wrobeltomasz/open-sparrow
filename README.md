# OpenSparrow 🐦 

![License](https://img.shields.io/badge/license-LGPL%20v3-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.x-purple.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)

**OpenSparrow** is an open-source, schema-driven PHP + PostgreSQL platform with a vanilla JavaScript frontend. It allows you to build powerful data management systems (CRUD interfaces, calendars, and dashboards) directly from JSON configurations—or by clicking through the built-in visual Admin Panel!

---

## 🇵🇱 Opis projektu (Polish)

**OpenSparrow** to zaawansowana platforma do zarządzania bazą danych PostgreSQL z wykorzystaniem PHP oraz czystego JavaScriptu. System nie wymaga pisania skomplikowanego kodu HTML/JS dla każdego widoku – interfejs generuje się dynamicznie na podstawie struktury JSON (którą można wyklikać we wbudowanym panelu `/admin`).

### Główne funkcje:
- 🔐 **Wbudowana autoryzacja:** System logowania i zabezpieczenia sesyjne chroniące dane od razu po instalacji.
- 🛠 **Wizualny Kreator (Admin UI):** Graficzny interfejs do budowania tabel, relacji (Foreign Keys) oraz formularzy.
- 📊 **Dynamiczne Dashboardy:** Konfiguruj widgety (listy, wykresy, kafelki statystyk) poprzez prosty plik JSON.
- 📅 **Kalendarze:** Przypisuj rekordy w bazie do osi czasu i zarządzaj zdarzeniami w widoku kalendarza.
- ⚡ **Szybki Data Grid:** Paginacja, wyszukiwarka globalna, sortowanie i eksport do CSV działające po stronie klienta i API.

### 🚀 Instalacja w 3 krokach
1. Sklonuj repozytorium na swój serwer (wymagane PHP > 8.0 i PostgreSQL).
   ```bash
   git clone [https://github.com/wrobeltomasz/open-sparrow.git](https://github.com/wrobeltomasz/open-sparrow.git)
