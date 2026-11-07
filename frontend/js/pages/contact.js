// Contact page: validates the form and saves the message to MongoDB.
import { api } from '../api.js';
import { setupForm } from '../validation.js';

const form = document.getElementById('contact-form');
const messageInput = form.elements.message;
const messageCount = document.getElementById('message-count');

// Live character counter, so people can see how close they are to the limit.
function updateCount() {
  messageCount.textContent = `${messageInput.value.length} / ${messageInput.maxLength} characters`;
}
messageInput.addEventListener('input', updateCount);
form.addEventListener('reset', () => setTimeout(updateCount)); // after the reset has cleared the field

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
