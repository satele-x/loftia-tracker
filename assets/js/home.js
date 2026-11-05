// Home page: builds the game picker from /data/games.json
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // quick peek at local progress so each card can show "x ticked"
  function localCount(id) {
    try {
      const raw = localStorage.getItem(`satele:${id}:v1`);
      if (!raw) return null;
      const u = JSON.parse(raw);
      let n = 0;
      Object.values(u.items || {}).forEach(p => { if (p.d || (p.parts && Object.values(p.parts).some(Boolean)) || (p.p && p.p.some(Boolean))) n++; });
      return n;
    } catch (e) { return null; }
  }

  fetch('/data/games.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(cfg => {
      const games = cfg.games || [];
      document.getElementById('siteNav').innerHTML = games.map(g => `<a href="/${encodeURIComponent(g.id)}/">${esc(g.icon)} ${esc(g.name)}</a>`).join('');
      const cards = games.map(g => {
        const n = localCount(g.id);
        const col = g.color || ['#fde7f3', '#e6d3ea'];
        return `<a class="game-card" href="/${encodeURIComponent(g.id)}/" style="--gc:${esc(col[0])};--gd:${esc(col[1])}">
          <div class="ic">${esc(g.icon)}</div>
          <h3>${esc(g.name)}</h3>
          <p>${esc(g.tagline)}</p>
          <div class="meta">${g.status === 'beta' ? '<span>beta</span>' : ''}${n ? `<span class="prog">✓ ${n} ticked</span>` : '<span>open logbook →</span>'}</div>
        </a>`;
      });
      (cfg.comingSoon || []).forEach(s => cards.push(`<div class="game-card soon"><div class="ic">${esc(s.icon)}</div><h3>${esc(s.name)}</h3><p>More logbooks coming soon!</p></div>`));
      document.getElementById('games').innerHTML = cards.join('');
    })
    .catch(() => {
      document.getElementById('games').innerHTML = `<div class="game-card soon"><div class="ic">🌧️</div><h3>Couldn't load games</h3><p>Try refreshing the page.</p></div>`;
    });
})();
