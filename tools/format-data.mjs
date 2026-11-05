// Pretty-prints a game data file so each item sits on one line (easy to edit & diff).
// Usage: node tools/format-data.mjs data/loftia.json
import fs from 'fs';
const file = process.argv[2];
if (!file) { console.error('usage: node tools/format-data.mjs data/<game>.json'); process.exit(1); }
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const j = v => JSON.stringify(v);
const o = [];
o.push('{');
for (const k of Object.keys(d).filter(k => k !== 'menus')) o.push(`  ${j(k)}: ${j(d[k])},`);
o.push('  "menus": [');
d.menus.forEach((m, mi) => {
  const { cats, ...mrest } = m;
  o.push(`    { ${Object.entries(mrest).map(([k, v]) => `${j(k)}: ${j(v)}`).join(', ')}, "cats": [`);
  cats.forEach((c, ci) => {
    const { items, ...crest } = c;
    o.push(`      { ${Object.entries(crest).map(([k, v]) => `${j(k)}: ${j(v)}`).join(', ')}, "items": [`);
    items.forEach((it, ii) => o.push(`        ${j(it)}${ii < items.length - 1 ? ',' : ''}`));
    o.push(`      ]}${ci < cats.length - 1 ? ',' : ''}`);
  });
  o.push(`    ]}${mi < d.menus.length - 1 ? ',' : ''}`);
});
o.push('  ]');
o.push('}');
fs.writeFileSync(file, o.join('\n') + '\n');
console.log('formatted', file);
