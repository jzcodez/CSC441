// Small helpers for turning API data into HTML.

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatPrice = (amount) => currency.format(amount);

// Anything typed by a user (names, reviews) must be escaped before it goes into innerHTML,
// otherwise someone could post a review containing <script> tags (an XSS attack).
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

export function renderStars(rating) {
  const filled = Math.round(rating);
  return `<span class="stars" role="img" aria-label="${rating} out of 5 stars">${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}</span>`;
}

export function productImage(product) {
  return `<div class="product-image" aria-hidden="true">${
    product.imageUrl ? `<img src="${escapeHtml(product.imageUrl)}" alt="">` : escapeHtml(product.name.charAt(0))
  }</div>`;
}

export function productCard(product) {
  return `
    <article class="card product-card">
      ${productImage(product)}
      <div class="product-body">
        <h3><a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></h3>
        <p>${escapeHtml(product.description)}</p>
        <div class="product-meta">
          <span class="price">${formatPrice(product.price)}</span>
          <span class="badge">${escapeHtml(product.category)}</span>
        </div>
      </div>
    </article>`;
}

export function reviewCard(review, { showProduct = true } = {}) {
  const date = new Date(review.createdAt);
  const product = showProduct
    ? ` <span class="review-product">on <a href="product.html?id=${review.productId}">${escapeHtml(review.productName)}</a></span>`
    : '';
  return `
    <article class="card review">
      <header>
        <div><strong>${escapeHtml(review.name)}</strong>${product}</div>
        ${renderStars(review.rating)}
      </header>
      <p>${escapeHtml(review.comment)}</p>
      <time datetime="${date.toISOString()}">${date.toLocaleDateString(undefined, { dateStyle: 'medium' })}</time>
    </article>`;
}

export function showPlaceholder(container, message, { error = false } = {}) {
  container.innerHTML = `<p class="placeholder${error ? ' placeholder--error' : ''}">${escapeHtml(message)}</p>`;
}

// Loads a list from the API and renders it, with loading, empty and error states.
export async function renderList(container, load, renderItem, emptyMessage) {
  showPlaceholder(container, 'Loading…');
  try {
    const items = await load();
    if (items.length === 0) showPlaceholder(container, emptyMessage);
    else container.innerHTML = items.map((item) => renderItem(item)).join('');
  } catch (err) {
    showPlaceholder(container, err.message, { error: true });
  }
}
