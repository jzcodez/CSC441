// Every call to the backend goes through this file, so pages never build URLs or parse
// responses themselves. If an endpoint changes, only this file needs updating.

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.details = body.details; // per-field messages from server-side validation
    throw error;
  }
  return body;
}

const post = (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) });

export const api = {
  // MySQL
  getCategories: () => request('/categories'),
  getProducts: (params = {}) => request(`/products?${new URLSearchParams(params)}`),
  getProduct: (id) => request(`/products/${encodeURIComponent(id)}`),
  createOrder: (order) => post('/orders', order),

  // MongoDB
  getProductReviews: (id) => request(`/products/${encodeURIComponent(id)}/reviews`),
  getLatestReviews: (limit = 6) => request(`/reviews?limit=${limit}`),
  createReview: (review) => post('/reviews', review),
  sendMessage: (message) => post('/contact', message),
};
