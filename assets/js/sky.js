// Drifting clouds + floating islands behind every page. Purely decorative.
(function () {
  const sky = document.getElementById('sky');
  if (!sky) return;
  let h = '';
  for (let i = 0; i < 6; i++) {
    const w = 90 + Math.random() * 120, top = Math.random() * 85, dur = 70 + Math.random() * 80, delay = -Math.random() * dur;
    h += `<div class="cloud" style="width:${w}px;height:${w * .32}px;top:${top}%;animation-duration:${dur}s;animation-delay:${delay}s"></div>`;
  }
  const isl = (x, y, s, d) => `<svg class="island" style="left:${x}%;top:${y}%;width:${s}px;animation-delay:${d}s;opacity:.55" viewBox="0 0 100 70" aria-hidden="true"><ellipse cx="50" cy="22" rx="42" ry="10" fill="#9be7c4"/><path d="M10 22 Q50 80 90 22 Z" fill="#d7b48f"/><path d="M22 24 Q50 58 78 24Z" fill="#c49a70"/><circle cx="36" cy="10" r="9" fill="#7fd6a8"/><rect x="34.5" y="12" width="3" height="10" fill="#a07850"/><circle cx="62" cy="13" r="6" fill="#ffb3d1"/></svg>`;
  h += isl(3, 30, 90, 0) + isl(88, 58, 70, -2) + isl(80, 12, 50, -4);
  sky.innerHTML = h;
})();
