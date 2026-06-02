import React from "react";
import { Package, Users, ShoppingBag, AlertTriangle, ArrowRight } from "lucide-react";

export default function Dashboard({ summary, setActiveTab }) {
  if (!summary) {
    return <div className="loader"></div>;
  }

  const {
    total_products,
    total_customers,
    total_orders,
    low_stock_count,
    low_stock_products = [],
    recent_orders = []
  } = summary;

  return (
    <div>
      {/* Metrics Cards Grid */}
      <div className="metrics-grid">
        <div className="glass-card metric-card indigo">
          <div className="metric-header">
            <span>Total Products</span>
            <div className="metric-icon-wrapper text-indigo">
              <Package size={20} />
            </div>
          </div>
          <div className="metric-value">{total_products}</div>
          <div className="metric-label">Active Catalog Items</div>
        </div>

        <div className="glass-card metric-card pink">
          <div className="metric-header">
            <span>Total Customers</span>
            <div className="metric-icon-wrapper text-pink">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value">{total_customers}</div>
          <div className="metric-label">Registered Clients</div>
        </div>

        <div className="glass-card metric-card emerald">
          <div className="metric-header">
            <span>Total Orders</span>
            <div className="metric-icon-wrapper text-emerald">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="metric-value">{total_orders}</div>
          <div className="metric-label">Processed Invoices</div>
        </div>

        <div className="glass-card metric-card amber">
          <div className="metric-header">
            <span>Low Stock Warning</span>
            <div className="metric-icon-wrapper text-amber">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="metric-value">{low_stock_count}</div>
          <div className="metric-label">Items with Stock &lt; 10</div>
        </div>
      </div>

      {/* Main Dashboard Layout Grid */}
      <div className="dashboard-grid">
        {/* Recent Orders log */}
        <div className="glass-card">
          <div className="flex-between mb-2">
            <h2>Recent Orders Activity</h2>
            <button 
              className="btn btn-secondary flex-gap"
              onClick={() => setActiveTab("orders")}
            >
              Manage Orders <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="table-container">
            {recent_orders.length === 0 ? (
              <div className="empty-state">No orders placed yet.</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customer_name}</td>
                      <td className="text-success font-weight-600">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td>
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Items sidebar widget */}
        <div className="glass-card">
          <div className="flex-between mb-2">
            <h2 className="flex-gap">
              <AlertTriangle className="text-danger" size={22} />
              Low Stock Alerts
            </h2>
            <span className="badge badge-danger">{low_stock_count} items</span>
          </div>

          <div className="table-container">
            {low_stock_products.length === 0 ? (
              <div className="empty-state">
                <span className="text-success">✔ All products are well stocked!</span>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {low_stock_products.map((product) => (
                    <tr key={product.id}>
                      <td className="font-weight-600">{product.name}</td>
                      <td className="text-muted">{product.sku}</td>
                      <td>
                        <span className={`badge ${product.quantity === 0 ? "badge-danger" : "badge-warning"}`}>
                          {product.quantity} left
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
