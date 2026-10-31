// Form validation shared by every form on the site. It works in two layers:
//
// 1. HTML5: each input declares its own rules in the markup (required, type="email", pattern,
//    minlength/maxlength, min/max), and the browser's Constraint Validation API checks them.
// 2. JavaScript: this module reads those results, shows friendly inline messages next to each
//    field, and adds custom rules HTML can't express (opening hours, matching emails, ...).
//
// The server validates everything again, because anything in the browser can be bypassed.

const MESSAGES = {
  valueMissing: (field) => (field.type === 'radio' ? 'Please choose an option.' : 'This field is required.'),
  typeMismatch: (field) => (field.type === 'email' ? 'Please enter a valid email address, like name@example.com.' : 'Please enter a valid value.'),
  patternMismatch: (field) => field.dataset.patternMessage || 'Please match the requested format.',
  tooShort: (field) => `Please enter at least ${field.minLength} characters (you have ${field.value.length}).`,
  tooLong: (field) => `Please enter no more than ${field.maxLength} characters.`,
  rangeUnderflow: (field) => field.dataset.rangeMessage || `Please enter ${field.min} or more.`,
  rangeOverflow: (field) => field.dataset.rangeMessage || `Please enter ${field.max} or less.`,
  stepMismatch: () => 'Please enter a whole number.',
  badInput: () => 'Please enter a valid value.',
};

function messageFor(field) {
  if (field.validity.customError) return field.validationMessage;
  const state = Object.keys(MESSAGES).find((key) => field.validity[key]);
  return state ? MESSAGES[state](field) : field.validationMessage;
}

// Shows a message in the element with id "<name>-error" and marks the fields invalid/valid.
export function showError(name, message, fields = []) {
  const errorElement = document.getElementById(`${name}-error`);
  if (errorElement) errorElement.textContent = message;
  for (const field of fields) field.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validateField(field, form, rules) {
  field.setCustomValidity('');
  const rule = rules[field.name];
  // Custom rules only run once the HTML5 checks pass, so messages appear one at a time.
  if (field.validity.valid && rule) field.setCustomValidity(rule(field.value, form) || '');

  const message = field.validity.valid ? '' : messageFor(field);
  const group = field.type === 'radio' ? [...form.elements[field.name]] : [field];
  showError(field.name, message, group);
  return !message;
}

function setStatus(element, type = '', message = '') {
  if (!element) return;
  element.className = `form-status${type ? ` form-status--${type}` : ''}`;
  element.textContent = message;
}

/**
 * Wires up validation and submission for a form.
 *
 * @param {HTMLFormElement} form
 * @param {object} options
 * @param {Object<string, (value: string, form: HTMLFormElement) => string>} [options.rules]
 *   Custom per-field rules, keyed by field name. Return an error message, or '' if valid.
 * @param {Object<string, (form: HTMLFormElement) => string>} [options.groupRules]
 *   Rules that look at several fields at once (e.g. "at least one item"). The message is
 *   shown in the element with id "<key>-error".
 * @param {(form: HTMLFormElement) => Promise<string|void>} options.onSubmit
 *   Sends the data. Return a success message to show, or throw to show an error.
 */
export function setupForm(form, { rules = {}, groupRules = {}, onSubmit }) {
  form.noValidate = true; // show our own inline messages instead of the browser's pop-ups
  const status = form.querySelector('.form-status');
  const fields = () => [...form.elements].filter((element) => element.willValidate);

  const runGroupRules = (onlyVisible = false) =>
    Object.entries(groupRules).map(([name, rule]) => {
      if (onlyVisible && !document.getElementById(`${name}-error`)?.textContent) return true;
      const message = rule(form) || '';
      showError(name, message);
      return !message;
    });

  // Check a field when the user leaves it, then re-check as they type to clear the error.
  form.addEventListener('focusout', (event) => {
    if (event.target.willValidate) validateField(event.target, form, rules);
  });
  const revalidate = (event) => {
    if (event.target.willValidate && event.target.getAttribute('aria-invalid') === 'true') {
      validateField(event.target, form, rules);
    }
    runGroupRules(true);
  };
  form.addEventListener('input', revalidate);
  form.addEventListener('change', revalidate);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus(status);

    // map() before every() so that every field is checked, not just up to the first error.
    const fieldsValid = fields().map((field) => validateField(field, form, rules)).every(Boolean);
    const groupsValid = runGroupRules().every(Boolean);
    if (!fieldsValid || !groupsValid) {
      setStatus(status, 'error', 'Please fix the highlighted fields and try again.');
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      const message = await onSubmit(form);
      if (message) setStatus(status, 'success', message);
    } catch (err) {
      // Show the server's per-field messages next to the matching inputs.
      for (const [name, message] of Object.entries(err.details ?? {})) {
        showError(name, message, [...form.querySelectorAll(`[name="${name}"]`)]);
      }
      setStatus(status, 'error', err.message);
    } finally {
      submitButton.disabled = false;
    }
  });
}
