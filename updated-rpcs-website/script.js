const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  menu.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
  nav.classList.toggle('open', !open);
});
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open menu');
    nav.classList.remove('open');
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-ready');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

// Keep the section navigator in sync with the reader's position.
const chapterLinks = [...document.querySelectorAll('.chapter-links a')];
const chapters = chapterLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const progressBar = document.querySelector('.reading-progress span');
function updateChapterNavigation() {
  const threshold = window.innerHeight * 0.34 + 65;
  let current = null;
  chapters.forEach(section => { if (section.getBoundingClientRect().top <= threshold) current = section.id; });
  chapterLinks.forEach(link => {
    const active = current && link.getAttribute('href') === `#${current}`;
    link.classList.toggle('active', Boolean(active));
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${scrollable > 0 ? Math.min(100, Math.max(0, window.scrollY / scrollable * 100)) : 0}%`;
}
let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(() => { updateChapterNavigation(); scrollTicking = false; });
    scrollTicking = true;
  }
}, { passive: true });
window.addEventListener('resize', updateChapterNavigation);
updateChapterNavigation();
