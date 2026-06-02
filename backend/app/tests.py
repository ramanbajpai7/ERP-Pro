import os
# Force SQLite URL before importing database module to avoid psycopg2 dependency
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import unittest
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pydantic import ValidationError

from .database import Base
from . import models
from . import schemas
from . import crud

# Set up clean SQLite in-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class TestInventoryOrderManagement(unittest.TestCase):
    def setUp(self):
        # Create all tables for the clean in-memory database
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()

    def tearDown(self):
        # Close database session and drop all tables
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    def test_create_product_success(self):
        # Test creating a valid product
        prod_schema = schemas.ProductCreate(
            name="Wireless Mouse",
            sku="MOUSE-01",
            price=Decimal("29.99"),
            quantity=50
        )
        product = crud.create_product(self.db, prod_schema)
        self.assertEqual(product.name, "Wireless Mouse")
        self.assertEqual(product.sku, "MOUSE-01")
        self.assertEqual(product.price, Decimal("29.99"))
        self.assertEqual(product.quantity, 50)

    def test_product_sku_uniqueness(self):
        # Test that duplicate SKUs raise an HTTPException (400)
        prod_schema1 = schemas.ProductCreate(
            name="Laptop",
            sku="LAPTOP-X",
            price=Decimal("999.99"),
            quantity=10
        )
        crud.create_product(self.db, prod_schema1)

        prod_schema2 = schemas.ProductCreate(
            name="Notebook",
            sku="LAPTOP-X", # Duplicate SKU
            price=Decimal("899.99"),
            quantity=5
        )
        with self.assertRaises(Exception) as context:
            crud.create_product(self.db, prod_schema2)
        
        self.assertIn("already exists", str(context.exception))

    def test_product_negative_values_pydantic(self):
        # Test Pydantic validation for negative quantities/prices
        with self.assertRaises(ValidationError):
            schemas.ProductCreate(
                name="Bad Price",
                sku="BAD-01",
                price=Decimal("-5.00"), # Invalid
                quantity=10
            )

        with self.assertRaises(ValidationError):
            schemas.ProductCreate(
                name="Bad Quantity",
                sku="BAD-02",
                price=Decimal("15.00"),
                quantity=-2 # Invalid
            )

    def test_create_customer_success(self):
        # Test creating a valid customer
        cust_schema = schemas.CustomerCreate(
            name="Alice Smith",
            email="alice@example.com",
            phone="1234567890"
        )
        customer = crud.create_customer(self.db, cust_schema)
        self.assertEqual(customer.name, "Alice Smith")
        self.assertEqual(customer.email, "alice@example.com")
        self.assertEqual(customer.phone, "1234567890")

    def test_customer_email_uniqueness(self):
        # Test that duplicate emails are rejected
        cust_schema1 = schemas.CustomerCreate(
            name="Alice Smith",
            email="alice@example.com",
            phone="1234567890"
        )
        crud.create_customer(self.db, cust_schema1)

        cust_schema2 = schemas.CustomerCreate(
            name="Bob Jones",
            email="alice@example.com", # Duplicate Email
            phone="0987654321"
        )
        with self.assertRaises(Exception) as context:
            crud.create_customer(self.db, cust_schema2)
        
        self.assertIn("already exists", str(context.exception))

    def test_order_placement_stock_deduction_and_totals(self):
        # 1. Create a product with 10 units in stock
        prod_schema = schemas.ProductCreate(
            name="Mechanical Keyboard",
            sku="KEY-01",
            price=Decimal("100.00"),
            quantity=10
        )
        product = crud.create_product(self.db, prod_schema)

        # 2. Create a customer
        cust_schema = schemas.CustomerCreate(
            name="Charlie Brown",
            email="charlie@example.com",
            phone="5551234"
        )
        customer = crud.create_customer(self.db, cust_schema)

        # 3. Create an order for 3 keyboards
        order_schema = schemas.OrderCreate(
            customer_id=customer.id,
            items=[
                schemas.OrderItemCreate(product_id=product.id, quantity=3)
            ]
        )
        order = crud.create_order(self.db, order_schema)

        # Verify stock was deducted: 10 - 3 = 7
        self.db.refresh(product)
        self.assertEqual(product.quantity, 7)

        # Verify total amount calculations: 3 * 100.00 = 300.00
        self.assertEqual(order.total_amount, Decimal("300.00"))
        self.assertEqual(len(order.items), 1)
        self.assertEqual(order.items[0].unit_price, Decimal("100.00"))

    def test_order_placement_insufficient_stock(self):
        # 1. Create product with 5 units
        prod_schema = schemas.ProductCreate(
            name="USB Flash Drive",
            sku="USB-05",
            price=Decimal("10.00"),
            quantity=5
        )
        product = crud.create_product(self.db, prod_schema)

        # 2. Create customer
        cust_schema = schemas.CustomerCreate(
            name="Dave Miller",
            email="dave@example.com",
            phone="5559876"
        )
        customer = crud.create_customer(self.db, cust_schema)

        # 3. Request 6 units (insufficient stock)
        order_schema = schemas.OrderCreate(
            customer_id=customer.id,
            items=[
                schemas.OrderItemCreate(product_id=product.id, quantity=6)
            ]
        )
        
        with self.assertRaises(Exception) as context:
            crud.create_order(self.db, order_schema)
        
        self.assertIn("Insufficient stock", str(context.exception))
        
        # Verify stock remains untouched at 5
        self.db.refresh(product)
        self.assertEqual(product.quantity, 5)

    def test_order_deletion_inventory_restoration(self):
        # 1. Setup product and customer
        product = crud.create_product(self.db, schemas.ProductCreate(
            name="Headphones", sku="HEAD-01", price=Decimal("50.00"), quantity=20
        ))
        customer = crud.create_customer(self.db, schemas.CustomerCreate(
            name="Eve Watson", email="eve@example.com", phone="5551111"
        ))

        # 2. Place order for 5 headphones -> Stock becomes 15
        order = crud.create_order(self.db, schemas.OrderCreate(
            customer_id=customer.id,
            items=[schemas.OrderItemCreate(product_id=product.id, quantity=5)]
        ))
        self.db.refresh(product)
        self.assertEqual(product.quantity, 15)

        # 3. Cancel/Delete the order -> Stock should go back to 20
        crud.delete_order(self.db, order.id)
        
        self.db.refresh(product)
        self.assertEqual(product.quantity, 20)
        
        # Verify order is gone
        db_order = crud.get_order(self.db, order.id)
        self.assertIsNone(db_order)

if __name__ == "__main__":
    unittest.main()
