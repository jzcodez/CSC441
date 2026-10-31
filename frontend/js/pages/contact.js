// Contact page: validates the form and saves the message to MongoDB.
import { api } from '../api.js';
import { setupForm } from '../validation.js';

const form = document.getElementById('contact-form');

setupForm(form, {
  rules: {
    // A cross-field rule: HTML5 can't compare two inputs, so JavaScript does it.
    confirmEmail: (value, form) =>
      value.trim().toLowerCase() !== form.elements.email.value.trim().toLowerCase() ? 'Email addresses do not match.' : '',
  },
  async onSubmit() {
    const name = form.elements.name.value.trim();
    await api.sendMessage({
      name,
      email: form.elements.email.value,
      subject: form.elements.subject.value,
      message: form.elements.message.value,
    });
    form.reset();
    return `Thanks, ${name}! We'll get back to you within one business day.`;
  },
});
