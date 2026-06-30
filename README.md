# Peaceful Revolution — Activation Threshold

A curated **situation map of the world**: where peaceful revolutions have taken
hold, where coups and wars are underway, and where things are fragile but
improving. It is a conceptual art / activism instrument — **not a forecast** —
built around one idea:

> Legitimacy follows **those present**, not those recognized. When a majority
> (**51%**) of nations and peoples have come online through *peaceful*
> revolution, the board declares the UN Charter “rewritten by those present.”

**Live:** https://map.planetarycouncil.org
**Companion:** https://flamingorevolution.org (the developing situation in Albania)

---

## The two files

| File | What it is |
|------|------------|
| `index.html` | The world board — a curated, sourced situation map of all 193 UN members plus first-class non-UN polities. |
| `uk.html` | A standalone **fractal** drill-down of the United Kingdom: UK → 4 nations → England's 9 regions → all 650 constituencies, with a 51% meter at every level. |

Both are single self-contained HTML files. No build step, no backend, no
storage — open them in a browser (the map loads Plotly from a CDN, so it needs
an internet connection). State lives only in the page.

## The fractal 51% rule

The same rule applies at every level:

- A **region** is online when ≥51% of its sub-units are.
- A **nation** is online when ≥51% of its regions are.
- The **world** activates when ≥51% of nations & peoples are.

The world board tracks the top level; `uk.html` demonstrates the rule all the
way down to a single constituency.

## Situation categories

The map is curated by hand. Each place is in exactly one state:

| State | Colour | Counts toward 51%? |
|-------|--------|--------------------|
| Peaceful revolution | 🟢 green | **yes** |
| Developing | 🟡 yellow | no — until it crosses |
| Recent improvement | 🩵 teal | no — a fragile turn for the better |
| Coup d'état | 🟠 orange | no — a takeover is not a peaceful revolution |
| War / armed conflict | 🔴 red | no — shown for context |
| Dormant | slate | — |
| Non-UN polity | 🔷 diamond marker | yes (first-class), coloured by its own state |

Only **peaceful revolutions** count toward the threshold. Coups, wars, and
recent improvements are shown to illustrate the real state of the world but are
deliberately **not** counted — that distinction is the whole point.

## Editing the data

Everything is curated at the top of the `<script>` in `index.html`:

- `SEEDED` — peaceful revolutions (`iso: year`).
- `DEVELOPING` — situations unfolding now (Albania / Flamingo Revolution).
- `IMPROVING` — recent improvements (Syria post-Assad, Lebanon ceasefire).
- `COUP` — the Sahel coup belt (Burkina Faso, Guinea, Niger, Gabon, Chad).
- `WAR` — armed conflicts (Ukraine, Sudan, DR Congo, Gaza/Palestine).
- `NON_UN` — first-class non-UN / de-facto / disputed polities (Kosovo, Taiwan,
  Palestine, Western Sahara, N. Cyprus, Somaliland, Abkhazia, S. Ossetia,
  Transnistria), shown as diamond markers.
- `REV_EVENT` — optional links to a specific event article (else falls back to
  the country's Wikipedia page).

Each entity links to **Wikipedia** by default; many also link to the specific
event (e.g. *Russian invasion of Ukraine*, *2023 Nigerien coup d'état*, *Fall of
the Assad regime*). What counts as a “revolution” is contested, contestable, and
yours to rewrite.

## Deploying (GitHub Pages)

The repo is set up for GitHub Pages with a custom subdomain:

- `CNAME` → `map.planetarycouncil.org`
- `.nojekyll` → serve files as-is

1. Create a public repo under the `planetarycouncil` account.
2. `git remote add origin …` and `git push -u origin main`.
3. Settings → Pages → Deploy from a branch → `main` / root.
4. DNS: `CNAME` record `map` → `planetarycouncil.github.io`.
5. Enable **Enforce HTTPS** once DNS propagates.

## Accessibility & craft

Responsive to mobile, visible keyboard focus, `prefers-reduced-motion`
respected, transparent/dark theme, characterful display + monospace + body
fonts.

## Open threads

- **Mali** is currently a green peaceful revolution but is also the archetypal
  coup-belt country — decide whether to recategorize.
- **Event links** are filled for wars, coups, and a few revolutions; the rest
  fall back to country Wikipedia and can be curated per entry.
- **Greenland** and other territories can be added to `NON_UN` in one line.
- **Share / preview meta** (Open Graph + Twitter card) before wide sharing.

---

*A conceptual instrument about participatory, citizen-driven change — not a
legal claim, and not a forecast. The roster reflects the 2022–2026 wave and is
meant to be argued over.*
