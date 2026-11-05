# ✦ satele logbooks

Cute, free progress trackers for cozy games. It's a plain static site with no build step and no framework, so it runs on Cloudflare Pages.

```
/
├── index.html              home page (game picker)
├── 404.html                "lost in the clouds" page
├── favicon.svg
├── _headers                security + caching headers (Cloudflare Pages reads this)
├── loftia/index.html       the Loftia logbook page
├── data/
│   ├── games.json          list of games shown on the home page
│   ├── loftia.json         ← THE LOFTIA LISTS (edit this to update the site)
│   └── _template.json      starter file for a new game
├── assets/
│   ├── css/base.css        shared theme, header, footer
│   ├── css/home.css        home page
│   ├── css/tracker.css     logbook page
│   ├── js/sky.js           drifting clouds
│   ├── js/home.js          builds the game cards
│   ├── js/tracker.js       the logbook engine
│   └── img/capy.svg        the capybara mascot
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
   | `needs` | tickable tags; add `×3` and they're summed up in 📌 Needed |
   | `after` | quest **name** that unlocks it; shows 🔒 until that quest is ticked |

   Category options: `"tags": ["Battered","Used","Spotless"]` gives the same tags to every entry. `"ordered": true` shows the "▶ next up" badge. `"reset": "daily"` or `"weekly"`, with `resetHour` (0–23) and `resetDay` (0 = Sunday), makes ticks clear automatically.

2. **Bump `"version"`**, for example `"2026.11.12"`. Visitors then see "📦 lists updated", and new entries get a **new!** badge.
3. Run the checker: `node tools/validate.mjs`
4. Deploy (see below). Everyone gets the new lists on their next visit, with their ticks still there.

### ⭐ The golden rule: never change an `id` once it's live
Progress is saved against the `id`. You can rename, re-note, reorder or move entries freely, but if you change or delete an `id`, people lose their ticks on that entry. New entries need new, unique IDs (the convention is `menu.category.entry-name`). The validator warns you if an ID disappears compared to your last git commit.

Changing a `needs` amount (`Carrot ×4` → `Carrot ×5`) keeps the tick, because ticks are matched on the item name ("carrot"), not the number.

## Adding another game 🎮
1. Copy `data/_template.json` to `data/<gameid>.json` and fill it in.
2. Copy the `loftia/` folder to `<gameid>/` and change `data-game="loftia"` and the `<title>` in its `index.html`.
3. Add the game to `data/games.json`.
4. Run `node tools/validate.mjs`.

## Running it locally
Pages fetch their JSON, so opening the file directly (`file://`) won't work. Run a tiny local server from this folder instead:
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
