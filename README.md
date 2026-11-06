# ✦ satele's logbook

Cute, free progress trackers for cozy games. It's a plain static site with no build step and no framework, so it runs on Cloudflare Pages.

```
/
├── index.html              home page (game picker)
├── loftia.html             Loftia logbook   → yoursite/loftia
├── stardew.html            Stardew bundles  → yoursite/stardew
├── 404.html                "lost in the clouds" page
├── _headers                security + caching headers (Cloudflare Pages reads this)
├── _redirects              keeps old /loftia/ and /stardew/ links working
├── data/                   ← EVERYTHING YOU EDIT LIVES HERE
│   ├── games.json          games shown on the home page
│   ├── loftia.json         the Loftia lists
│   ├── stardew.json        the Stardew bundles
│   └── _template.json      starter file for a new game
├── assets/
│   ├── css/                base.css (shared) · home.css · tracker.css
│   ├── js/                 sky.js · home.js · tracker.js (the logbook engine)
│   └── img/                capy.svg mascot · favicon-32/512.png · apple-touch-icon.png
└── tools/
    ├── validate.mjs        checks the data files before you deploy
    └── format-data.mjs     tidies a data file (one entry per line)
```

## How saving works

There are two separate layers, and that's what lets you update the site without wiping anyone's progress.

1. **Your lists** (`data/loftia.json`) are the same for everyone. They're fetched fresh on every visit.
2. **Each visitor's progress** stays in their own browser (`localStorage`, key `satele:loftia:v1`). It saves only their ticks, pins and notes, matched to each entry's `id`, plus anything they add, rename or hide themselves.

When someone opens the page, the logbook combines the two. It never stores anything on a server, so there are no accounts and no personal data. People can download a backup file from 🧺 to move between devices.

## Updating the lists ✏️

1. Edit `data/loftia.json`. Each entry looks like this:
   ```json
   {"id":"research.central-lake.craftcore","name":"Craftcore","note":"Page 2 · unlocks …","needs":["Plank","Plastic Sheet"]}
   ```
   | field | what it does |
   |---|---|
   | `id` | **permanent** ID that progress is saved against (see the golden rule) |
   | `name` | what's shown; safe to fix typos |
   | `note` | grey line under the name |
   | `needs` | tickable tags; add `×3` and they're summed up in 📌 Pinned |
   | `after` | quest **name** that unlocks it; shows 🔒 until that quest is ticked |
   | `pick` | for "any N of these" bundles: done once N of the `needs` are ticked (e.g. `"pick": 5`) |
   | `levels` | tiered upgrades (permits): `[{"name":"Tier 2","needs":["Dew ×25"]}, …]`, shown as dots + the next price |
   | `startLv` | how many `levels` everyone starts with already done (e.g. `1` = Tier 1 is free) |
   | `badges` | coloured tags, e.g. `["Quest","Gridfall"]` (colours live in `tracker.css` as `.qs.badge-<name>`) |
   | `price` | shop price, e.g. `"75"` or a range `"20–40"`. Ticking a priced entry = bought. A recipe with the **same name** shows it as "💧 75 blueprint", and 💝 wishing one wishes both |
   | `cur` | currency for this entry if it's different from its category's (`dew` 💧 or `bloom` 🌸) |

   Category options: `"currency": "dew"` (or `"bloom"`) sets the currency for every `price` in a shop category. `"note"` shows a line under the heading (e.g. the room reward). `"tags": ["Battered","Used","Spotless"]` gives the same tags to every entry. `"ordered": true` shows the "▶ next up" badge, and a pinned entry passes its pin to the next one when it's finished. `"reset": "daily"` or `"weekly"` makes ticks clear automatically. Use `"resetUtcHour": 3` for a game's server reset (UTC, so it's right in every timezone), or `resetHour` (0–23) for the visitor's own local time; `resetDay` (0 = Sunday) picks the day for weekly.

2. **Bump `"version"`**, for example `"2026.11.12"`. Visitors then see "📦 lists updated", and new entries get a **new!** badge.
3. Run the checker: `node tools/validate.mjs`
4. Deploy (see below). Everyone gets the new lists on their next visit, with their ticks still there.

### ⭐ The golden rule: never change an `id` once it's live
Progress is saved against the `id`. You can rename, re-note, reorder or move entries freely, but if you change or delete an `id`, people lose their ticks on that entry. New entries need new, unique IDs (the convention is `menu.category.entry-name`). The validator warns you if an ID disappears compared to your last git commit.

**Need to merge or move an entry?** (e.g. five quests that turned out to be parts of one big quest) Delete the old entries and add a `"moved"` map at the top of the file, next to `"menus"`:
```json
"moved": {
  "quests.main-story.blind-date": {"to": "quests.main-story.too-many-spores-spoil-the-soup", "part": "Blind Date"}
}
```
Anyone who had ticked the old entry gets that tick carried over: onto the named `part` tag, or onto the whole entry if you leave `part` out. Pins come along too. Keep these lines around for a while so returning visitors get migrated.

Changing a `needs` amount (`Carrot ×4` → `Carrot ×5`) keeps the tick, because ticks are matched on the item name ("carrot"), not the number.

## Adding another game 🎮
1. Copy `data/_template.json` to `data/<gameid>.json` and fill it in.
2. Copy `loftia.html` to `<gameid>.html`, then change `data-game="loftia"`, the `<title>`, the description and the footer credit.
3. Add the game to `data/games.json`.
4. Run `node tools/validate.mjs`.

## Running it locally
Pages fetch their JSON, so opening the file directly (`file://`) won't work. Run a tiny local server from this folder instead (locally the pages are `/loftia.html`; on Cloudflare they're also at `/loftia`):
```
python3 -m http.server 8000      # then open http://localhost:8000
# or:  npx serve .
```

## Deploying on Cloudflare Pages
**Recommended: GitHub plus Pages.**
1. Push this folder to a GitHub repo.
2. In Cloudflare, go to Workers & Pages → Create → Pages → Connect to Git and pick the repo.
3. Set the framework preset to **None**, leave the build command empty, and set the output directory to `/`.
4. Under Custom domains, add your domain.

From then on, updating the lists is just editing `data/loftia.json` on GitHub (even from your phone) and committing. Cloudflare redeploys in under a minute.

**Alternative: direct upload.** Choose Pages → Upload assets and drag this folder in. Re-upload whenever you change something.

## Security notes 🔒
- `_headers` sets a strict Content-Security-Policy: scripts only from this site, no inline scripts, fonts from Google Fonts only, no framing. It also sets `nosniff`, a referrer policy and a locked-down permissions policy.
- Everything shown on the page is HTML-escaped before rendering, including visitors' own notes and imported backups.
- Imported backup files are size-capped and parsed as JSON only.
- There's no server-side code, no cookies, no analytics and no personal data.