// Order page: builds the item list from the menu (MySQL), keeps a live order summary,
// validates the form (HTML5 + custom rules) and saves the order to MySQL.
import { api } from '../api.js';
import { setupForm } from '../validation.js';
import { escapeHtml, formatPrice, showPlaceholder } from '../ui.js';

const OPEN_HOUR = 7;
const CLOSE_HOUR = 20;
const MIN_LEAD_MINUTES = 15;
const MAX_DAYS_AHEAD = 7;

const form = document.getElementById('order-form');
const clearButton = document.getElementById('clear-order');
const itemsContainer = document.getElementById('order-items');
const summaryList = document.getElementById('summary-items');
const summaryTotal = document.getElementById('summary-total');
const confirmation = document.getElementById('order-confirmation');
const pickupInput = form.elements.pickupTime;

let products = [];

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:MM" in the user's local time.
function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function selectedItems() {
  return products
    .map((product) => ({ product, quantity: Number(form.elements[`qty-${product.id}`].value) || 0 }))
    .filter((item) => item.quantity > 0);
}

function updateSummary() {
  const items = selectedItems();
  summaryList.innerHTML = items.length
    ? items
        .map(({ product, quantity }) => `<li><span>${quantity} × ${escapeHtml(product.name)}</span><span>${formatPrice(product.price * quantity)}</span></li>`)
        .join('')
    : '<li class="placeholder">No items yet.</li>';
  const totalCents = items.reduce((sum, { product, quantity }) => sum + Math.round(product.price * 100) * quantity, 0);
  summaryTotal.textContent = formatPrice(totalCents / 100);
}

function renderItems() {
  itemsContainer.innerHTML = products
    .map(
      (product) => `
      <div class="order-item">
        <label for="qty-${product.id}" class="order-item-name">${escapeHtml(product.name)} <span class="badge">${escapeHtml(product.category)}</span></label>
        <span class="price">${formatPrice(product.price)}</span>
        <input type="number" id="qty-${product.id}" name="qty-${product.id}" min="0" max="20" step="1" value="0" inputmode="numeric">
      </div>`,
    )
    .join('');

  // Pre-fill one item when arriving from a product page ("Order now").
  const preselected = new URLSearchParams(location.search).get('product');
  const input = preselected && form.elements[`qty-${preselected}`];
  if (input) input.value = 1;
}

function showConfirmation(order) {
  form.closest('.order-layout').hidden = true;
  confirmation.hidden = false;
  confirmation.innerHTML = `
    <h2>Thank you! Your order is in.</h2>
    <p>Order number <strong>#${order.id}</strong>. Pick it up on
      <strong>${new Date(order.pickupTime).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</strong>.</p>
    <ul>${order.items.map((item) => `<li>${item.quantity} × ${escapeHtml(item.name)}: ${formatPrice(item.unitPrice * item.quantity)}</li>`).join('')}</ul>
    <p class="order-total"><span>Total</span><span>${formatPrice(order.total)}</span></p>
    <a class="btn btn--primary" href="order.html">Place another order</a>`;
  confirmation.scrollIntoView({ behavior: 'smooth' });
}

// HTML5 handles "required" and the min/max range; these rules add the shop's business logic.
const rules = {
  pickupTime(value) {
    const time = new Date(value);
    if (time.getTime() < Date.now() + MIN_LEAD_MINUTES * 60 * 1000) {
      return `Please allow at least ${MIN_LEAD_MINUTES} minutes for us to prepare your order.`;
    }
    const minutes = time.getHours() * 60 + time.getMinutes();
    if (minutes < OPEN_HOUR * 60 || minutes > CLOSE_HOUR * 60 - 15) {
      return `We're open ${OPEN_HOUR}:00 to ${CLOSE_HOUR}:00. Please choose a pickup time between ${OPEN_HOUR}:00 and ${CLOSE_HOUR - 1}:45.`;
    }
    return '';
  },
};

const groupRules = {
  items: () => (selectedItems().length === 0 ? 'Please add at least one item to your order.' : ''),
};

try {
  products = await api.getProducts();
  renderItems();
  updateSummary();
} catch (err) {
  showPlaceholder(itemsContainer, `The menu couldn't be loaded: ${err.message}`, { error: true });
  form.querySelector('[type="submit"]').disabled = true;
}

const now = new Date();
pickupInput.min = toLocalInputValue(now);
pickupInput.max = toLocalInputValue(new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000));

itemsContainer.addEventListener('input', updateSummary);
clearButton.addEventListener('click', () => {
  form.reset();
  updateSummary();
});


setupForm(form, {
  rules,
  groupRules,
  async onSubmit() {
    const order = await api.createOrder({
      customerName: form.elements.customerName.value,
      customerEmail: form.elements.customerEmail.value,
      customerPhone: form.elements.customerPhone.value,
      pickupTime: new Date(pickupInput.value).toISOString(),
      notes: form.elements.notes.value,
      items: selectedItems().map(({ product, quantity }) => ({ productId: product.id, quantity })),
    });
    showConfirmation(order);
  },
});
