import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Eye, Trash2, X, PlusCircle, MinusCircle, ShoppingBag } from "lucide-react";

export default function OrderList({ orders, products, customers, onAdd, onDelete }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Order Placement Form Fields
  const [customerId, setCustomerId] = useState("");
  const [orderItems, setOrderItems] = useState([{ product_id: "", quantity: 1 }]);
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  // Live order total estimator
  useEffect(() => {
    let total = 0;
    orderItems.forEach((item) => {
      if (item.product_id) {
        const prod = products.find((p) => p.id === parseInt(item.product_id, 10));
        if (prod) {
          total += parseFloat(prod.price) * item.quantity;
        }
      }
    });
    setEstimatedTotal(total);
  }, [orderItems, products]);

  const handleOpenCreateModal = () => {
    if (customers.length === 0) {
      alert("Please create a customer account first.");
      return;
    }
    if (products.length === 0) {
      alert("Please add products to your catalog first.");
      return;
    }
    setCustomerId(customers[0].id.toString());
    setOrderItems([{ product_id: products[0].id.toString(), quantity: 1 }]);
    setIsCreateModalOpen(true);
  };

  const handleOpenDetailModal = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleAddItemRow = () => {
    // Add row defaulting to the first product that is not already selected
    const unselectedProd = products.find(
      (p) => !orderItems.some((item) => parseInt(item.product_id, 10) === p.id)
    );
    const defaultId = unselectedProd ? unselectedProd.id.toString() : products[0].id.toString();
    setOrderItems([...orderItems, { product_id: defaultId, quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (orderItems.length === 1) return;
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    if (field === "product_id") {
      newItems[index].product_id = value;
      // Reset quantity to 1 when product changes
      newItems[index].quantity = 1;
    } else if (field === "quantity") {
      const parsedQty = parseInt(value, 10);
      newItems[index].quantity = isNaN(parsedQty) || parsedQty <= 0 ? 1 : parsedQty;
    }
    setOrderItems(newItems);
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();

    if (!customerId) {
      alert("Customer is required.");
      return;
    }

    // Process and validate items
    const payloadItems = [];
    const seenProducts = new Set();

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.product_id) {
        alert("Please select a product for all lines.");
        return;
      }

      const pId = parseInt(item.product_id, 10);
      if (seenProducts.has(pId)) {
        alert("Duplicate products selected. Please aggregate duplicate products into a single line.");
        return;
      }
      seenProducts.add(pId);

      const product = products.find((p) => p.id === pId);
      if (!product) {
        alert("Selected product is invalid.");
        return;
      }

      if (product.quantity < item.quantity) {
        alert(
          `Insufficient stock for product '${product.name}'. Available: ${product.quantity}, requested: ${item.quantity}.`
        );
        return;
      }

      payloadItems.push({
        product_id: pId,
        quantity: item.quantity,
      });
    }

    onAdd({
      customer_id: parseInt(customerId, 10),
      items: payloadItems,
    });
    setIsCreateModalOpen(false);
  };

  return (
    <div className="glass-card">
      <div className="flex-between mb-2">
        <h2>Order Processing</h2>
        <button className="btn btn-primary flex-gap" onClick={handleOpenCreateModal}>
          <Plus size={18} /> New Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        {orders.length === 0 ? (
          <div className="empty-state">No orders processed yet.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Total Invoiced</th>
                <th>Ordered Items</th>
                <th>Order Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-weight-600">#{order.id}</td>
                  <td>
                    {order.customer ? (
                      <div>
                        <div className="font-weight-500">{order.customer.name}</div>
                        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                          {order.customer.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-danger">Deleted Customer</span>
                    )}
                  </td>
                  <td className="text-success font-weight-600">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} units
                    </span>
                  </td>
                  <td>
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="flex-gap" style={{ justifyContent: "flex-end" }}>
                      <button
                        className="btn-icon"
                        title="View Order Details"
                        onClick={() => handleOpenDetailModal(order)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        title="Cancel / Delete Order"
                        onClick={() => onDelete(order.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Place Order Modal */}
      {isCreateModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3>Place New Order</h3>
              <button className="btn-icon" onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitOrder}>
              <div className="modal-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {/* Customer Dropdown */}
                <div className="form-group">
                  <label className="form-label">Select Customer Account</label>
                  <select
                    className="form-control"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items Builder */}
                <div className="order-items-builder">
                  <div className="flex-between mb-1">
                    <span className="form-label" style={{ marginBottom: 0 }}>
                      Order Lines
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary flex-gap"
                      style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                      onClick={handleAddItemRow}
                    >
                      <PlusCircle size={14} /> Add Line
                    </button>
                  </div>

                  {orderItems.map((item, index) => {
                    const selectedProd = products.find(
                      (p) => p.id === parseInt(item.product_id, 10)
                    );
                    const maxStock = selectedProd ? selectedProd.quantity : 0;

                    return (
                      <div className="order-item-row" key={index}>
                        {/* Product Selector */}
                        <select
                          className="form-control"
                          style={{ flexGrow: 3 }}
                          value={item.product_id}
                          onChange={(e) =>
                            handleItemChange(index, "product_id", e.target.value)
                          }
                          required
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} - ${parseFloat(p.price).toFixed(2)} (Stock: {p.quantity})
                            </option>
                          ))}
                        </select>

                        {/* Quantity Counter */}
                        <input
                          type="number"
                          className="form-control"
                          style={{ width: "80px", flexGrow: 1 }}
                          min="1"
                          max={maxStock}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          required
                        />

                        {/* Remove Row Button */}
                        <button
                          type="button"
                          className="btn-icon delete"
                          style={{ padding: "0.625rem" }}
                          disabled={orderItems.length === 1}
                          onClick={() => handleRemoveItemRow(index)}
                        >
                          <MinusCircle size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Order total estimator */}
              <div className="modal-footer flex-between">
                <div style={{ textAlign: "left" }}>
                  <div className="text-muted" style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                    ESTIMATED TOTAL:
                  </div>
                  <div className="text-success" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                    ${estimatedTotal.toFixed(2)}
                  </div>
                </div>
                <div className="flex-gap">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-gap">
                    <ShoppingBag size={16} /> Submit Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Order Details Popup */}
      {isDetailModalOpen && selectedOrder && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Invoice Details - #{selectedOrder.id}</h3>
              <button className="btn-icon" onClick={() => setIsDetailModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {/* Customer summary */}
              <div className="mb-2" style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem" }}>
                <h4 className="mb-1" style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                  Customer Profile
                </h4>
                {selectedOrder.customer ? (
                  <div>
                    <div className="font-weight-600" style={{ fontSize: "1.1rem" }}>
                      {selectedOrder.customer.name}
                    </div>
                    <div className="text-secondary">{selectedOrder.customer.email}</div>
                    <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                      Tel: {selectedOrder.customer.phone}
                    </div>
                  </div>
                ) : (
                  <span className="text-danger">Deleted Customer profile</span>
                )}
              </div>

              {/* Items listing */}
              <div>
                <h4 className="mb-1" style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                  Invoiced Items
                </h4>
                <div className="table-container" style={{ border: "1px solid var(--border-glass)", borderRadius: "var(--radius-md)" }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th style={{ textAlign: "right" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="font-weight-500">{item.product_name}</div>
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                              {item.product_sku}
                            </div>
                          </td>
                          <td>x{item.quantity}</td>
                          <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                          <td style={{ textAlign: "right" }} className="font-weight-600">
                            ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer flex-between">
              <div>
                <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                  TOTAL INVOICED
                </div>
                <div className="text-success" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                  ${parseFloat(selectedOrder.total_amount).toFixed(2)}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close Invoice
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
