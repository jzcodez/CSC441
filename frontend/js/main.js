// Shared behaviour for every page: the mobile navigation toggle and the footer year.

const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');

navToggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

for (const element of document.querySelectorAll('[data-current-year]')) {
  element.textContent = new Date().getFullYear();
}
