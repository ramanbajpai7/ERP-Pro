#!/bin/bash
set -e

echo "========================================="
echo "   Bootstrapping Antigravity ERP Node   "
echo "========================================="

# 1. Create custom isolated network
echo "[1/6] Creating isolated Docker network..."
docker network create erp_network 2>/dev/null || true

# 2. Create persistent volume
echo "[2/6] Creating persistent PostgreSQL volume..."
docker volume create erp_postgres_volume 2>/dev/null || true

# 3. Spin up PostgreSQL Database
echo "[3/6] Launching PostgreSQL database container..."
docker run -d \
  --name erp_database \
  --network erp_network \
  -p 5435:5432 \
  -v erp_postgres_volume:/var/lib/postgresql/data \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres_secure_pass_2026 \
  -e POSTGRES_DB=inventory_db \
  --restart unless-stopped \
  postgres:15-alpine

# 4. Wait for Database to be fully healthy
echo "[4/6] Waiting for database to be ready..."
sleep 2
until docker exec erp_database pg_isready -U postgres -d inventory_db >/dev/null 2>&1; do
  echo "  > Database initializing, retrying in 2 seconds..."
  sleep 2
done
echo "  ✔ Database is ready!"

# 5. Build and launch Backend API
echo "[5/6] Building and launching Backend API container..."
docker build -t erp_backend ./backend
docker run -d \
  --name erp_backend \
  --network erp_network \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://postgres:postgres_secure_pass_2026@erp_database:5432/inventory_db \
  --restart unless-stopped \
  erp_backend

# 6. Build and launch Frontend Nginx server
echo "[6/6] Building and launching Frontend web server..."
docker build -t erp_frontend ./frontend
docker run -d \
  --name erp_frontend \
  --network erp_network \
  -p 80:80 \
  --restart unless-stopped \
  erp_frontend

echo "========================================="
echo "   ✔ Application successfully launched!  "
echo "========================================="
echo "Frontend: http://localhost (Port 80)"
echo "Backend:  http://localhost:8000 (Port 8000)"
echo "API Docs: http://localhost:8000/docs"
echo "========================================="
