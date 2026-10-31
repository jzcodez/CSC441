// Product page: combines both databases on one page.
// Product details come from MySQL; its reviews and average rating come from MongoDB.
import { api } from '../api.js';
import { escapeHtml, formatPrice, productImage, renderStars, reviewCard, showPlaceholder } from '../ui.js';

const id = new URLSearchParams(location.search).get('id');
const detail = document.getElementById('product-detail');
const reviewsSection = document.getElementById('product-reviews');
const summary = document.getElementById('rating-summary');
const reviewList = document.getElementById('review-list');

async function showProduct() {
  try {
    const product = await api.getProduct(id);
    document.title = `${product.name} | Ember & Bean`;
    detail.innerHTML = `
      ${productImage(product)}
      <div>
        <span class="badge">${escapeHtml(product.category)}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <p>${escapeHtml(product.description)}</p>
        <p class="price">${formatPrice(product.price)}</p>
        <div class="hero-actions hero-actions--start">
          <a class="btn btn--primary" href="order.html?product=${product.id}">Order now</a>
          <a class="btn btn--outline" href="reviews.html?product=${product.id}#review-form">Write a review</a>
        </div>
      </div>`;
    return true;
  } catch (err) {
    showPlaceholder(detail, err.message, { error: true });
    return false;
  }
}

async function showReviews() {
  reviewsSection.hidden = false;
  try {
    const { average, count, reviews } = await api.getProductReviews(id);
    summary.innerHTML = count
      ? `${renderStars(average)} <strong>${average}</strong> <span>from ${count} review${count === 1 ? '' : 's'}</span>`
      : '';
    if (count === 0) showPlaceholder(reviewList, 'No reviews yet. Be the first to share your thoughts!');
    else reviewList.innerHTML = reviews.map((review) => reviewCard(review, { showProduct: false })).join('');
  } catch (err) {
    // The product details above still work even if the reviews database is down.
    showPlaceholder(reviewList, `Reviews are unavailable right now: ${err.message}`, { error: true });
  }
}

if (!id) {
  showPlaceholder(detail, 'No product selected. Pick something from our menu.');
} else if (await showProduct()) {
  await showReviews();
}
