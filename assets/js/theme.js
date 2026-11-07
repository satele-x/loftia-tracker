// Day / dusk theme. Loaded in <head> (not deferred) so the page never flashes the wrong colours.
// Remembers the visitor's choice; until they pick one it follows their device's light/dark setting.
(function () {
  const KEY = 'satele:theme';
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  const sys = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const pick = () => saved || (sys && sys.matches ? 'dusk' : 'day');
  function apply(t) {
    root.dataset.theme = t;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t === 'dusk' ? '#2a2347' : '#fde7f3';
    const b = document.getElementById('themeBtn');
    if (b) {
      b.textContent = t === 'dusk' ? '☀️' : '🌙';
      b.title = t === 'dusk' ? 'Switch to day' : 'Switch to dusk';
      b.setAttribute('aria-label', b.title);
    }
  }
  apply(pick());
  if (sys && sys.addEventListener) sys.addEventListener('change', () => { if (!saved) apply(pick()); });

  document.addEventListener('DOMContentLoaded', () => {
    const head = document.querySelector('.site-head .in');
    if (!head) return;
    const b = document.createElement('button');
    b.id = 'themeBtn'; b.className = 'theme-btn'; b.type = 'button';
    head.appendChild(b);
    b.addEventListener('click', () => {
      saved = root.dataset.theme === 'dusk' ? 'day' : 'dusk';
      try { localStorage.setItem(KEY, saved); } catch (e) { /* storage blocked */ }
      apply(saved);
    });
    apply(root.dataset.theme);
  });
})();