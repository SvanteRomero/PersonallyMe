# Personal Task Manager

A full-stack task management application built with Django REST Framework (backend) and React + TypeScript (frontend). Features JWT authentication, task CRUD with soft delete, filtering, and a beautiful warm-themed UI.

## Features

### Backend
- **JWT Authentication** with token refresh and blacklisting
- **Custom User Model** with email as identifier
- **Task Management** with CRUD operations
- **Soft Delete & Restore** functionality
- **Filtering & Search** by status, priority, date range
- **Pagination** and statistics endpoints
- **Bulk Actions** for task management

### Frontend
- **React 18** with TypeScript
- **3 Theme Palettes**: Amber, Terracotta, Gold (light/dark modes)
- **Responsive Design** with Tailwind CSS
- **PWA Ready** with offline support
- **Form Validation** with React Hook Form + Yup

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5.0, Django REST Framework |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Nunito font |
| Database | PostgreSQL 15 |
| Auth | JWT (SimpleJWT) |
| Containerization | Docker, Docker Compose |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ with pnpm (for local dev)
- Python 3.11+ (for local dev)

### Using Docker (Recommended)

```bash
# Clone and navigate
cd PersonallyMe

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000/api
# - Admin: http://localhost:8000/admin
```

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

# Start dev server
pnpm dev
```

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

### Query Parameters (Tasks)
- `status`: todo, in_progress, completed
- `priority`: low, medium, high
- `due_date_after`, `due_date_before`: Date range
- `is_overdue`: true/false
- `search`: Search in title/description
- `ordering`: created_at, due_date, priority, status

## Project Structure

```
PersonallyMe/
├── backend/
│   ├── apps/
│   │   ├── users/       # Auth & user management
│   │   └── tasks/       # Task CRUD & filters
│   ├── config/
│   │   ├── settings/    # Django settings
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── requirements/
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Auth, Theme, Notification
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript definitions
│   │   └── utils/       # Helpers & validation
│   └── public/          # PWA assets
├── docker/
└── docker-compose.yml
```

## Environment Variables

See `.env.example` for all available options. Key variables:

```env
# Database
POSTGRES_DB=taskmanager
POSTGRES_USER=taskmanager_user
POSTGRES_PASSWORD=your-secure-password

# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
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
pnpm test
```

## License

MIT License
