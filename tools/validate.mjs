// Checks every game data file before you deploy.
// Usage (from the site folder):  node tools/validate.mjs
// Exits with an error if something would break the site or lose people's progress.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);
const ID_RE = /^[a-z0-9][a-z0-9.\-]*$/;
const RESETS = ['', 'daily', 'weekly'];

function read(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { err(`${path.relative(root, file)}: not valid JSON — ${e.message}`); return null; }
}

// ids that were live in the last commit (if this is a git repo) — removing them drops people's ticks
function previousIds(rel) {
  try {
    const txt = execSync(`git show HEAD:${rel}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const d = JSON.parse(txt), ids = new Set();
    d.menus.forEach(m => m.cats.forEach(c => c.items.forEach(i => ids.add(i.id))));
    return ids;
  } catch { return null; }
}

const games = read(path.join(root, 'data/games.json'));
if (games) {
  for (const g of games.games || []) {
    if (!ID_RE.test(g.id || '')) err(`games.json: bad game id "${g.id}"`);
    const dataFile = path.join(root, 'data', `${g.id}.json`);
    const page = path.join(root, g.id, 'index.html');
    if (!fs.existsSync(dataFile)) err(`games.json lists "${g.id}" but data/${g.id}.json is missing`);
    if (!fs.existsSync(page)) err(`games.json lists "${g.id}" but ${g.id}/index.html is missing`);
    else if (!fs.readFileSync(page, 'utf8').includes(`data-game="${g.id}"`)) err(`${g.id}/index.html: <body data-game="${g.id}"> doesn't match`);
  }
}

for (const f of fs.readdirSync(path.join(root, 'data'))) {
  if (!f.endsWith('.json') || f === 'games.json' || f.startsWith('_')) continue;
  const rel = `data/${f}`, d = read(path.join(root, rel));
  if (!d) continue;
  const where = s => `${rel} › ${s}`;
  if (d.game !== f.replace(/\.json$/, '')) err(where(`"game" should be "${f.replace(/\.json$/, '')}"`));
  if (!d.version) err(where('missing "version" — bump it whenever you change the lists'));
  if (!Array.isArray(d.menus)) { err(where('"menus" must be a list')); continue; }

  const ids = new Set(), names = new Set(), afters = [];
  const seeId = (id, ctx) => {
    if (typeof id !== 'string' || !ID_RE.test(id)) err(where(`${ctx}: id "${id}" must be lowercase letters, numbers, dots or dashes`));
    else if (ids.has(id)) err(where(`${ctx}: duplicate id "${id}" — every id must be unique`));
    ids.add(id);
  };
  let count = 0;
  d.menus.forEach((m, mi) => {
    const mctx = `menu ${m.name || mi}`;
    seeId(m.id, mctx);
    if (!m.name) err(where(`${mctx}: missing "name"`));
    if (!Array.isArray(m.cats)) { err(where(`${mctx}: "cats" must be a list`)); return; }
    m.cats.forEach((c, ci) => {
      const cctx = `${mctx} › ${c.name || ci}`;
      seeId(c.id, cctx);
      if (!c.name) err(where(`${cctx}: missing "name"`));
      if (c.reset != null && !RESETS.includes(c.reset)) err(where(`${cctx}: "reset" must be "daily" or "weekly"`));
      if (c.tags && !Array.isArray(c.tags)) err(where(`${cctx}: "tags" must be a list`));
      if (!Array.isArray(c.items)) { err(where(`${cctx}: "items" must be a list`)); return; }
      const local = new Set();
      c.items.forEach((it, ii) => {
        const ictx = `${cctx} › ${it.name || '#' + ii}`;
        count++;
        seeId(it.id, ictx);
        if (!it.name) err(where(`${ictx}: missing "name"`));
        if (it.needs && (!Array.isArray(it.needs) || it.needs.some(n => typeof n !== 'string'))) err(where(`${ictx}: "needs" must be a list of text`));
        if (it.needs && c.tags) warn(where(`${ictx}: has both "needs" and category "tags" — "needs" wins`));
        if (it.after) afters.push([it.after, ictx]);
        const n = (it.name || '').toLowerCase();
        if (local.has(n)) warn(where(`${ictx}: same name appears twice in this category`));
        local.add(n); names.add(n);
      });
    });
  });
  // "moved": old ids that now live somewhere else
  const moved = d.moved || {};
  const byId = {};
  d.menus.forEach(m => m.cats.forEach(c => c.items.forEach(i => { byId[i.id] = i; })));
  Object.entries(moved).forEach(([oldId, m]) => {
    if (ids.has(oldId)) warn(where(`moved: "${oldId}" is still in the lists — it doesn't need a "moved" entry`));
    if (!m || !byId[m.to]) { err(where(`moved: "${oldId}" points to "${m && m.to}", which doesn't exist`)); return; }
    if (m.part && !(byId[m.to].needs || []).some(n => n.replace(/\s*[×x]\s*\d+\s*$/i, '').trim().toLowerCase() === m.part.toLowerCase()))
      err(where(`moved: "${oldId}" → part "${m.part}" isn't one of ${m.to}'s "needs"`));
  });
  afters.forEach(([a, ctx]) => { if (!names.has(a.toLowerCase())) warn(where(`${ctx}: "after" points to "${a}", which isn't in the list (it'll show as available)`)); });

  const prev = previousIds(rel);
  if (prev) {
    const gone = [...prev].filter(id => !ids.has(id) && !moved[id]);
    if (gone.length) warn(where(`${gone.length} id(s) removed or renamed since last commit — people lose ticks on these:\n      ${gone.slice(0, 10).join('\n      ')}${gone.length > 10 ? '\n      …' : ''}`));
  }
  console.log(`✓ ${rel}: ${d.menus.length} menus, ${count} entries, version ${d.version}`);
}

warns.forEach(w => console.log('⚠️  ' + w));
if (errors.length) { errors.forEach(e => console.log('❌ ' + e)); console.log(`\n${errors.length} problem(s) — fix these before deploying.`); process.exit(1); }
console.log(warns.length ? '\nLooks OK (check the warnings above).' : '\nAll good! ✨');
