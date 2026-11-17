# EAFC League

Laravel 13 port of the original PHP/JS EAFC League management app: public homepage with standings,
player registration and status lookup, and an admin dashboard (players, seasons, fixtures/results, audit log).

## Setup

Requirements: PHP 8.3+, Composer, MySQL/MariaDB (or SQLite).

```bash
composer install
cp .env.example .env          # then set DB_* (and ADMIN_USERNAME / ADMIN_PASSWORD)
php artisan key:generate
php artisan migrate --seed    # creates tables + the starter admin
php artisan serve             # http://localhost:8000
```

Log in at `/login` with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` (default `admin` / `admin123` — change it).
For a zero-config start use SQLite: `DB_CONNECTION=sqlite`, `touch database/database.sqlite`, remove the other `DB_*` lines.

Run the tests with `php artisan test` (they use in-memory SQLite).

## Layout

| Original | Laravel |
|---|---|
| `public/*.html` | `resources/views/pages/*.blade.php` on `layouts/app.blade.php` |
| `public/js`, `public/styles/main.css` | `public/js`, `public/css/main.css` |
| `api/index.php` + `routes.php` | `routes/api.php` (prefix `/api`), pages in `routes/web.php` |
| `api/controllers/*` | `app/Http/Controllers/Api/*` |
| `api/models/*` (PDO) | Eloquent models in `app/Models` (`Match` → `GameMatch`, reserved word) |
| `api/systemlogs/logger.php` | `app/Services/SystemLogger.php` |
| standings SQL (`ReportModel`) | `app/Services/SeasonReport.php` |
| fixture generation (`MatchModel`) | `app/Services/FixtureGenerator.php` |
| `eafc_league.sql` | `database/migrations/*`, `database/seeders/DatabaseSeeder.php` |
| `$_SESSION['admin_id']` | `admin` auth guard (`config/auth.php`), `admins` table |

API endpoints and JSON payloads are unchanged (`{"success": true, ...}`), now at `/api/...` instead of
`api/index.php?route=...`. Requests carry a CSRF token (`<meta name="csrf-token">` → `X-CSRF-TOKEN` header, handled in `public/js/utils.js`).

## Behaviour changes worth knowing

- **Auth**: the dashboard is protected server-side (redirects to `/login`); `GET /admin/login` (credentials via GET) is gone; login is rate-limited and regenerates the session.
- **Seeded admin**: the sample hash in the old SQL file did not match `admin123`; the seeder now hashes the password from `.env`.
- **Standings bug fixed**: unplayed fixtures used to count as a loss for both players. Only matches with a recorded score count now. Rejected/pending players with no fixtures no longer appear in the table.
- **Privacy**: the public season report no longer includes players' phone numbers.
- **Clean sheets** are aggregated per player (previously a player could appear twice, once for home and once for away).
- **Fixtures**: pairings are shuffled *before* dates are assigned (the old code shuffled afterwards, so the calendar was still ordered by pair); unknown season → 404, fewer than two approved players → 422 JSON error instead of a PHP exception.
- **Idempotent updates**: re-approving a player, re-recording the same score, or saving an unchanged profile no longer returns an error (the old code treated "0 rows changed" as failure).
- **System log**: `system_logs.admin_id` is nullable. Anonymous actions (lookups, registrations, failed logins) are logged with no admin and show as "System" in the UI, instead of being attributed to the first admin.
- **Dashboard scripts**: the section scripts are loaded with the page rather than lazily, so their setup runs the first time a tab is opened.
- Seasons: end date must not be before start date; duplicate names return 409.

## Moving existing data

The migrations create the schema from scratch. Point `.env` at a **new** database, then copy rows over from the old one
(`players`, `seasons`, `matches`, `admins`, `system_logs`). Existing `admins.password` bcrypt hashes work as-is.
