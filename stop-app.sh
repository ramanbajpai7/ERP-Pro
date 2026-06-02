#!/bin/bash
echo "Stopping and removing Antigravity ERP containers..."
docker rm -f erp_database erp_backend erp_frontend || true

echo "Removing isolated network..."
docker network rm erp_network 2>/dev/null || true

echo "========================================="
echo "   ✔ Application stopped successfully!   "
echo "========================================="
