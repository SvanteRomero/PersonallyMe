Project: Personal Task Manager
Project Overview
Develop a full-stack web application for managing personal tasks with user authentication, CRUD
operations, and proper security measures.
System Requirements
1. Core Features (MVP)
Authentication & Authorization:
User registration with email verification
Login/Logout functionality
Password reset functionality
Session management
Task Management (CRUD):
Create: Add new tasks with title, description, due date, priority, and status
Read: View task list with filtering and sorting capabilities
Update: Edit existing tasks
Delete: Remove tasks (soft delete preferred)
List View: Display tasks in a responsive table/card layout
Detail View: View complete task details
2. Technical Stack
Backend (Django & DRF):
Django
Django REST Framework
Django CORS Headers
SimpleJWT for authentication
PostgreSQL/MySQL database
Frontend (React):
React with functional components
React Router for navigation
Axios for API calls
Context API or Redux Toolkit for state management
Material-UI or Ant Design for UI components
Form validations
3. Database Schema
-- Users table (extends Django's built-in User)
-- Custom User model or default User
-- Tasks table
id: Primary Key
user: ForeignKey to User
title: CharField (max_length=200)
description: TextField (nullable)
status: CharField (choices: ['todo', 'in_progress', 'completed'])
priority: CharField (choices: ['low', 'medium', 'high'])
due_date: DateTimeField (nullable)
created_at: DateTimeField (auto_now_add=True)
updated_at: DateTimeField (auto_now=True)
is_deleted: BooleanField (default=False)
deleted_at: DateTimeField (nullable)
4. API Endpoints (DRF)
Authentication:
POST /api/auth/register/ - User registration
POST /api/auth/login/ - User login (JWT tokens)
POST /api/auth/refresh/ - Refresh access token
POST /api/auth/logout/ - User logout
POST /api/auth/password-reset/ - Request password reset
POST /api/auth/password-reset-confirm/ - Confirm password reset
Tasks:
GET /api/tasks/ - List all tasks for authenticated user (with filtering)
POST /api/tasks/ - Create new task
GET /api/tasks/{id}/ - Retrieve specific task
PUT /api/tasks/{id}/ - Update task
PATCH /api/tasks/{id}/ - Partial update
DELETE /api/tasks/{id}/ - Soft delete task
GET /api/tasks/deleted/ - List deleted tasks (admin only)
POST /api/tasks/{id}/restore/ - Restore deleted task
5. Security Requirements
Backend Security:
Implement JWT authentication with refresh tokens
Password hashing using Django's built-in hashers
Input validation on all endpoints
SQL injection prevention (use Django ORM)
XSS protection (DRF has built-in protection)
CORS configuration for frontend domain
Rate limiting on authentication endpoints
Environment variables for sensitive data
CSRF protection for session-based endpoints
Frontend Security:
Secure token storage (httpOnly cookies or secure localStorage with refresh rotation)
Input sanitization
XSS protection in React components
HTTPS enforcement
Error handling without exposing sensitive data
6. Validation Requirements
Backend Validation:
Serializer validation for all models
Field-level validation (e.g., due_date cannot be in the past)
User permission checks (users can only access their own tasks)
Request data sanitization
File type/size validation if file uploads are added
Frontend Validation:
Form validation before submission
Real-time validation feedback
Yup schema validation for forms
Display user-friendly error messages
7. Testing Requirements
Backend Tests:
Unit tests for models and serializers
API endpoint tests (authentication, CRUD operations)
Permission tests
Validation tests
Minimum 80% test coverage
Frontend Tests:
Component unit tests (Jest + React Testing Library)
API integration tests
Form validation tests
Routing tests
8. Code Quality Standards
General:
Follow PEP 8 for Python code
Follow ESLint/Prettier rules for React code
Meaningful commit messages
Proper code comments and documentation
Use Git with feature branches
Backend:
Use Django class-based views or viewsets
Proper error handling and logging
Use serializers for data validation
Implement pagination for list endpoints
Add search/filtering capabilities
Frontend:
Component-based architecture
Responsive design
Proper state management
Loading states and error boundaries
Accessibility considerations (ARIA labels, keyboard navigation)
9. Project Structure
task-manager/
├── backend/
│ ├── config/
│ │ ├── settings/
│ │ │ ├── base.py
│ │ │ ├── development.py
│ │ │ └── production.py
│ │ ├── urls.py
│ │ └── wsgi.py
│ ├── apps/
│ │ ├── users/
│ │ └── tasks/
│ ├── requirements/
│ │ ├── base.txt
│ │ ├── development.txt
│ │ └── production.txt
│ └── manage.py
├── frontend/
│ ├── public/
│ └── src/
│ ├── components/
│ ├── contexts/
│ ├── hooks/
│ ├── pages/
│ ├── services/
│ ├── utils/
│ └── App.js
├── docker/
│ ├── Dockerfile.backend
│ └── Dockerfile.frontend
├── docker-compose.yml
├── .env.example
├── README.md
└── .gitignore
10. Expected Deliverables
1. Source Code: Complete working application
2. Documentation:
Setup instructions
API documentation (Postman collection or OpenAPI/Swagger)
Database schema
3. Tests: Both backend and frontend test suites
4. Deployment Instructions: Local development setup using Docker
5. Security Report: Brief explanation of implemented security measures
11. Timeline (5 Working Days)
Day 1: Project setup, database design, basic Django setup with User model
Day 2: Backend API development (authentication + task CRUD)
Day 3: Frontend setup, authentication pages, routing
Day 4: Task CRUD frontend implementation, UI polishing
Day 5: Testing, security review, documentation, final touches
12. Evaluation Criteria
Category Weight Details
Functionality 30% All CRUD operations work correctly
Code Quality 25% Clean, maintainable, well-structured code
Security 20% Proper authentication, validation, and security measures
Testing 15% Comprehensive test coverage
Documentation 10% Clear setup and usage instructions
13. Bonus Points
Implement real-time updates (WebSockets)
Add task categories or tags
Implement drag-and-drop for task status
Add data export (CSV/JSON)
Implement dark/light theme toggle
Add comprehensive logging
Set up CI/CD pipeline configuration
Deploy to a cloud platform (Heroku, Render, etc.)
14. Getting Started Instructions for Candidate
1. Start the project
2. Set up virtual environments for both backend and frontend
3. Install dependencies from requirements.txt and package.json
4. Configure database connection in environment variables
5. Run migrations and create a superuser
6. Start development servers for both backend and frontend
7. Implement features following the requirements above