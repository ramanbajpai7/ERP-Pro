import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Edit2, Trash2, Search, X } from "lucide-react";

export default function ProductList({ products, onAdd, onUpdate, onDelete }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName("");
    setSku("");
    setPrice("");
    setQuantity("0");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validations
    if (!name.trim() || !sku.trim() || !price || !quantity) {
      alert("All fields are required.");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Price must be a valid positive number.");
      return;
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      alert("Quantity must be a valid non-negative integer.");
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      price: priceNum,
      quantity: qtyNum,
    };

    if (editingProduct) {
      onUpdate(editingProduct.id, payload);
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-card">
      <div className="flex-between mb-2">
        <h2>Product Catalog</h2>
        <button className="btn btn-primary flex-gap" onClick={handleOpenAddModal}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-bar-container">
        <div style={{ position: "relative", flexGrow: 1 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search products by name or SKU..."
            style={{ paddingLeft: "40px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">No products found matching your search.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock level</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td className="font-weight-600">{p.name}</td>
                  <td className="text-muted">{p.sku}</td>
                  <td>${parseFloat(p.price).toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        p.quantity === 0
                          ? "badge-danger"
                          : p.quantity < 10
                          ? "badge-warning"
                          : "badge-success"
                      }`}
                    >
                      {p.quantity} in stock
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="flex-gap" style={{ justifyContent: "flex-end" }}>
                      <button
                        className="btn-icon"
                        title="Edit Product"
                        onClick={() => handleOpenEditModal(p)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon delete"
                        title="Delete Product"
                        onClick={() => onDelete(p.id)}
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

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProduct ? "Modify Product details" : "Add New Product"}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ergonomic Office Chair"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SKU / Unique Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. CHAIR-ERG-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="form-label">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g. 199.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Initial Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 25"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
