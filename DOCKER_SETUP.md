# Docker Setup Guide

## Overview

This project uses Docker Compose to orchestrate three services:
- **PostgreSQL Database** (port 5432)
- **Rust Backend** (port 8080)
- **Node.js Frontend** (port 5173)

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured (copy from `.env.example` and customize)

## Quick Start

### 1. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your desired configuration:
```env
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=portfolio_db
RUST_LOG=info
VITE_API_URL=http://localhost:8080
```

### 2. Build Images

```bash
cd backend
docker-compose build
```

### 3. Start Services

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Build and start the Rust backend
- Build and start the Node.js frontend

### 4. Access Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Data

```bash
docker-compose down -v
```

### Rebuild Services

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Database Management

### Connect to PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d portfolio_db
```

### Run Migrations

Migrations should be run as part of your backend startup. If using SQLx, ensure `sqlx-cli` is installed:

```bash
cargo install sqlx-cli --no-default-features --features postgres
```

Then run migrations:
```bash
sqlx migrate run --database-url "postgres://postgres:postgres@localhost:5432/portfolio_db"
```

## Development

### Local Development (Without Docker)

#### Backend
```bash
cd backend
cargo run --bin my_engine
```

#### Frontend
```bash
npm install
npm run dev
```

### Development with Docker

For live development with hot-reload:

```bash
# Terminal 1: Frontend development server
npm run dev

# Terminal 2: Backend development
cd backend
cargo watch -q -c -w src -x run --bin my_engine

# Terminal 3: Database only
docker-compose up postgres
```

## Troubleshooting

### Backend won't connect to database
- Ensure PostgreSQL is healthy: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Verify DATABASE_URL environment variable

### Port already in use
```bash
# Find process using port (Windows)
netstat -ano | findstr :5173

# Or change ports in docker-compose.yml
```

### Build failures
```bash
# Clean build
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Production Considerations

For production deployment:

1. Use proper `.env` with strong passwords
2. Enable HTTPS/TLS
3. Use Docker networking with secrets
4. Set resource limits
5. Configure health checks
6. Use Docker volumes for persistent data
7. Implement proper logging and monitoring
