(() => {
  'use strict';
  const query = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
  const interactive = 'a, button, input, select, textarea, [role="button"]';
  const cursor = document.createElement('div');
  cursor.className = 'cursor-accent';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);

  // Preserve the basic cursor effect if the CDN is unavailable.
  if (!window.gsap) {
    const media = window.matchMedia(query);
    document.addEventListener('pointermove', (event) => {
      if (!media.matches || event.pointerType !== 'mouse') return;
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      cursor.classList.add('is-visible');
      cursor.classList.toggle('is-interactive', Boolean(event.target.closest(interactive)));
    }, { passive: true });
    const hide = () => cursor.classList.remove('is-visible', 'is-interactive', 'is-pressed');
    document.addEventListener('pointerout', (event) => { if (!event.relatedTarget) hide(); });
    window.addEventListener('blur', hide);
    media.addEventListener('change', hide);
    return;
  }

  const gsap = window.gsap;
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.append(dot);
  const media = gsap.matchMedia();
  media.add(query, () => {
    document.documentElement.classList.add('gsap-enhanced');
    const controller = new AbortController();
    const options = { signal: controller.signal, passive: true };
    gsap.set([cursor, dot], { xPercent: -50, yPercent: -50, opacity: 0 });
    const ringX = gsap.quickTo(cursor, 'x', { duration: .38, ease: 'power3.out' });
    const ringY = gsap.quickTo(cursor, 'y', { duration: .38, ease: 'power3.out' });
    const dotX = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power2.out' });
    let visible = false;
    let active = false;
    const hide = () => {
      visible = false;
      active = false;
      gsap.to([cursor, dot], { opacity: 0, duration: .18, overwrite: 'auto' });
      gsap.to(cursor, { scale: 1, duration: .25, overwrite: 'auto' });
    };
    document.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      if (!visible) {
        gsap.set([cursor, dot], { x: event.clientX, y: event.clientY });
        gsap.to([cursor, dot], { opacity: .85, duration: .2, overwrite: 'auto' });
        visible = true;
      }
      ringX(event.clientX); ringY(event.clientY);
      dotX(event.clientX); dotY(event.clientY);
      const nextActive = Boolean(event.target.closest(interactive));
      if (nextActive !== active) {
        active = nextActive;
        gsap.to(cursor, { scale: active ? 1.55 : 1, backgroundColor: active ? 'rgba(255,255,10,.14)' : 'rgba(255,255,10,0)', duration: .45, ease: 'elastic.out(1, .65)', overwrite: 'auto' });
      }
    }, options);
    document.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') gsap.to(cursor, { scale: .72, duration: .16, ease: 'power2.out', overwrite: 'auto' });
    }, options);
    document.addEventListener('pointerup', (event) => {
      if (event.pointerType === 'mouse') gsap.to(cursor, { scale: active ? 1.55 : 1, duration: .5, ease: 'elastic.out(1, .5)', overwrite: 'auto' });
    }, options);
    document.addEventListener('pointerout', (event) => { if (!event.relatedTarget) hide(); }, options);
    window.addEventListener('blur', hide, options);

    // Move only actual call-to-action links; leave layout and noninteractive cards alone.
    const buttons = [...document.querySelectorAll('.button')];
    buttons.forEach((button) => {
      const arrow = button.querySelector('span');
      const moveX = gsap.quickTo(button, 'x', { duration: .45, ease: 'power3.out' });
      const moveY = gsap.quickTo(button, 'y', { duration: .45, ease: 'power3.out' });
      button.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        const rect = button.getBoundingClientRect();
        moveX((event.clientX - rect.left - rect.width / 2) * .13);
        moveY((event.clientY - rect.top - rect.height / 2) * .2);
      }, options);
      button.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse' && arrow) gsap.to(arrow, { x: 4, y: -4, duration: .4, ease: 'back.out(2)', overwrite: 'auto' });
      }, options);
      button.addEventListener('pointerleave', () => {
        moveX(0); moveY(0);
        if (arrow) gsap.to(arrow, { x: 0, y: 0, duration: .4, ease: 'power3.out', overwrite: 'auto' });
      }, options);
    });
    return () => {
      controller.abort();
      document.documentElement.classList.remove('gsap-enhanced');
      gsap.killTweensOf([cursor, dot, ...buttons]);
      gsap.set([cursor, dot], { clearProps: 'all' });
      buttons.forEach((button) => {
        gsap.killTweensOf(button.querySelectorAll('span'));
        gsap.set([button, ...button.querySelectorAll('span')], { clearProps: 'transform' });
      });
    };
  });
})();
