# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Laravel 12 (PHP ^8.2) + Inertia.js 2 + React 19 + TypeScript + Vite 6 + Tailwind 4.
Auth: `laravel/sanctum` (API tokens) and `laravel/socialite` (Google OAuth). Routes are typed in the frontend via `tightenco/ziggy`. PDFs use `barryvdh/laravel-dompdf`. There is no Pest config (despite `pestphp/pest-plugin` being allowed); tests run on PHPUnit 11.

## Commands

```bash
# Backend
composer dev                       # concurrent: artisan serve + queue:listen + pail + vite
php artisan serve                  # backend only
php artisan migrate --seed
php artisan tinker

# Frontend (resources/ is the only formatted/linted area)
npm run dev                        # vite (HMR)
npm run build                      # production build
npm run build:ssr                  # build client + SSR bundles (entry: resources/js/ssr.tsx)
npm run types                      # tsc --noEmit
npm run lint                       # eslint . --fix
npm run format / npm run format:check

# Tests (PHPUnit, sqlite :memory:)
php artisan test                                       # all suites
php artisan test --testsuite=Unit
php artisan test --testsuite=Feature
php artisan test --filter=DashboardTest                # single test class
php artisan test tests/Feature/DashboardTest.php       # single file
```

## Architecture

This is a **role-based hospital management system** (Choros) with four hard-coded roles defined as constants on `App\Models\User`: `ROLE_ADMIN`, `ROLE_DOCTOR`, `ROLE_CLINICAL_STAFF`, `ROLE_PATIENT`. Almost every architectural choice mirrors this division.

### Role routing pattern

`routes/web.php` is partitioned into four middleware-protected blocks — one per role — each using its own URL prefix, name prefix, and middleware:

| Role | Prefix | Middleware | Controllers namespace |
|---|---|---|---|
| Admin | `/admin` | `AdminMiddleware` | `App\Http\Controllers\Admin\*` |
| Doctor | `/doctor` | `DoctorMiddleware` | `App\Http\Controllers\Doctor\*` |
| Clinical Staff | `/staff` | `ClinicalStaffMiddleware` | `App\Http\Controllers\ClinicalStaff\*` |
| Patient | `/patient` | `PatientMiddleware` | `App\Http\Controllers\Patient\*` |

`/dashboard` is a dispatch route that switches on `user_role` and redirects to the appropriate `{role}.dashboard`. The role middleware files (`app/Http/Middleware/*Middleware.php`) **both gate access and use `Inertia::share()` to inject role-specific navigation items into every page** — modifying a sidebar means editing the middleware, not a React component. There is also a parallel API surface at `routes/api.php` (Sanctum-guarded) primarily for `App\Http\Controllers\Api\Patient\PatientController` (mobile/external clients).

### Frontend organization mirrors the role split

```
resources/js/
  pages/{Admin,Doctor,ClinicalStaff,Patient}/*.tsx   # Inertia pages, resolved by createInertiaApp
  layouts/{Admin,Doctor,ClinicalStaff,Patient}Layout.tsx
  components/{admin,doctor,clinicalstaff,patient}/    # role-scoped components
  components/ui/                                      # shared shadcn-style primitives (Radix + cva)
```

The Inertia resolver in `resources/js/app.tsx` auto-globs `pages/**/*.tsx`, so controllers reference pages by their relative path string (e.g. `Inertia::render('ClinicalStaff/Profile', ...)`). The `@/*` TS alias points at `resources/js/*` (see `tsconfig.json` paths). Light mode is forced in `app.tsx` (`document.documentElement.classList.remove('dark')`) — do not re-enable theme toggling without removing that line.

### Shared Inertia props

`HandleInertiaRequests` is appended to the `web` middleware stack and shares on every request: `auth.user`, `flash.{success,error,info}`, `ziggy` (for the `route()` helper), and `name`. Role middlewares add `admin`/`doctor`/etc. namespaces on top of that. When adding a new global prop, decide whether it's truly cross-role (→ `HandleInertiaRequests`) or role-scoped (→ that role's middleware).

### Domain model

The medical data model is centered on `PatientRecord` (in `app/Models/`) with type/status enums declared as class constants:

- `record_type`: `medical_checkup`, `laboratory_test`, `medical_record`
- `status`: `pending`, `confirmed`, `completed`, `cancelled`
- JSON columns: `lab_results`, `vital_signs`, `prescriptions` (cast to array)
- Uses `SoftDeletes`

Related models include `Patient`, `Doctor`, `DoctorProfile`, `DoctorSchedule`, `DoctorService`, `HospitalService`, `Appointment`, `LabResult`, `Prescription`, `Receipt`, `RecordRequest` (cross-role workflow: patient requests record → clinical staff approves/denies), `StaffSchedule`, `Notification`. `User` is the central auth/role model and is referenced as foreign key by patient/doctor/staff records.

### Activity logging

`LogActivity` middleware is registered with alias `log.activity` in `bootstrap/app.php`. Apply it to routes whose access should be audited; logs land in `storage/logs/`. The admin "Logs Management" UI (see `docs/logs_management_feature.md`) reads/displays/downloads those files — when adding routes you want surfaced there, attach this middleware.

### PDF generation

Many controllers expose `generatePdf` / `printRecord` / `downloadPrescription` / `printReceipt` actions backed by `barryvdh/laravel-dompdf`. Print-friendly Blade or Inertia pages are co-located with their controllers — search for `Dompdf` or `view->loadView` when adding a new printable artifact.

### Ziggy + routes

The frontend uses `route('admin.appointments.show', id)` etc. via Ziggy. After adding a new named route, no codegen step is required — Ziggy serializes routes per-request through the shared Inertia prop. The committed `routes.txt` is a one-off dump and is **not** kept in sync automatically; don't rely on it.

## Conventions worth knowing

- **Database**: project ships with SQLite (`database/database.sqlite` is created on `post-create-project-cmd`) but `.env` controls the live connection. Tests always use sqlite in-memory (see `phpunit.xml`).
- **Migrations** are append-only and heavily incremental (many `add_*_to_*_table` / `fix_*` files). When changing a column, prefer a new migration over editing an old one.
- **PHP formatting**: `laravel/pint` (`./vendor/bin/pint`) — there is no npm script, run it directly.
- **Frontend lint/format scope**: `prettier` and the lint scripts only target `resources/`. `eslint.config.js` is flat config (ESLint 9).
- **No path alias for backend tests**: `composer.json` PSR-4 maps `Tests\\` → `tests/`.
- **One-off scripts**: `fix_migrations.php` (root) and routes like `/fix-appointments`, `/test-patient-search`, `/setup/create-notifications-table` in `routes/web.php` are ad-hoc maintenance shims — leave them unless explicitly cleaning up.
