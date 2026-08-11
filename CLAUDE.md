# Peaceful Revolution — Activation Threshold

## What this is
A single-page, hand-curated **situation map of the world**: peaceful revolutions, developing uprisings, coups, and wars. A meter tracks how many nations & peoples are "online" (have had a peaceful revolution) toward a 51% threshold that, conceptually, rewrites the Charter "by those present". A conceptual instrument, not a forecast or legal claim.

## Stack & structure
- **No build, no framework.** `index.html` is the whole app: inline `<style>` + inline `<script>`, using **Plotly** (`cdn.plot.ly`) for a choropleth world map with scattergeo marker overlays. Fonts from Google Fonts.
- `uk.html` — a standalone "fractal" page for the United Kingdom (same self-contained pattern).
- Data lives inline in `index.html` as JS objects (UN members, developing, non-UN/de-facto polities); each entry links to Wikipedia as a starting point.
- Prose companions: `DECLARATION.md`, `LETTER.md`, `LETTERS.md`, `README.md`.

## Contacts dataset (`data/contacts/`)
Official contact channels per country — **email is the priority**, plus websites, Facebook, Twitter/X, phone, address. Every entry carries a `source` so it can be re-verified.

- **One file per country**: `data/contacts/{ISO3}-{CountryName}.json`. Independent files let contributors PR a single country without merge conflicts.
- **`index.json` is generated, never hand-edited.** It maps ISO3 → real filename. The app reads it instead of guessing filenames — agent-written `country_name` drifts from the map's display name (`Democratic Republic of the Congo` vs `DR Congo`), and guessing 404s silently.
- **After adding or editing any country file, run `node scripts/build-contacts-index.js`.** Skipping this means the app won't see your change.
- `scripts/ingest-workflow-results.js <journal.jsonl>` ingests research-workflow output. Idempotent: keeps one file per ISO and won't overwrite a richer record with a thinner one.
- **`scripts/verify-contacts.js` — run after every ingest.** The data is agent-collected and unverified: it strips Cloudflare `[email protected]` placeholders, retypes prose-in-email-field to `contact_form`, and marks entries whose domain has no MX/A/CNAME as `"unresolved": <date>`. The app hides `unresolved` entries and `index.json` excludes them from counts, so coverage is never overstated. `--fix` applies; without it you get a dry-run report. Re-running clears the mark if a domain recovers. Its DNS check is tri-state on purpose — bulk lookups get rate-limited, and treating a SERVFAIL as NXDOMAIN mismarks live government domains as dead.
- The schema is deliberately loose — maximize collected data now, tighten later. Use `value` for emails/phones/addresses, `url` for links.
- Wikipedia and CIA Factbook links are **generated** (from the country name and `data/factbook-slugs.json`) — don't add them as contact entries.
- `data/HERMES_TASK.md` is the brief for handing bulk collection to a cheap local agent.

## Local dev
Static server, no dependencies: launch config `static` (`python3 -m http.server 5050`) in `.claude/launch.json`, or just open `index.html`. Preview served on **port 5050**.

**Note:** `python3 -m http.server` sends caching headers that make plain reloads serve a stale `index.html`. Hard-reload (or `location.replace('/?cb='+Date.now())`) after editing, or you'll debug code the browser isn't running.

## Deploy
GitHub Pages — `CNAME` → `map.planetarycouncil.org`, `.nojekyll` present. Push to `main` to publish.

## Design palette (decided 2026-06-30)
**White + UN blue, "similar to UN".** Light surfaces, dark-navy text, UN-blue accent (`#1f72c4`).
- Any country with a **situation** (peaceful revolution / developing / coup / recent improvement) → **dark blue** (`#103d8c`).
- **War is the single semantic exception → red** (`#d64545`).
- Dormant countries blend into the land tone; ocean is light blue; country borders white.
- Only **peaceful revolutions count** toward the 51% threshold; that distinction lives in the meter / chips / side panel, not in map hue.
- Do not reintroduce the old green/yellow/orange/teal tier colours. Red is reserved for war only.

Map colours are set in the JS `COLORSCALE` + the Plotly `geo` layout (land/ocean/lakes/country) and the marker traces; the CSS `:root` drives all chrome.

## Note
This repo is separate from the BaseX project (`/Users/m/Code/basex-polsia`) that a shared session may also have open. They are unrelated codebases.

## Layer feed (`data/layer/`)
Machine-readable Planetary Council membership for third-party maps: `planetary-council.geojson` + `.json`, generated from the rosters in `index.html` by `node scripts/build-layer-feed.js` — rerun it whenever the rosters change. Served CORS-open (`*`) on GitHub Pages. Docs + WorldMonitor upstream-proposal draft: `LAYER-FEED.md`.
