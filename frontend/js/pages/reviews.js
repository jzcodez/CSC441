// Reviews page: lists the latest reviews and posts new ones (MongoDB).
// The product dropdown is filled from the menu (MySQL).
import { api } from '../api.js';
import { setupForm } from '../validation.js';
import { escapeHtml, renderList, reviewCard } from '../ui.js';

const list = document.getElementById('review-list');
const form = document.getElementById('review-form');
const productSelect = form.elements.productId;

renderList(list, () => api.getLatestReviews(12), (review) => reviewCard(review), 'No reviews yet. Be the first!');

try {
  const products = await api.getProducts();
  productSelect.insertAdjacentHTML(
    'beforeend',
    products.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join(''),
  );
  const preselected = new URLSearchParams(location.search).get('product');
  if (preselected) productSelect.value = preselected;
} catch {
  document.getElementById('productId-error').textContent = "The product list couldn't be loaded.";
}

setupForm(form, {
  rules: {
    comment: (value) => (value.trim().split(/\s+/).length < 3 ? 'Please write at least three words.' : ''),
  },
  async onSubmit() {
    const review = await api.createReview({
      productId: Number(productSelect.value),
      name: form.elements.name.value,
      rating: Number(form.elements.rating.value),
      comment: form.elements.comment.value,
    });
    form.reset();
    list.querySelector('.placeholder')?.remove();
    list.insertAdjacentHTML('afterbegin', reviewCard(review));
    return 'Thank you! Your review has been posted.';
  },
});
