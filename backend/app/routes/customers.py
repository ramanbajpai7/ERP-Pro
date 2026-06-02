from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("/", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db=db, customer=customer)

@router.get("/", response_model=List[schemas.CustomerOut])
def read_customers(db: Session = Depends(get_db)):
    return crud.get_customers(db=db)

@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db=db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    return db_customer

@router.delete("/{customer_id}", response_model=schemas.CustomerOut)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    return crud.delete_customer(db=db, customer_id=customer_id)
