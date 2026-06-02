from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from .routes import products, customers, orders
from . import models

# Bootstrap tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System API",
    description="Production-grade API for managing products, customers, orders, and inventory tracking.",
    version="1.0.0"
)

# Enable CORS for all origins in development and local Docker environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(products.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(orders.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "message": "Welcome to the Inventory & Order Management System API",
        "documentation": "/docs"
    }

@app.get("/api/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Calculate key metrics
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Define "Low Stock" threshold as quantity < 10
    low_stock_products = db.query(models.Product).filter(models.Product.quantity < 10).all()
    
    # Fetch recent orders (last 5) for dashboard activity log
    recent_orders = db.query(models.Order).order_by(models.Order.created_at.desc()).limit(5).all()
    formatted_recent_orders = []
    for order in recent_orders:
        formatted_recent_orders.append({
            "id": order.id,
            "customer_name": order.customer.name if order.customer else "Deleted Customer",
            "total_amount": float(order.total_amount),
            "created_at": order.created_at
        })
        
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_count": len(low_stock_products),
        "low_stock_products": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "quantity": p.quantity,
                "price": float(p.price)
            } for p in low_stock_products
        ],
        "recent_orders": formatted_recent_orders
    }
