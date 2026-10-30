(() => {
  'use strict';
  if (!window.PEST_ICONS) return;
  const types = ['ant', 'cockroach', 'fly', 'mosquito', 'rodent', 'termite', 'lizard', 'spider'];
  const names = { ant: 'ant', cockroach: 'cockroach', fly: 'fly', mosquito: 'mosquito', rodent: 'rodent', termite: 'termite', lizard: 'lizard', spider: 'spider' };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.className = 'patrol-layer';
  layer.setAttribute('aria-label', 'Interactive pest patrol');
  const panel = document.createElement('div');
  panel.className = 'patrol-panel';
  panel.innerHTML = '<p>Pest patrol <span class="patrol-status" aria-live="polite">Click a pest to spray</span></p><button type="button" class="patrol-toggle" aria-pressed="true">Hide pests</button><button type="button" class="patrol-reset">Restart</button>';
  document.body.append(layer, panel);
  const toggle = panel.querySelector('.patrol-toggle');
  const reset = panel.querySelector('.patrol-reset');
  const status = panel.querySelector('.patrol-status');
  const actors = [];
  let enabled = true, blockers = [], lastFrame = 0, lastScan = 0, frameId = 0, count = 0;
  const gap = 5;
  const size = () => window.innerWidth <= 650 ? 42 : 48;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function updateBlockers() {
    const selectors = 'header, nav, a, button, h1, h2, h3, h4, p, input, textarea, select, label, .quick-chat, .patrol-panel, .pest-gallery';
    blockers = [...document.querySelectorAll(selectors)]
      .filter(el => !layer.contains(el))
      .flatMap(el => [...el.getClientRects()])
      .filter(r => r.width && r.height && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth);
  }
  function safe(x, y, except) {
    const s = size();
    if (x < 4 || y < 4 || x + s > innerWidth - 4 || y + s > innerHeight - 4) return false;
    if (blockers.some(r => x < r.right + gap && x + s > r.left - gap && y < r.bottom + gap && y + s > r.top - gap)) return false;
    return !actors.some(a => a !== except && !a.dead && a.placed && Math.abs(a.x - x) < s + 5 && Math.abs(a.y - y) < s + 5);
  }
  function place(actor) {
    const maxX = Math.max(5, innerWidth - size() - 5), maxY = Math.max(5, innerHeight - size() - 5);
    for (let i = 0; i < 180; i++) {
      const x = 5 + Math.random() * Math.max(0, maxX - 5), y = 5 + Math.random() * Math.max(0, maxY - 5);
      if (safe(x, y, actor)) { actor.x = x; actor.y = y; actor.placed = true; return true; }
    }
    actor.placed = false;
    return false;
  }
  function paint(actor) {
    actor.el.style.transform = `translate3d(${Math.round(actor.x)}px, ${Math.round(actor.y)}px, 0)`;
    actor.el.setAttribute('aria-hidden', String(!actor.placed || !enabled));
    actor.el.tabIndex = actor.placed && enabled && !actor.dead ? 0 : -1;
  }
  function updateStatus() { status.textContent = count === types.length ? 'All clear! Press Restart' : count ? `${count} of ${types.length} cleared` : 'Click a pest to spray'; }
  function spray(actor) {
    if (actor.dead) return;
    actor.dead = true;
    actor.el.classList.add('is-sprayed');
    actor.el.tabIndex = -1;
    const effect = document.createElement('span');
    effect.className = 'patrol-spray';
    effect.setAttribute('aria-hidden', 'true');
    effect.style.left = `${actor.x + size() / 2}px`;
    effect.style.top = `${actor.y + size() / 2}px`;
    effect.innerHTML = '<span class="patrol-can"></span><span class="patrol-mist"></span>';
    layer.append(effect);
    count++; updateStatus();
    if (document.activeElement === actor.el) toggle.focus({ preventScroll: true });
    window.setTimeout(() => { effect.remove(); actor.el.remove(); }, 850);
  }
  function populate() {
    layer.replaceChildren(); actors.length = 0; count = 0;
    updateBlockers();
    types.forEach((type, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'patrol-pest';
      button.setAttribute('aria-label', `Spray ${names[type]}`);
      button.title = `Spray ${names[type]}`;
      button.style.setProperty('--pest-detail', '#004b25');
      button.innerHTML = window.PEST_ICONS[type];
      const angle = index * Math.PI / 4 + Math.random();
      const speed = (type === 'fly' || type === 'mosquito') ? 20 : 12;
      const actor = { el: button, type, x: 0, y: 0, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, dead: false, placed: false, hovered: false, retryAt: 0 };
      actors.push(actor); layer.append(button);
      place(actor); paint(actor);
      button.addEventListener('pointerenter', () => { actor.hovered = true; });
      button.addEventListener('pointerleave', () => { actor.hovered = false; });
      button.addEventListener('click', () => spray(actor));
    });
    updateStatus();
  }
  function tick(time) {
    if (!enabled) { frameId = 0; return; }
    const dt = Math.min((time - (lastFrame || time)) / 1000, .05); lastFrame = time;
    if (time - lastScan > 350) { updateBlockers(); lastScan = time; }
    actors.forEach(actor => {
      if (actor.dead) return;
      if (!actor.placed || !safe(actor.x, actor.y, actor)) {
        if (document.activeElement !== actor.el) { actor.placed = false; if (time >= actor.retryAt) { place(actor); actor.retryAt = time + 500; } }
      } else if (!reducedMotion.matches && !actor.hovered && document.activeElement !== actor.el) {
        const nx = actor.x + actor.vx * dt, ny = actor.y + actor.vy * dt;
        if (safe(nx, ny, actor)) { actor.x = nx; actor.y = ny; }
        else {
          const angle = Math.random() * Math.PI * 2, speed = Math.hypot(actor.vx, actor.vy);
          actor.vx = Math.cos(angle) * speed; actor.vy = Math.sin(angle) * speed;
        }
      }
      actor.x = clamp(actor.x, 4, Math.max(4, innerWidth - size() - 4));
      actor.y = clamp(actor.y, 4, Math.max(4, innerHeight - size() - 4));
      paint(actor);
    });
    frameId = requestAnimationFrame(tick);
  }
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    toggle.textContent = enabled ? 'Hide pests' : 'Show pests';
    toggle.setAttribute('aria-pressed', String(enabled));
    layer.hidden = !enabled;
    actors.forEach(paint);
    if (enabled && !frameId) { lastFrame = 0; frameId = requestAnimationFrame(tick); }
  });
  reset.addEventListener('click', () => {
    if (!enabled) { enabled = true; layer.hidden = false; toggle.textContent = 'Hide pests'; toggle.setAttribute('aria-pressed', 'true'); }
    populate();
    if (!frameId) { lastFrame = 0; frameId = requestAnimationFrame(tick); }
  });
  populate(); frameId = requestAnimationFrame(tick);
})();


