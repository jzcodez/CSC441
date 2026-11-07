// Order page: builds the item list from the menu (MySQL), keeps a live order summary,
// validates the form (HTML5 + custom rules) and saves the order to MySQL.
import { api } from '../api.js';
import { setupForm } from '../validation.js';
import { escapeHtml, formatPrice, showPlaceholder } from '../ui.js';
import {
  CAFE_TIME_ZONE_LABEL,
  HOURS_LABEL,
  OPEN_LABEL,
  SLOT_MINUTES,
  formatCafeTime as formatTime,
  todaysPickupSlots,
} from '../cafeTime.js';

const form = document.getElementById('order-form');
const clearButton = document.getElementById('clear-order');
const itemsContainer = document.getElementById('order-items');
const summaryList = document.getElementById('summary-items');
const summaryTotal = document.getElementById('summary-total');
const confirmation = document.getElementById('order-confirmation');
const pickupInput = form.elements.pickupTime;
const pickupHint = document.getElementById('pickupTime-hint');
const currentTime = document.getElementById('current-time');
const submitButton = form.querySelector('[type="submit"]');

let products = [];

// Live clock next to the pickup field, showing the café's time so customers can see how far
// away each slot is.
function updateClock() {
  const now = new Date();
  currentTime.textContent = `${formatTime(now)} (${CAFE_TIME_ZONE_LABEL})`;
  currentTime.dateTime = now.toISOString();
}

// Fills the pickup drop-down. Option values are ISO timestamps, which is what the API expects.
function renderPickupSlots() {
  const slots = todaysPickupSlots();
  const firstValue = slots[0]?.toISOString() ?? '';
  if (pickupInput.options[1]?.value === firstValue && firstValue) return; // nothing changed

  const selected = pickupInput.value;
  if (slots.length === 0) {
    pickupInput.innerHTML = '<option value="">No pickup times left today</option>';
    pickupHint.textContent = `We're closed for online orders today. Ordering opens again at ${OPEN_LABEL} tomorrow.`;
    submitButton.disabled = true;
    return;
  }
  pickupHint.textContent = `Pickup is today only, every ${SLOT_MINUTES} minutes. We're open daily from ${HOURS_LABEL} (${CAFE_TIME_ZONE_LABEL}).`;
  submitButton.disabled = products.length === 0; // stays disabled if the menu failed to load
  pickupInput.innerHTML =
    '<option value="">Choose a time…</option>' +
    slots.map((s) => `<option value="${s.toISOString()}">${formatTime(s)}</option>`).join('');
  if ([...pickupInput.options].some((option) => option.value === selected)) pickupInput.value = selected;
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
    <p>Order number <strong>#${order.id}</strong>. Pick it up today at
      <strong>${formatTime(new Date(order.pickupTime))}</strong>.</p>
    <ul>${order.items.map((item) => `<li>${item.quantity} × ${escapeHtml(item.name)}: ${formatPrice(item.unitPrice * item.quantity)}</li>`).join('')}</ul>
    <p class="order-total"><span>Total</span><span>${formatPrice(order.total)}</span></p>
    <a class="btn btn--primary" href="order.html">Place another order</a>`;
  confirmation.scrollIntoView({ behavior: 'smooth' });
}

// HTML5 "required" makes sure a time is chosen; this rule catches a slot that went by
// while the page was left open.
const rules = {
  pickupTime: (value) =>
    new Date(value).getTime() < Date.now() ? 'That pickup time has passed. Please choose a later one.' : '',
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
  submitButton.disabled = true;
}

renderPickupSlots();
setInterval(renderPickupSlots, 60 * 1000); // drop slots that pass while the page is open
updateClock();
setInterval(updateClock, 1000); // checked every second so the minute changes on time

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
      pickupTime: pickupInput.value,
      notes: form.elements.notes.value,
      items: selectedItems().map(({ product, quantity }) => ({ productId: product.id, quantity })),
    });
    showConfirmation(order);
  },
});
