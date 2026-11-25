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

## Design palette (decided 2026-06-30, green added 2026-11-24)
**White + UN blue, "similar to UN", with green for people power.** Light surfaces, dark-navy text, UN-blue accent (`#1f72c4`).
- **Peaceful revolution (counted) → green** (`#17803f`).
- **Developing revolution and protest movements → light green** (`#8fd6a0` with a `#17803f` outline). Not counted.
- **Coup and recent improvement → dark blue** (`#103d8c`).
- **War → red** (`#d64545`).
- **Peaceful revolution or developing revolution AND a 2025 war → green and red diagonal stripes.** War here means the curated `WAR` roster or an Uppsala 2025 war located in the country (`WAR_2025`); Mali on 2026-11-24. Plotly maps have no fill patterns, so `applyStripes()` sets an SVG pattern on those country shapes after every redraw (`plotly_afterplot`). The panel shows a second "War in 2025 · Uppsala data" pill for any country with an Uppsala war that is not already on the `WAR` roster.
- Dormant countries blend into the land tone; ocean is light blue; country borders white.
- Green replaced dark blue for revolutions on 2026-11-24 at the user's request ("light green for ongoing / recent protests / revolutions while green are the successful revolutions"). Still do not reintroduce the old yellow/orange/teal tiers.

Map colours are set in the JS `COLORSCALE` + the Plotly `geo` layout (land/ocean/lakes/country) and the marker traces; the CSS `:root` drives all chrome.

## Note
This repo is separate from the BaseX project (`/Users/m/Code/basex-polsia`) that a shared session may also have open. They are unrelated codebases.

## Country pages
`uk.html` and `brazil.html` are standalone per-country pages, same self-contained pattern as `index.html`, linked from the map header and from that country's panel. **`uk.html` still carries the old dark palette** and predates the white + UN-blue conversion — follow `index.html`, not `uk.html`, when adding a page.

`brazil.html` reads its countdown from `data/elections/BRA.json` so the page and the map cannot drift. Images live in `data/images/` and are served as WebP with a PNG fallback (`<picture>`); `cwebp -q 82` took the two posters from 5.3 MB to 715 KB. Any AI-generated image of a candidate carries a visible "criada por inteligência artificial" label — [TSE Resolution 23.755/2026](https://www.tse.jus.br/) requires explicit, prominent disclosure, and bans *new* synthetic content depicting candidates from 72h before the vote until 24h after (for 4 Oct 2026: 1–5 Oct).

## Elections (`data/elections/`)
National elections and referendums worldwide, from Wikipedia's national electoral calendars. `node scripts/elections/fetch-calendar.js 2025 2027` rebuilds; `index.json` is generated and carries `next`/`last` per country so the map loads one file, not 124. The panel shows the next election, falling back to the most recent one.

**National only** — no by-elections, local or regional votes; a country with no line may simply have nothing scheduled inside the fetched years (the UK's next is 2029). Wikidata SPARQL and IFES ElectionGuide were both tried and rejected; `data/elections/README.md` records why, and the sibling-date parsing trap that silently dropped Brazil on the first pass.

## Protest movements (`PROTEST` in `index.html`)
An overlay, not a status: a country can be a counted revolution (Serbia) or developing (Albania) and still carry a protest marker. Shown as a white dot with a blue ring, never counted toward the 51%. Each entry has a theme, a start year and a Wikipedia `event` title — `"Page#Section"` works and `eventUrl()` keeps the anchor. Seeded 2026-10-20 from Robert Muggah / SecDev, "A map of discontent" (2026), checked against Wikipedia; the US and Brazil entries have no article yet and cite that map instead. The Philippines, Chile and Argentina were added 2026-10-26 after thejuicemedia's "The Great F*%kOffening" (25 Oct 2026) named them; Chile and Argentina have no article of their own yet and link to the "Ongoing" table of Wikipedia's *Gen Z protests*.

The developing marker's pulse finds its trace by identity (`t._iso === DEV_KEYS`), not by index — a hard-coded `[1]` started pulsing the protest layer the moment a trace was inserted ahead of it.

## Armed conflicts 2025 (`data/conflicts/`)
An overlay from the Uppsala Conflict Data Program (version 26.1, year 2025): every fighting pair, with deaths, from `data/conflicts/ucdp-2025.json` (built by `scripts/conflicts/build-ucdp-2025.py`; field notes in `data/conflicts/README.md`). A red-ringed circle sits on each country where fighting took place, sized by deaths; the country panel lists the pairs and, for governments with troops abroad, where else they fought. Loaded after the map and added with `Plotly.addTraces`, so it sits last and never shifts the developing-marker index. It lives in its own view: a two-button switch on the map (`setView`) shows either "Revolutions & protests" (default: protest and developing markers, protest box in the panel) or "Armed conflicts 2025" (conflict circles, conflict box in the panel), or "Both" (everything at once, added 2026-11-25 at the user's request), so the two never read as one category. The status fill and non-UN diamonds show in both. It is context, not a status: the curated `WAR` roster and the red fill are unchanged, and nothing here counts toward the 51%. Russia's circle is moved to its western border (`POS` override) because its centroid is in Siberia.

## Iran (corrected 2026-11-24)
Iran was on `SEEDED` as a 2025 peaceful revolution. The user corrected it: the 2025–2026 uprising was crushed, "exactly opposite of peaceful", with an unknown death toll (Iranian government 3,117; estimates on Wikipedia run to 36,500+). Iran is now on `WAR` (Iran–Israel war, June 2025) with a `PROTEST` marker linking to *2025–2026 Iranian protests*. Do not put it back on the counted roster.

## One map only
The World Monitor live map used to be embedded under ours as an iframe. It was removed on 2026-11-23 at the user's request ("one is enough, we can link to external sources"). Two maps on one page confused people. World Monitor is now an external link in each country panel. Don't add a second embedded map; link out instead.

## Layer feed (`data/layer/`)
Machine-readable Planetary Council membership for third-party maps: `planetary-council.geojson` + `.json`, generated from the rosters in `index.html` by `node scripts/build-layer-feed.js` — rerun it whenever the rosters change. Served CORS-open (`*`) on GitHub Pages. Docs + WorldMonitor upstream-proposal draft: `LAYER-FEED.md`.
