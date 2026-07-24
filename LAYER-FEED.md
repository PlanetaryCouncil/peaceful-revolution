# Planetary Council — Membership Layer Feed

A machine-readable layer of **Planetary Council membership**: countries and peoples where a
peaceful revolution has taken hold (**members** — counted toward the 51% activation threshold)
or is unfolding now (**candidates**). Derived from the hand-curated, sourced rosters on
[map.planetarycouncil.org](https://map.planetarycouncil.org/) — same data, machine shape.

Built for third-party map engines and dashboards that want to draw "who has onboarded" as a layer.

## Endpoints

| URL | Format |
|---|---|
| `https://map.planetarycouncil.org/data/layer/planetary-council.geojson` | GeoJSON FeatureCollection — Point per country, `[lon, lat]` |
| `https://map.planetarycouncil.org/data/layer/planetary-council.json` | Summary + flat country list |

- **CORS:** `Access-Control-Allow-Origin: *` — fetch from any origin, client-side.
- **Cadence:** static file, updates when the curated map updates (git history = change log).
- **License:** data CC-BY-4.0, attribution "Planetary Council — map.planetarycouncil.org".

## Feature properties

```json
{
  "iso3": "KEN",
  "name": "Kenya",
  "status": "member",        // "member" | "candidate"
  "counted": true,            // counts toward the 51% threshold
  "since": 2024,              // year the revolution took hold (optional)
  "event": "2024 Kenyan protests"   // specific event, when curated (optional)
}
```

`metadata` on the collection carries totals: `members`, `candidates`, `universe` (202 = UN members
+ first-class non-UN polities), `threshold_pct` (51).

Bonus per-country data on the same host, same CORS: official contact channels for **all 202
countries** (email-first; 1,100 verified emails) at
`data/contacts/index.json` → `data/contacts/{ISO3}-{Name}.json`.

## Regenerating

The feed derives from the rosters inline in `index.html` (single source of truth):

```bash
node scripts/build-layer-feed.js
```

---

## Draft proposal: World Monitor community layer

*Draft for a GitHub issue on [koala73/worldmonitor](https://github.com/koala73/worldmonitor) —
not yet submitted.*

> **Proposal: "Peaceful transitions" community layer (CC-BY GeoJSON, CORS-open)**
>
> World Monitor already tracks protests, conflicts, and instability. This proposes the
> complementary signal: where civil-society pressure has **succeeded** — peaceful revolutions
> that took hold, hand-curated with per-country sources, plus developing situations.
>
> We publish it as a static, CORS-open GeoJSON point layer (CC-BY-4.0, ~20 features today,
> curated at map.planetarycouncil.org):
>
> `https://map.planetarycouncil.org/data/layer/planetary-council.geojson`
>
> Properties per point: `iso3`, `name`, `status` (member/candidate), `since`, `event`.
> Happy to adapt the schema to your marker conventions, add `sebuf` typing, or maintain the
> layer as a PR to `src/services/` if you'd take it. We already embed your `/embed` map on our
> site (protests + conflicts), so the integration would be mutual.

