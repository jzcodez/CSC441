// Home page: featured products (MySQL) and the latest reviews (MongoDB).
import { api } from '../api.js';
import { productCard, reviewCard, renderList } from '../ui.js';

renderList(
  document.getElementById('featured-products'),
  () => api.getProducts({ featured: true }),
  productCard,
  'Our featured drinks are coming soon.',
);

renderList(
  document.getElementById('latest-reviews'),
  () => api.getLatestReviews(3),
  (review) => reviewCard(review),
  'No reviews yet.',
);
