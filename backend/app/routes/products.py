from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

@router.get("/", response_model=List[schemas.ProductOut])
def read_products(db: Session = Depends(get_db)):
    return crud.get_products(db=db)

@router.get("/{product_id}", response_model=schemas.ProductOut)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db=db, product_id=product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return db_product

@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    return crud.update_product(db=db, product_id=product_id, product=product)

@router.delete("/{product_id}", response_model=schemas.ProductOut)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return crud.delete_product(db=db, product_id=product_id)
