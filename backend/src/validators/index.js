// Server-side validation. The browser validates too, but anyone can bypass the browser
// (e.g. with curl), so the server must never trust incoming data.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9\s-]{7,15}$/;
const MAX_PICKUP_DAYS = 7;

const isBlank = (value) => typeof value !== 'string' || value.trim() === '';

function checkText(errors, body, field, label, { min = 1, max }) {
  const value = body[field];
  if (isBlank(value)) errors[field] = `${label} is required.`;
  else if (value.trim().length < min) errors[field] = `${label} must be at least ${min} characters.`;
  else if (value.trim().length > max) errors[field] = `${label} must be at most ${max} characters.`;
}

function checkEmail(errors, body, field) {
  if (isBlank(body[field]) || !EMAIL.test(body[field].trim())) errors[field] = 'A valid email address is required.';
}

export function validateOrder(body) {
  const errors = {};
  checkText(errors, body, 'customerName', 'Name', { min: 2, max: 100 });
  checkEmail(errors, body, 'customerEmail');
  if (isBlank(body.customerPhone) || !PHONE.test(body.customerPhone.trim())) {
    errors.customerPhone = 'A valid phone number is required.';
  }

  const pickup = new Date(body.pickupTime);
  const latest = Date.now() + MAX_PICKUP_DAYS * 24 * 60 * 60 * 1000;
  if (Number.isNaN(pickup.getTime()) || pickup.getTime() < Date.now() || pickup.getTime() > latest) {
    errors.pickupTime = `Pickup time must be within the next ${MAX_PICKUP_DAYS} days.`;
  }

  if (body.notes != null && (typeof body.notes !== 'string' || body.notes.length > 500)) {
    errors.notes = 'Notes must be at most 500 characters.';
  }

  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    errors.items = 'Add at least one item to your order.';
  } else if (!items.every((i) => Number.isInteger(i?.productId) && Number.isInteger(i?.quantity) && i.quantity >= 1 && i.quantity <= 20)) {
    errors.items = 'Each item needs a valid product and a quantity between 1 and 20.';
  }
  return errors;
}

export function validateReview(body) {
  const errors = {};
  if (!Number.isInteger(body.productId) || body.productId < 1) errors.productId = 'Please choose a product.';
  checkText(errors, body, 'name', 'Name', { min: 2, max: 60 });
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) errors.rating = 'Rating must be from 1 to 5.';
  checkText(errors, body, 'comment', 'Review', { min: 10, max: 1000 });
  return errors;
}

export function validateContact(body) {
  const errors = {};
  checkText(errors, body, 'name', 'Name', { min: 2, max: 100 });
  checkEmail(errors, body, 'email');
  checkText(errors, body, 'subject', 'Subject', { min: 3, max: 150 });
  checkText(errors, body, 'message', 'Message', { min: 10, max: 2000 });
  return errors;
}
