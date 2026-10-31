// Menu page: category filter buttons and the product grid, both from MySQL.
import { api } from '../api.js';
import { escapeHtml, productCard, renderList } from '../ui.js';

const filterBar = document.getElementById('category-filter');
const grid = document.getElementById('menu-grid');
let activeCategory = new URLSearchParams(location.search).get('category') ?? '';

function showProducts() {
  for (const button of filterBar.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.category === activeCategory));
  }
  renderList(
    grid,
    () => api.getProducts(activeCategory ? { category: activeCategory } : {}),
    productCard,
    'Nothing in this category yet.',
  );
}

filterBar.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  activeCategory = button.dataset.category;
  // Keep the filter in the URL so the page can be bookmarked or shared.
  history.replaceState(null, '', activeCategory ? `?category=${activeCategory}` : location.pathname);
  showProducts();
});

try {
  const categories = await api.getCategories();
  filterBar.insertAdjacentHTML(
    'beforeend',
    categories
      .map((c) => `<button type="button" data-category="${escapeHtml(c.slug)}" aria-pressed="false">${escapeHtml(c.name)}</button>`)
      .join(''),
  );
} catch {
  // If categories fail, the product grid below shows the error message.
}
showProducts();
