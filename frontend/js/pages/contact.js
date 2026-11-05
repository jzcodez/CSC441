// Contact page: validates the form and saves the message to MongoDB.
import { api } from '../api.js';
import { setupForm } from '../validation.js';

const form = document.getElementById('contact-form');

setupForm(form, {
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
