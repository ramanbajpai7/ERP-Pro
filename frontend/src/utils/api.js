const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    let data = null;
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = (data && data.detail) || response.statusText || "Request failed";
      throw new Error(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
    }

    return data;
  } catch (error) {
    console.error(`API Error: ${url}`, error);
    throw error;
  }
}

export const api = {
  // Dashboard summary metrics
  getDashboardSummary: () => request("/api/dashboard/summary"),

  // Products API
  getProducts: () => request("/api/products/"),
  getProductById: (id) => request(`/api/products/${id}`),
  createProduct: (productData) => request("/api/products/", {
    method: "POST",
    body: JSON.stringify(productData),
  }),
  updateProduct: (id, productData) => request(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(productData),
  }),
  deleteProduct: (id) => request(`/api/products/${id}`, {
    method: "DELETE",
  }),

  // Customers API
  getCustomers: () => request("/api/customers/"),
  getCustomerById: (id) => request(`/api/customers/${id}`),
  createCustomer: (customerData) => request("/api/customers/", {
    method: "POST",
    body: JSON.stringify(customerData),
  }),
  deleteCustomer: (id) => request(`/api/customers/${id}`, {
    method: "DELETE",
  }),

  // Orders API
  getOrders: () => request("/api/orders/"),
  getOrderById: (id) => request(`/api/orders/${id}`),
  createOrder: (orderData) => request("/api/orders/", {
    method: "POST",
    body: JSON.stringify(orderData),
  }),
  deleteOrder: (id) => request(`/api/orders/${id}`, {
    method: "DELETE",
  }),
};
