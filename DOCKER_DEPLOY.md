# ETEX Game — Docker Deployment Guide

## Architecture

```
Port 80 (nginx)
├── /          → frontend  (Next.js,  port 3000)
├── /admin/    → admin     (Vite SPA, port 8080)
├── /api/      → backend   (Express,  port 5000)
├── /uploads/  → backend   (static files)
└── /health    → backend   (health check)
```

All five containers run behind a single nginx reverse proxy on port **80**.

---

## Quick Start

```bash
# 1. Clone and enter the project
cd /path/to/game

# 2. Copy the environment template
cp .env.docker .env

# 3. Edit .env — change passwords and secrets!
nano .env

# 4. Build and start everything
docker compose up -d --build

# 5. Check all services are running
docker compose ps
```

After startup, the backend container will **automatically**:
- Wait for PostgreSQL to be ready
- Run `prisma db push` to sync the schema
- Seed the database with the admin user and sample data (first run only)

---

## Access Points

| Service          | URL                         |
|------------------|-----------------------------|
| Game Frontend    | `http://your-server/`       |
| Admin Dashboard  | `http://your-server/admin/` |
| Backend API      | `http://your-server/api/`   |
| Health Check     | `http://your-server/health` |

### Admin Login Credentials (default seed)
- **Name**: `Admin User`
- **Phone**: `+251911111111`
- **Password**: `admin123`

---

## Environment Variables

| Variable            | Default                  | Description                |
|---------------------|--------------------------|----------------------------|
| `POSTGRES_USER`     | `postgres`               | PostgreSQL username        |
| `POSTGRES_PASSWORD` | `change-me-in-production`| PostgreSQL password        |
| `POSTGRES_DB`       | `etex_game`              | Database name              |
| `JWT_SECRET`        | (see .env.docker)        | JWT signing secret         |
| `HTTP_PORT`         | `80`                     | Nginx external port        |
| `FRONTEND_PORT`     | `3000`                   | Next.js internal port      |
| `ADMIN_PORT`        | `8080`                   | Admin dashboard port       |
| `BACKEND_PORT`      | `5000`                   | Backend API port           |
| `DB_PORT`           | `5433`                   | PostgreSQL mapped port (internal: 5432) |

---

## Useful Commands

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Restart a single service
docker compose restart backend

# Stop everything
docker compose down

# Stop and remove all data (database + uploads)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Run a one-off Prisma command
docker compose exec backend npx prisma studio

# Access the database directly
docker compose exec db psql -U postgres -d etex_game
```

---

## Production Checklist

- [ ] Change `POSTGRES_PASSWORD` in `.env`
- [ ] Change `JWT_SECRET` to a long random string
- [ ] Set up HTTPS (add SSL certificates to nginx or use a reverse proxy like Caddy/Traefik)
- [ ] Set up automated database backups
- [ ] Consider adding rate limiting to nginx
- [ ] Update admin password after first login

---

## File Structure

```
game/
├── docker-compose.yml          # Orchestration
├── .env.docker                 # Environment template
├── Dockerfile                  # Next.js frontend
├── nginx/
│   └── nginx.conf              # Top-level reverse proxy
├── backend/
│   ├── Dockerfile              # Express API
│   ├── docker-entrypoint.sh    # Auto migration + seed
│   └── ...
└── admin-dashboard/
    ├── Dockerfile              # Vite SPA + nginx
    ├── nginx.conf              # Admin SPA routing
    └── ...
```
