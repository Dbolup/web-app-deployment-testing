# TenderFlow AI

AI-powered UK government tender discovery and qualification platform.

---

## Project structure

```
tender-flow-ai/
├── app/               # Next.js 16 App Router pages
├── components/        # Shared React components
├── lib/               # API client and type definitions
└── backend/           # Django 6 REST API
    ├── accounts/      # Auth, users, workspaces, teams
    ├── ai_review/     # Claude AI review engine
    ├── tenders/       # Tender ingestion and search
    ├── pipeline/      # Kanban pipeline
    └── dashboard/     # Stats and activity feed
```

---

## Frontend

### Prerequisites

- Node.js 18+

### Setup

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run

```bash
npm run dev
```

Open [http://localhost:3005](http://localhost:3005).

---

## Backend

### Prerequisites

- Python 3.11+
- pip

### Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv env
source env/bin/activate        # macOS / Linux
# env\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
```

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `SECRET_KEY` | Django secret key — generate one with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` | Yes |
| `DEBUG` | `True` for local development | No (default `True`) |
| `ANTHROPIC_API_KEY` | API key from [console.anthropic.com](https://console.anthropic.com) — needed for AI reviews | Yes |
| `FIND_TENDER_API_KEY` | API key for [find-tender.service.gov.uk](https://www.find-tender.service.gov.uk) — needed to ingest tenders | No (public endpoint works without one) |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s), comma-separated | No (default `http://localhost:3005`) |
| `DATABASE_URL` | Defaults to SQLite (`db.sqlite3`). Set a Postgres URL for production | No |

### Run migrations and create a superuser

```bash
python manage.py migrate
python manage.py createsuperuser
```

### Start the development server

```bash
python manage.py runserver
```

The API will be available at [http://localhost:8000](http://localhost:8000).

Interactive API docs (Swagger UI) are at [http://localhost:8000/api/schema/swagger-ui/](http://localhost:8000/api/schema/swagger-ui/).

### Ingest tenders

Tenders are pulled from the UK government Find a Tender Service. Run the management command to populate the database:

```bash
python manage.py fetch_tenders
```

You can also trigger a fetch from the API — `POST /api/tenders/fetch/` — which the frontend calls when needed.

---

## Running both together

Open two terminal tabs:

```bash
# Tab 1 — backend
cd backend && source env/bin/activate && python manage.py runserver

# Tab 2 — frontend
npm run dev
```
