# PrimeTrade — Scalable REST API with Auth & RBAC

A production-quality full-stack application featuring JWT authentication, role-based access control, and a React task manager UI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js (TypeScript) |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| Frontend | React 18 + Vite + Tailwind CSS |
| API Docs | Swagger (swagger-ui-express) |
| Logging | Winston |
| Containerization | Docker + docker-compose |

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)
- npm or yarn

---

## Setup Instructions

### 1. Clone & enter the project

```bash
git clone https://github.com/TheSkyroo/Prime-Trade.git
cd primetrade-backend
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secrets
```

**Environment variables (`.env`):**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/appdb` |
| `JWT_ACCESS_SECRET` | Secret for access tokens (min 32 chars) | `my_super_secret_access_key_here_32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 32 chars) | `my_super_secret_refresh_key_here_32` |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

```bash
# Run database migrations
npx prisma migrate dev --name init

# Seed default users and sample data
npx ts-node prisma/seed.ts

# Start dev server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit VITE_API_URL if your backend runs on a different port

npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Docker Setup

```bash
# From project root
docker-compose up --build

# Services:
# - PostgreSQL:  localhost:5432
# - Backend API: localhost:5000
# - Frontend:    localhost:3000
```

Note: Docker compose uses hardcoded demo secrets. Change them before production deployment.

---

## API Documentation

Once the backend is running, Swagger UI is available at:

```
http://localhost:5000/api/docs
```

All endpoints are documented with request/response schemas, examples, and authentication requirements.

---

## Default Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin@123` |
| User | `user@example.com` | `User@1234` |

---

## Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── config/          # DB client, env validation, Swagger spec
│   │   ├── middlewares/     # authenticate, authorize, validate, rateLimiter, errorHandler
│   │   ├── modules/
│   │   │   ├── auth/        # register, login, refresh, logout (controller + service + validation + routes)
│   │   │   └── tasks/       # CRUD for tasks (controller + service + validation + routes)
│   │   ├── routes/v1/       # Versioned route aggregator
│   │   ├── utils/           # jwt helpers, bcrypt helpers, apiResponse, Winston logger
│   │   ├── types/           # TypeScript interfaces (AuthRequest, JwtPayload, etc.)
│   │   └── app.ts           # Express app bootstrap
│   ├── prisma/
│   │   ├── schema.prisma    # User, RefreshToken, Task models
│   │   └── seed.ts          # Seed script
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/             # axios instance + typed endpoint functions
│   │   ├── components/      # ProtectedRoute, Navbar, TaskCard, CreateTaskModal
│   │   ├── pages/           # Login, Register, Dashboard, Tasks, Admin
│   │   ├── context/         # AuthContext (JWT state + refresh logic)
│   │   ├── hooks/           # useTasks (CRUD + pagination)
│   │   └── App.tsx          # Router setup
│   └── Dockerfile
├── docker-compose.yml
├── README.md
└── SCALABILITY.md
```

---

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login, returns tokens |
| POST | `/refresh` | Cookie/Body | Refresh access token |
| POST | `/logout` | — | Invalidate refresh token |

### Tasks (`/api/v1/tasks`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | List tasks (own / all for admin) |
| POST | `/` | JWT | Create task |
| GET | `/stats` | JWT | Task statistics |
| GET | `/:id` | JWT | Get single task |
| PUT | `/:id` | JWT | Update task |
| DELETE | `/:id` | JWT | Delete task |

### Admin (`/api/v1/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/tasks` | JWT + ADMIN | All tasks with user info + filters |

---

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens: 15-minute TTL, stored in memory only
- Refresh tokens: 7-day TTL, stored as bcrypt hashes in DB, rotated on use
- httpOnly cookies for refresh token delivery
- Helmet for security headers
- CORS with explicit origin whitelist
- Rate limiting: 10 req/15min on auth endpoints, 100 req/min globally
- Zod validation on all inputs (backend + frontend)
- Ownership enforcement: users can only access their own tasks
- SQL injection protection via Prisma parameterized queries
