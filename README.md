# Personal Task Manager

A full-stack task management application built with Django REST Framework and React + TypeScript. Features JWT authentication, task CRUD with soft delete, tags, recurring tasks, and a warm-themed UI with multiple palettes.

## Features

### Backend
- **JWT Authentication** with token refresh and blacklisting
- **Custom User Model** with email as identifier
- **Task Management** with CRUD operations and soft delete/restore
- **Tags** — predefined and custom, color-coded
- **Recurring Tasks** — daily, weekly, monthly with configurable frequency
- **Filtering & Search** by status, priority, date range, tags
- **Pagination** and statistics endpoints
- **Bulk Actions** for task management

### Frontend
- **React 18** with TypeScript (strict type-checking)
- **3 Theme Palettes**: Amber, Terracotta, Gold (light/dark modes)
- **Responsive Design** with Tailwind CSS
- **PWA Ready** with offline support
- **Form Validation** with React Hook Form + Yup
- **Tag Management** — create, assign, filter by tags
- **Card & Table View** — switchable task list layouts

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5.0, Django REST Framework |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Nunito font |
| Database | PostgreSQL 15 |
| Auth | JWT (SimpleJWT) |
| WSGI Server | Gunicorn |
| Reverse Proxy | Nginx |
| Containerization | Docker, Docker Compose |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ with pnpm (for local dev)
- Python 3.11+ (for local dev)

### Local Development

#### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/development.txt

# Set up environment
cp ../.env.example ../.env

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

#### Frontend
```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server (with live type-checking)
pnpm dev

# Type-check only (no build)
pnpm typecheck

# Production build (type-check + bundle)
pnpm build
```

> **Note:** `pnpm build` runs `tsc -b --force && vite build` to ensure type errors are always caught before bundling. The `--force` flag prevents stale `.tsbuildinfo` cache from masking errors.

### Docker Development
```bash
# Copy environment variables
cp .env.example .env

# Start all services
docker compose up -d

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000/api
# - Admin: http://localhost:8000/admin
```

---

## Production Deployment

### Architecture

```
Browser → Frontend Domain (Nginx)
              └── Serves React SPA + Django static files

Browser → Backend Domain (Gunicorn)
              └── Django API (CORS allows frontend domain)
```

The production setup uses **Option B** — the React app calls the backend domain directly. CORS is configured to allow cross-origin requests from the frontend domain.

### Setup

1. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

2. **Set your domains and secrets in `.env`:**
   ```env
   # Required
   DJANGO_SECRET_KEY=your-secure-random-secret-key

   # Your domains
   FRONTEND_DOMAIN=your-frontend-domain.com
   BACKEND_DOMAIN=api.your-backend-domain.com
   VITE_API_URL=https://api.your-backend-domain.com/api

   # Database
   POSTGRES_PASSWORD=your-secure-db-password

   # Enable HTTPS redirect
   SECURE_SSL_REDIRECT=True
   ```

3. **Build and run:**
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

### What's auto-configured

These are derived from `FRONTEND_DOMAIN` and `BACKEND_DOMAIN` in `docker-compose.prod.yml` — no need to set them manually:

| Setting | Derived from |
|---------|-------------|
| `DJANGO_ALLOWED_HOSTS` | `BACKEND_DOMAIN` |
| `CORS_ALLOWED_ORIGINS` | `FRONTEND_DOMAIN` (http + https) |
| `CSRF_TRUSTED_ORIGINS` | `FRONTEND_DOMAIN` (http + https) |

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | **Development** — uses `runserver`, hot-reload, dev settings |
| `docker-compose.prod.yml` | **Production** — uses Gunicorn, Nginx, production settings |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login and get tokens |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user profile |
| PATCH | `/api/auth/me/` | Update profile |
| PUT | `/api/auth/change-password/` | Change password |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | List tasks (paginated, filterable) |
| POST | `/api/tasks/` | Create task |
| GET | `/api/tasks/{id}/` | Get task details |
| PATCH | `/api/tasks/{id}/` | Update task |
| DELETE | `/api/tasks/{id}/` | Soft delete task |
| GET | `/api/tasks/deleted/` | List deleted tasks |
| POST | `/api/tasks/{id}/restore/` | Restore deleted task |
| GET | `/api/tasks/stats/` | Get task statistics |
| POST | `/api/tasks/bulk_action/` | Perform bulk actions |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags/` | List all tags |
| POST | `/api/tags/` | Create custom tag |
| PATCH | `/api/tags/{id}/` | Update tag |
| DELETE | `/api/tags/{id}/` | Delete custom tag |

### Query Parameters (Tasks)
- `status`: todo, in_progress, completed
- `priority`: low, medium, high
- `due_date_after`, `due_date_before`: Date range
- `is_overdue`: true/false
- `search`: Search in title/description
- `tag_ids`: Filter by tag IDs
- `ordering`: created_at, due_date, priority, status

## Project Structure

```
PersonallyMe/
├── backend/
│   ├── apps/
│   │   ├── users/       # Auth & user management
│   │   ├── tasks/       # Task CRUD, filters, recurrence
│   │   └── tags/        # Tag management
│   ├── config/
│   │   ├── settings/    # base, development, production
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── requirements/    # base, development, production
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Auth, Theme, Notification
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript definitions
│   │   └── utils/       # Helpers & validation
│   └── public/          # PWA assets & icons
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docker-compose.yml       # Development
├── docker-compose.prod.yml  # Production
├── .env.example
└── .dockerignore
```

## Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
pnpm test           # Run tests
pnpm typecheck      # Type-check only
pnpm test:coverage  # With coverage
```

## License

MIT License
