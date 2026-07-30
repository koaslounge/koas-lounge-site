const toggle = document.querySelector('.mobile-toggle');
const navShell = document.querySelector('.nav-shell');
if (toggle && navShell) {
  toggle.addEventListener('click', () => {
    const open = navShell.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });
  navShell.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navShell.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    });
  });
}

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});
