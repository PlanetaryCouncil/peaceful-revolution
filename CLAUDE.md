# Peaceful Revolution — Activation Threshold

## What this is
A single-page, hand-curated **situation map of the world**: peaceful revolutions, developing uprisings, coups, and wars. A meter tracks how many nations & peoples are "online" (have had a peaceful revolution) toward a 51% threshold that, conceptually, rewrites the Charter "by those present". A conceptual instrument, not a forecast or legal claim.

## Stack & structure
- **No build, no framework.** `index.html` is the whole app: inline `<style>` + inline `<script>`, using **Plotly** (`cdn.plot.ly`) for a choropleth world map with scattergeo marker overlays. Fonts from Google Fonts.
- `uk.html` — a standalone "fractal" page for the United Kingdom (same self-contained pattern).
- Data lives inline in `index.html` as JS objects (UN members, developing, non-UN/de-facto polities); each entry links to Wikipedia as a starting point.
- Prose companions: `DECLARATION.md`, `LETTER.md`, `LETTERS.md`, `README.md`.

## Local dev
Static server, no dependencies: launch config `static` (`python3 -m http.server 5050`) in `.claude/launch.json`, or just open `index.html`. Preview served on **port 5050**.

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
