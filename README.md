# ERP Pro — Inventory & Order Management System

A production-ready, full-stack **Inventory & Order Management System** built with **FastAPI**, **PostgreSQL**, **React (Vite)**, and **Docker**. The platform is designed with rich dark-slate glassmorphic aesthetics and incorporates strict business logic verification, inventory stock safety locks, auto billing calculations, and item stock restoration.

### 🌐 Live Production Deployments
* **Frontend Web Dashboard**: [https://erp-pro-teal.vercel.app/](https://erp-pro-teal.vercel.app/)
* **Production API Backend**: [https://erp-pro-xw0n.onrender.com](https://erp-pro-xw0n.onrender.com)

---

## 🚀 Quick Start (Dockerized Bootstrapping)

We have bundled all containers and network configurations into an automated bootstrap utility that avoids legacy host Python Compose version collisions:

### 1. Launch the Application
Navigate to the root workspace directory and run:
```bash
# Make scripts executable
chmod +x start-app.sh stop-app.sh

# Spin up containers
./start-app.sh
```
This script creates an isolated Docker network, mounts a persistent Postgres volume, waits for the database socket to accept connections, compiles requirements, builds Vite static assets, and launches:
- **Frontend Dashboard:** [http://localhost](http://localhost) (Port `80`)
- **Backend API Server:** [http://localhost:8000](http://localhost:8000) (Port `8000`)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs) (Port `8000`)

### 2. Teardown Services
To stop and remove all application containers and networks cleanly, simply run:
```bash
./stop-app.sh
```

---

## 🛠️ Technology Stack

- **Backend API:** Python 3.12, FastAPI (REST framework), SQLAlchemy (ORM), Pydantic (data validation).
- **Frontend Web:** React 18, Vite (Asset Compiler), Vanilla CSS (SaaS Slate-Dark Glassmorphism), Lucide React (UI Icons).
- **Database Node:** PostgreSQL 15 (Alpine database node).
- **Orchestration:** Multi-stage Docker builds, Nginx static proxies with React Router SPA routing fallbacks, and custom Docker network routing.

---

## ⚙️ Core Business Logic Enforced

1. **Unique Key Constraints:** Product SKU/code must be unique. Customer account email addresses must be unique.
2. **Field Limits:** Product pricing must be positive (`price > 0`). Catalog stock level cannot be negative (`quantity >= 0`). Ordered quantities must be positive.
3. **Transaction Safety & Stock Lock:** Placing an order queries and locks product stock levels. If requested quantities exceed available stock, the database transaction rolls back, throwing a `400 Bad Request` out-of-stock warning.
4. **Auto-Billing:** Invoiced totals are computed on-the-fly inside the database transaction by summing up selected item snapshotted prices.
5. **Inventory Restoration:** Canceling/deleting an order automatically restores all ordered quantities back to product catalog stock levels. Deleting a customer restores stock for all their historical invoices before cascading account removal.

---

## 📊 Database Architecture

The system models the following ER relationship structure:

```
                  +------------------+
                  |     CUSTOMER     |
                  +------------------+
                  | id (PK)          |
                  | name             |
                  | email (Unique)   |
                  | phone            |
                  +------------------+
                            | 1
                            |
                            | places (Cascading)
                            |
                            v 0..*
                  +------------------+
                  |      ORDER       |
                  +------------------+
                  | id (PK)          |
                  | customer_id (FK) |
                  | total_amount     |
                  | created_at       |
                  +------------------+
                            | 1
                            |
                            | contains (Cascading)
                            |
                            v 1..*
                  +------------------+          +------------------+
                  |    ORDER_ITEM    |          |     PRODUCT      |
                  +------------------+          +------------------+
                  | id (PK)          |          | id (PK)          |
                  | order_id (FK)    | 0..*   1 | name             |
                  | product_id (FK)  |----------| sku (Unique)     |
                  | quantity         | (Restr.) | price            |
                  | unit_price       |          | quantity         |
                  +------------------+          +------------------+
```

---

## 📡 REST API Reference

### 1. Product Catalog Endpoints
- `POST /api/products/` — Register a product. Price must be > 0, SKU unique.
- `GET /api/products/` — Retrieve all active products.
- `GET /api/products/{id}` — Fetch single product details.
- `PUT /api/products/{id}` — Modify product details (SKU unique checks apply).
- `DELETE /api/products/{id}` — Remove a product. Blocked if product is linked to existing invoices (`RESTRICT`).

### 2. Customer Directory Endpoints
- `POST /api/customers/` — Register a customer. Email must be unique.
- `GET /api/customers/` — List all registered profiles.
- `GET /api/customers/{id}` — Fetch details for a specific client.
- `DELETE /api/customers/{id}` — Delete client profile (restores their order stocks and cascades).

### 3. Orders Billing Endpoints
- `POST /api/orders/` — Process an invoice. Accepts customer ID and lists of item SKU/quantities. Deducts stock.
- `GET /api/orders/` — List all orders.
- `GET /api/orders/{id}` — View full details of an invoice including items.
- `DELETE /api/orders/{id}` — Cancel/delete order. Restores items back to product inventory stock.

### 4. Optimized Metrics Endpoints
- `GET /api/dashboard/summary` — Returns dashboard aggregate counts, low stock lists, and recent orders in a single high-speed request.

---

## 🧪 Local Unit & Integration Testing

We provide a separate fast-executing SQLite memory test suite (`backend/app/tests.py`) containing 8 test cases validating constraints, stock checks, and cancels:

To execute locally:
```bash
# Navigate to backend package
cd backend

# Execute test runner
PYTHONPATH=. python3 -m unittest app.tests
```

---

## ☁️ Production Deployment Blueprint

This project is prepared for single-command deployments on cloud microservices:

### 1. Backend REST API Deployment (Render / Railway / Fly.io)
- **Source Root:** Set to `backend` in your cloud control panel.
- **Runtime:** Python.
- **Build Command:** `pip install -r requirements.txt` (or let the Dockerfile build automatically).
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Database:** Provision a PostgreSQL instance on Render/Railway and bind the generated Postgres connection string to the `DATABASE_URL` environment variable.

### 2. Frontend SPA Web Deployment (Vercel / Netlify)
- **Source Root:** Set to `frontend`.
- **Framework Preset:** Vite (or Other/Static HTML).
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** Bind your live deployed backend API URL to `VITE_API_URL` (e.g. `VITE_API_URL=https://my-erp-api.up.railway.app`).
