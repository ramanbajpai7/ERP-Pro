import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Info,
  Settings,
  X
} from "lucide-react";

import { api } from "./utils/api";
import Dashboard from "./components/Dashboard";
import ProductList from "./components/ProductList";
import CustomerList from "./components/CustomerList";
import OrderList from "./components/OrderList";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  
  // App-wide loading & toast state
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Toast notifier helper
  const triggerToast = (message, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Centralized data fetcher
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prodsData, custsData, ordsData, summaryData] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
        api.getOrders(),
        api.getDashboardSummary()
      ]);
      setProducts(prodsData);
      setCustomers(custsData);
      setOrders(ordsData);
      setSummary(summaryData);
    } catch (err) {
      triggerToast(err.message || "Failed to load database content", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ----------------- PRODUCT MUTATIONS -----------------
  const handleAddProduct = async (productData) => {
    try {
      const newProd = await api.createProduct(productData);
      setProducts((prev) => [newProd, ...prev]);
      triggerToast(`Product '${productData.name}' created successfully.`);
      // Refresh dashboard summary
      const summaryData = await api.getDashboardSummary();
      setSummary(summaryData);
    } catch (err) {
      triggerToast(err.message || "Failed to create product", "error");
    }
  };

  const handleUpdateProduct = async (id, productData) => {
    try {
      const updatedProd = await api.updateProduct(id, productData);
      setProducts((prev) => prev.map((p) => (p.id === id ? updatedProd : p)));
      triggerToast(`Product '${productData.name}' updated successfully.`);
      // Refresh dashboard summary
      const summaryData = await api.getDashboardSummary();
      setSummary(summaryData);
    } catch (err) {
      triggerToast(err.message || "Failed to update product", "error");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      triggerToast("Product removed from catalog.");
      // Refresh dashboard summary
      const summaryData = await api.getDashboardSummary();
      setSummary(summaryData);
    } catch (err) {
      triggerToast(err.message || "Failed to delete product", "error");
    }
  };

  // ----------------- CUSTOMER MUTATIONS -----------------
  const handleAddCustomer = async (customerData) => {
    try {
      const newCust = await api.createCustomer(customerData);
      setCustomers((prev) => [newCust, ...prev]);
      triggerToast(`Customer account for '${customerData.name}' registered successfully.`);
      // Refresh dashboard summary
      const summaryData = await api.getDashboardSummary();
      setSummary(summaryData);
    } catch (err) {
      triggerToast(err.message || "Failed to register customer", "error");
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer? Deleting a customer will cancel all their orders and restore their stock levels!")) return;
    try {
      await api.deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      triggerToast("Customer and associated invoices removed.");
      // Refresh database since order deletes mutated product stock and orders lists
      await loadData();
    } catch (err) {
      triggerToast(err.message || "Failed to delete customer", "error");
    }
  };

  // ----------------- ORDER MUTATIONS -----------------
  const handlePlaceOrder = async (orderData) => {
    try {
      const newOrder = await api.createOrder(orderData);
      setOrders((prev) => [newOrder, ...prev]);
      triggerToast(`Order #${newOrder.id} successfully processed.`);
      // Reload inventory catalog and summary metrics
      const [prodsData, summaryData] = await Promise.all([
        api.getProducts(),
        api.getDashboardSummary()
      ]);
      setProducts(prodsData);
      setSummary(summaryData);
    } catch (err) {
      triggerToast(err.message || "Failed to submit order", "error");
    }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order? Stock will be restored to the inventory catalog.")) return;
    try {
      await api.deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      triggerToast(`Order #${id} has been canceled. Inventory stock restored.`);
      // Refresh inventory catalog and dashboard summary
      const [prodsData, summaryData] = await Promise.all([
        api.getProducts(),
        api.getDashboardSummary()
      ]);
      setProducts(prodsData);
      setSummary(summaryData);
    } catch (err) {
      triggerToast(err.message || "Failed to cancel order", "error");
    }
  };

  // Navigation title mapping
  const getHeaderDetails = () => {
    switch (activeTab) {
      case "dashboard":
        return { title: "Operations Hub", subtitle: "Real-time summary statistics and alerts." };
      case "products":
        return { title: "Catalog Directory", subtitle: "Maintain products, pricing and inventory levels." };
      case "customers":
        return { title: "Client Accounts", subtitle: "Manage registered customer profiles." };
      case "orders":
        return { title: "Invoices Ledger", subtitle: "Track order fulfillments and billing." };
      default:
        return { title: "Management Center", subtitle: "" };
    }
  };

  const header = getHeaderDetails();

  return (
    <div className="app-container">
      {/* Toast Alert stack */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
            <button 
              className="btn-icon" 
              style={{ padding: "0.2rem", border: "none", background: "none" }}
              onClick={() => removeToast(t.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <TrendingUp size={24} className="text-primary" />
          <span>ERP Pro</span>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>

          <div 
            className={`nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <Package size={20} />
            <span>Products</span>
          </div>

          <div 
            className={`nav-item ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => setActiveTab("customers")}
          >
            <Users size={20} />
            <span>Customers</span>
          </div>

          <div 
            className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingBag size={20} />
            <span>Orders</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="flex-gap" style={{ justifyContent: "center", marginBottom: "0.5rem" }}>
            <Info size={12} />
            <span>Ver. 1.0.0 (Beta)</span>
          </div>
          <span>Containerized ERP Node</span>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h1>{header.title}</h1>
            <p>{header.subtitle}</p>
          </div>
          <div className="flex-gap">
            <button className="btn btn-secondary flex-gap" onClick={loadData} disabled={isLoading}>
              {isLoading ? "Syncing..." : "Sync Database"}
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="loader"></div>
        ) : (
          <div>
            {activeTab === "dashboard" && (
              <Dashboard summary={summary} setActiveTab={setActiveTab} />
            )}
            
            {activeTab === "products" && (
              <ProductList 
                products={products}
                onAdd={handleAddProduct}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
              />
            )}

            {activeTab === "customers" && (
              <CustomerList 
                customers={customers}
                onAdd={handleAddCustomer}
                onDelete={handleDeleteCustomer}
              />
            )}

            {activeTab === "orders" && (
              <OrderList 
                orders={orders}
                products={products}
                customers={customers}
                onAdd={handlePlaceOrder}
                onDelete={handleCancelOrder}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
