# TenderFlow AI

AI-powered UK government tender discovery and qualification platform. It ingests
notices from the UK **Find a Tender Service**, scores them against a workspace's
company profile using Claude, and manages the bid/no-bid pipeline with a
human-in-the-loop review workflow.

---

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local development](#local-development)
  - [Frontend](#frontend-local)
  - [Backend](#backend-local)
  - [Running both together](#running-both-together)
- [Running with Docker (recommended)](#running-with-docker-recommended)
- [Environment variables](#environment-variables)
- [API surface](#api-surface)
- [Deployment](#deployment)
- [Operations runbook](#operations-runbook)

---

## Architecture

```
┌─────────────────┐         HTTP (REST + JWT)        ┌──────────────────────┐
│  Next.js 16     │  ───────────────────────────────▶│  Django 6 + DRF      │
│  frontend       │   NEXT_PUBLIC_API_URL points here │  REST API            │
│  (port 3005)    │◀───────────────────────────────  │  (port 8000)         │
└─────────────────┘                                   └──────────┬───────────┘
                                                                 │
                                          ┌──────────────────────┼───────────────────┐
                                          │                      │                   │
                                     ┌────▼─────┐         ┌───────▼──────┐    ┌────────▼────────┐
                                     │ Database │         │ Anthropic    │    │ Find a Tender   │
                                     │ (SQLite/ │         │ (Claude API) │    │ Service API     │
                                     │ Postgres)│         └──────────────┘    └─────────────────┘
                                     └──────────┘
```

- The **frontend** is a standalone Next.js app. The browser talks **directly** to
  the Django API — the API base URL is baked into the client bundle at build time
  via `NEXT_PUBLIC_API_URL` (see [Environment variables](#environment-variables)).
- Auth is **JWT** (access + refresh) issued by the backend. The frontend stores
  tokens in `localStorage` and mirrors the access token into a cookie so the
  Next.js middleware ([`middleware.ts`](middleware.ts)) can gate protected routes.
- The backend calls two external services: **Anthropic** (AI tender review) and the
  **Find a Tender Service** (tender ingestion).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, Radix UI |
| Backend | Django 6, Django REST Framework, SimpleJWT, drf-spectacular |
| AI | Anthropic Claude (`anthropic` SDK) |
| Database | SQLite (default) — Postgres-ready for production |
| Auth | JWT (access + refresh tokens) |
| Server (prod) | gunicorn (WSGI) for the API, Next.js standalone server for the frontend |

---

## Project structure

```
tender-flow-ai/
├── app/                  # Next.js 16 App Router pages
│   ├── login/ register/  # Auth pages (public)
│   ├── onboarding/       # Company-profile setup
│   ├── dashboard/        # Stats + activity feed
│   ├── discovery/        # Tender search & discovery
│   ├── pipeline/         # Kanban bid pipeline
│   ├── documents/        # Document management
│   └── settings/         # Workspace / team / account settings
├── components/           # Shared React components
├── lib/                  # API client (lib/api.ts) and types
├── middleware.ts         # Route gating based on the auth cookie
├── Dockerfile            # Frontend image (Next.js standalone)
├── docker-compose.yml    # Orchestrates frontend + backend
└── backend/              # Django 6 REST API
    ├── core/             # Settings, root URLconf, WSGI/ASGI
    ├── accounts/         # Auth, users, workspaces, teams, invitations
    ├── ai_review/        # Claude AI review engine
    ├── tenders/          # Tender ingestion and search
    ├── pipeline/         # Kanban pipeline
    ├── documents/        # Document storage & metadata
    ├── dashboard/        # Stats and activity feed
    ├── integrations/     # Third-party integrations
    ├── Dockerfile        # Backend image (gunicorn)
    └── entrypoint.sh     # Runs migrate + collectstatic on startup
```

---

## Local development

You can run the stack either **natively** (below) or with **Docker**
(see [Running with Docker](#running-with-docker-recommended) — recommended for a
one-command setup that mirrors deployment).

### Prerequisites

- **Node.js 20.9+** (Next.js 16 requires it)
- **Python 3.11+** and `pip`

### Frontend (local)

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the dev server (port **3005**):

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005).

### Backend (local)

```bash
cd backend

# Create and activate a virtual environment
python -m venv env
source env/bin/activate        # macOS / Linux
# env\Scripts\activate         # Windows

pip install -r requirements.txt

# Configure environment
cp .env.example .env           # then edit .env

# Database + admin user
python manage.py migrate
python manage.py createsuperuser

# Run (port 8000)
python manage.py runserver
```

The API is available at [http://localhost:8000](http://localhost:8000).
Interactive API docs (Swagger UI) are at
[http://localhost:8000/api/docs/](http://localhost:8000/api/docs/).

#### Ingest tenders

Tenders are pulled from the UK government Find a Tender Service:

```bash
python manage.py fetch_tenders
```

You can also trigger a fetch via the API (`POST /api/tenders/fetch/`), which the
frontend calls when needed.

### Running both together

Open two terminal tabs:

```bash
# Tab 1 — backend
cd backend && source env/bin/activate && python manage.py runserver

# Tab 2 — frontend
npm run dev
```

---

## Running with Docker (recommended)

The repo ships a multi-service Docker setup that builds and runs **both** the
frontend and backend with one command. This is the recommended path for new team
members and the basis for deployment.

### Prerequisites

- Docker Engine 24+ with the Compose plugin (`docker compose`)

### One-command start

```bash
docker compose up -d --build
```

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:3005 | Next.js standalone server |
| Backend API | http://localhost:8000 | gunicorn (3 workers) |
| API docs | http://localhost:8000/api/docs/ | Swagger UI |
| Django admin | http://localhost:8000/admin/ | |

### What the containers do

- **`backend`** ([`backend/Dockerfile`](backend/Dockerfile)) builds on
  `python:3.12-slim`, installs `requirements.txt` + gunicorn, and on every start
  runs [`backend/entrypoint.sh`](backend/entrypoint.sh) which:
  1. applies database migrations (`migrate --noinput`), then
  2. collects static files (`collectstatic --noinput`), then
  3. launches gunicorn (`core.wsgi:application` on `0.0.0.0:8000`).
- **`frontend`** ([`Dockerfile`](Dockerfile)) is a multi-stage build that produces
  a minimal Next.js **standalone** image (`output: "standalone"` in
  [`next.config.ts`](next.config.ts)) and runs as a non-root user.

### Data persistence

[`docker-compose.yml`](docker-compose.yml) bind-mounts the SQLite database and
uploaded media so data survives container restarts:

```yaml
volumes:
  - ./backend/db.sqlite3:/app/db.sqlite3
  - ./backend/media:/app/media
```

> ⚠️ The backend reads `backend/.env` via `env_file`. Create it before the first
> `docker compose up` (`cp backend/.env.example backend/.env`). Compose overrides
> `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` so the containerized hostnames work.

### Common commands

```bash
docker compose up -d --build      # build + start (detached)
docker compose logs -f backend    # tail backend logs
docker compose ps                 # service status
docker compose exec backend python manage.py createsuperuser
docker compose down               # stop and remove containers
docker compose down -v            # also remove named volumes
```

### ⚠️ Important: the API URL is baked at build time

`NEXT_PUBLIC_API_URL` is a Next.js **public** variable — it is inlined into the
browser bundle **during `docker compose build`**, not read at runtime. The default
is `http://localhost:8000` (set as a build arg in `docker-compose.yml`). If the
backend is reachable at a different origin (e.g. a deployed domain), you **must
rebuild** the frontend with the correct value:

```bash
docker compose build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.your-domain.com frontend
```

---

## Environment variables

### Frontend (`.env.local`, or build arg in Docker)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Django API. **Baked into the client bundle at build time.** | `http://localhost:8000` |

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `SECRET_KEY` | Django secret key — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` | **Yes (prod)** |
| `DEBUG` | `True` for local dev, **`False` in production** | No (default `True`) |
| `ALLOWED_HOSTS` | Comma-separated hostnames the API may serve | No (default `localhost,127.0.0.1`) |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s), comma-separated | No (default `http://localhost:3005`) |
| `ANTHROPIC_API_KEY` | Key from [console.anthropic.com](https://console.anthropic.com) — required for AI reviews | **Yes** |
| `FIND_TENDER_API_KEY` | Key for [find-tender.service.gov.uk](https://www.find-tender.service.gov.uk) | No (public endpoint works without one) |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Access-token lifetime | No (default `60`) |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Refresh-token lifetime | No (default `7`) |
| `APP_URL` | Public URL of the frontend (used in emails, e.g. invitations) | No |
| `MEDIA_ROOT` / `MEDIA_URL` | Uploaded-file location | No |
| `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_USE_SSL`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | SMTP settings for transactional email (team invites, etc.) | No |

See [`backend/.env.example`](backend/.env.example) for the full annotated list.

---

## API surface

All routes are prefixed with `/api/`. Auth uses JWT bearer tokens.

| Prefix | Module | Purpose |
|---|---|---|
| `/api/auth/` | `accounts` | Register, login, token refresh, profile, workspace, team, invitations |
| `/api/tenders/` | `tenders` | Tender search, detail, and ingestion (`POST /api/tenders/fetch/`) |
| `/api/pipeline/` | `pipeline` | Kanban pipeline items and stage transitions |
| `/api/documents/` | `documents` | Document upload and metadata |
| `/api/dashboard/` | `dashboard` | Stats and activity feed |
| `/api/integrations/` | `integrations` | Third-party integrations |
| `/api/ai-review/` | `ai_review` | Claude-powered tender scoring/review |
| `/api/docs/` · `/api/redoc/` · `/api/schema/` | drf-spectacular | Swagger UI · ReDoc · raw OpenAPI schema |

---

## Deployment

The Docker setup is deployment-ready, but a few things **must** be configured
before exposing it publicly.

### Pre-deploy checklist (DevOps)

1. **Secrets** — set a strong `SECRET_KEY`, `ANTHROPIC_API_KEY`, and SMTP
   credentials via your platform's secret manager (do **not** commit
   `backend/.env`; it is git-ignored).
2. **`DEBUG=False`** in the backend environment.
3. **`ALLOWED_HOSTS`** — include the API's public hostname(s).
4. **`CORS_ALLOWED_ORIGINS`** — include the frontend's public origin.
5. **`NEXT_PUBLIC_API_URL`** — rebuild the frontend image with the public API URL
   (it is baked at build time — see the warning above).
6. **Database** — for anything beyond a single-node demo, migrate off SQLite to
   **Postgres** (see below). SQLite via a bind mount does not scale across
   replicas and is not safe for concurrent writers.
7. **Static files** — with `DEBUG=False`, Django does **not** serve static assets
   (Django admin / DRF browsable API CSS). Front the API with a reverse proxy
   (nginx) that serves `backend/staticfiles/`, or add `whitenoise` to the backend.
   The app's JSON API works fine without this; only admin/docs styling is affected.
8. **TLS / reverse proxy** — terminate HTTPS at a load balancer or nginx in front
   of both services.

### Moving to Postgres

The database is currently configured for SQLite in
[`backend/core/settings.py`](backend/core/settings.py). For production:

1. Add a `db` service (Postgres) to `docker-compose.yml` (or use a managed
   Postgres instance).
2. Update the `DATABASES` setting to read from `DATABASE_URL` (the
   `.env.example` already documents the variable; wire it in `settings.py`).
3. Run `docker compose exec backend python manage.py migrate`.

### Build-only (CI/CD)

```bash
# Backend image
docker build -t tenderflow-backend:$(git rev-parse --short HEAD) backend/

# Frontend image (bake the public API URL)
docker build -t tenderflow-frontend:$(git rev-parse --short HEAD) \
  --build-arg NEXT_PUBLIC_API_URL=https://api.your-domain.com .
```

---

## Operations runbook

| Task | Command |
|---|---|
| Apply migrations | `docker compose exec backend python manage.py migrate` |
| Create admin user | `docker compose exec backend python manage.py createsuperuser` |
| Ingest tenders | `docker compose exec backend python manage.py fetch_tenders` |
| Tail logs | `docker compose logs -f backend` / `frontend` |
| Open a Django shell | `docker compose exec backend python manage.py shell` |
| Rebuild after code change | `docker compose up -d --build` |
| Health check (API) | `curl -I http://localhost:8000/api/docs/` |
| Health check (frontend) | `curl -I http://localhost:3005/login` |

> Migrations and `collectstatic` run automatically on every backend container
> start via [`entrypoint.sh`](backend/entrypoint.sh) — no manual step needed on
> deploy unless you are seeding data.
