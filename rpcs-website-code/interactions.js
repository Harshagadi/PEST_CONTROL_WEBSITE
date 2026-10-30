(() => {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const cursor = document.createElement('div');
  cursor.className = 'cursor-accent';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);
  const interactive = 'a, button, input, select, textarea, [role="button"]';
  document.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || event.pointerType !== 'mouse') return;
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
    cursor.classList.add('is-visible');
    cursor.classList.toggle('is-interactive', Boolean(event.target.closest(interactive)));
  }, { passive: true });
  document.addEventListener('pointerdown', (event) => { if (event.pointerType === 'mouse') cursor.classList.add('is-pressed'); });
  document.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'));
  document.addEventListener('pointerout', (event) => { if (!event.relatedTarget) cursor.classList.remove('is-visible', 'is-pressed', 'is-interactive'); });
  window.addEventListener('blur', () => cursor.classList.remove('is-visible', 'is-pressed', 'is-interactive'));
  finePointer.addEventListener('change', () => cursor.classList.remove('is-visible', 'is-pressed', 'is-interactive'));
})();
