import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Search, X } from "lucide-react";

export default function CustomerList({ customers, onAdd, onDelete }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleOpenAddModal = () => {
    setName("");
    setEmail("");
    setPhone("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Client-side validations
    if (!name.trim() || !email.trim() || !phone.trim()) {
      alert("All fields are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    onAdd({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    });
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <div className="glass-card">
      <div className="flex-between mb-2">
        <h2>Customer Accounts</h2>
        <button className="btn btn-primary flex-gap" onClick={handleOpenAddModal}>
          <Plus size={18} /> Add Customer
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
            placeholder="Search customers by name, email or phone..."
            style={{ paddingLeft: "40px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="table-container">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">No customers found matching your search.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Join Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td className="font-weight-600">{c.name}</td>
                  <td>
                    <a
                      href={`mailto:${c.email}`}
                      style={{ color: "var(--color-primary)", textDecoration: "none" }}
                    >
                      {c.email}
                    </a>
                  </td>
                  <td className="text-muted">{c.phone}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <div className="flex-gap" style={{ justifyContent: "flex-end" }}>
                      <button
                        className="btn-icon delete"
                        title="Delete Customer"
                        onClick={() => onDelete(c.id)}
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

      {/* Add Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Customer Account</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
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
                  Create Customer
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
