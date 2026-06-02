from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud, models

router = APIRouter(prefix="/orders", tags=["Orders"])

def format_order(db_order: models.Order, db: Session) -> schemas.OrderOut:
    items_out = []
    for item in db_order.items:
        # Resolve product information for clean frontend display
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        items_out.append(schemas.OrderItemOut(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            product_name=product.name if product else "Unknown Product",
            product_sku=product.sku if product else "Unknown SKU"
        ))
    
    customer_out = None
    if db_order.customer:
        customer_out = schemas.CustomerOut.model_validate(db_order.customer)
        
    return schemas.OrderOut(
        id=db_order.id,
        customer_id=db_order.customer_id,
        total_amount=db_order.total_amount,
        created_at=db_order.created_at,
        customer=customer_out,
        items=items_out
    )

@router.post("/", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    db_order = crud.create_order(db=db, order=order)
    return format_order(db_order, db)

@router.get("/", response_model=List[schemas.OrderOut])
def read_orders(db: Session = Depends(get_db)):
    db_orders = crud.get_orders(db=db)
    return [format_order(o, db) for o in db_orders]

@router.get("/{order_id}", response_model=schemas.OrderOut)
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return format_order(db_order, db)

@router.delete("/{order_id}", response_model=schemas.OrderOut)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    # Deleting an order cancels it and restores inventory
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    formatted_order = format_order(db_order, db)
    crud.delete_order(db=db, order_id=order_id)
    return formatted_order
