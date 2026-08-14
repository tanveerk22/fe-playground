export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [q, a] = row.children;
    if (!q || !a) return;

    const btn = document.createElement('button');
    btn.className = 'accordion-header';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `<span>${q.textContent}</span><span class="accordion-icon"></span>`;
    a.className = 'accordion-content';
    row.replaceChildren(btn, a);
  });

  block.addEventListener('click', ({ target }) => {
    const btn = target.closest('.accordion-header');
    if (!btn) return;

    const isExpanding = btn.getAttribute('aria-expanded') !== 'true';

    // Close all other accordion items when opening one
    if (isExpanding) {
      block.querySelectorAll('.accordion-header[aria-expanded="true"]').forEach((openBtn) => {
        if (openBtn !== btn) openBtn.setAttribute('aria-expanded', 'false');
      });
    }

    btn.setAttribute('aria-expanded', isExpanding);
  });
}
