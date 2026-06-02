from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from . import models, schemas

# ----------------- PRODUCT CRUD -----------------
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session):
    return db.query(models.Product).order_by(models.Product.created_at.desc()).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Check uniqueness of SKU
    existing = get_product_by_sku(db, product.sku)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    
    # Check SKU uniqueness if changed
    if product.sku is not None and product.sku != db_product.sku:
        existing = get_product_by_sku(db, product.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{product.sku}' already exists."
            )
    
    # Update fields
    update_data = product.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    
    # Check if product is in any orders to prevent referential integrity errors (RESTRICT cascade rule)
    in_orders = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if in_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product as it is referenced in one or more orders."
        )

    # Convert to Pydantic schema before deletion to avoid ObjectDeletedError
    product_out = schemas.ProductOut.model_validate(db_product)

    db.delete(db_product)
    db.commit()
    return product_out


# ----------------- CUSTOMER CRUD -----------------
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session):
    return db.query(models.Customer).order_by(models.Customer.created_at.desc()).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Check uniqueness of Email
    existing = get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists."
        )
    
    db_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    
    # Deleting a customer deletes their orders (CASCADE logic)
    # We will let the database cascade, but first let's restore inventory for the deleted orders!
    # That is super professional. Let's do it!
    customer_orders = db.query(models.Order).filter(models.Order.customer_id == customer_id).all()
    for order in customer_orders:
        # Restore stock for each item of the order
        for item in order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
                
    # Convert to Pydantic schema before deletion to avoid ObjectDeletedError
    customer_out = schemas.CustomerOut.model_validate(db_customer)

    db.delete(db_customer)
    db.commit()
    return customer_out


# ----------------- ORDER CRUD -----------------
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()

def create_order(db: Session, order: schemas.OrderCreate):
    # 1. Verify customer exists
    customer = get_customer(db, order.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order.customer_id} not found."
        )

    # We use a subtransaction or rely on caller transaction
    db_order = models.Order(
        customer_id=order.customer_id,
        total_amount=Decimal('0.00')
    )
    db.add(db_order)
    db.flush()  # Generate db_order.id

    total = Decimal('0.00')
    
    # To handle potential duplicate product IDs in the same order request:
    # aggregate quantities per product to check inventory correctly.
    aggregated_items = {}
    for item in order.items:
        aggregated_items[item.product_id] = aggregated_items.get(item.product_id, 0) + item.quantity

    # 2. Iterate and process items
    for product_id, quantity in aggregated_items.items():
        # Fetch product and lock the row to avoid race conditions
        product = db.query(models.Product).filter(models.Product.id == product_id).with_for_update().first()
        if not product:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {product_id} not found."
            )
        
        # Check stock sufficiency
        if product.quantity < quantity:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Available: {product.quantity}, Requested: {quantity}."
            )
        
        # Deduct stock
        product.quantity -= quantity
        
        # Create order item
        subtotal = product.price * Decimal(quantity)
        total += subtotal
        
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price
        )
        db.add(db_item)
    
    # 3. Update order total amount
    db_order.total_amount = total
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    # Fetch order and lock to prevent concurrent modifications
    db_order = db.query(models.Order).filter(models.Order.id == order_id).with_for_update().first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    
    # Restore product quantities
    for item in db_order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
        if product:
            product.quantity += item.quantity
            
    db.delete(db_order)
    db.commit()
    return db_order
