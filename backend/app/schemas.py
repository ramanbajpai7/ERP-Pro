from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr, field_validator

# ----------------- PRODUCT SCHEMAS -----------------
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=50)
    price: Decimal = Field(..., gt=0)
    quantity: int = Field(..., ge=0)

    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return v

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        if v < 0:
            raise ValueError('Quantity in stock cannot be negative')
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    price: Optional[Decimal] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)

class ProductOut(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- CUSTOMER SCHEMAS -----------------
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(..., min_length=1, max_length=50)

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- ORDER ITEM SCHEMAS -----------------
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

    @field_validator('quantity')
    @classmethod
    def validate_item_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity ordered must be greater than 0')
        return v

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product_name: Optional[str] = None
    product_sku: Optional[str] = None

    class Config:
        from_attributes = True


# ----------------- ORDER SCHEMAS -----------------
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]

    @field_validator('items')
    @classmethod
    def validate_items_not_empty(cls, v):
        if not v:
            raise ValueError('Order must contain at least one item')
        return v

class OrderOut(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    customer: Optional[CustomerOut] = None
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True
