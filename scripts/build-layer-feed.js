#!/usr/bin/env node
/**
 * Emits the Planetary Council membership layer feed from the map's own
 * curated rosters (inline in index.html — single source of truth):
 *
 *   data/layer/planetary-council.geojson  — Point features, [lon,lat],
 *     one per member (peaceful revolution, counted) or candidate (developing)
 *   data/layer/planetary-council.json     — summary + flat country list
 *
 * Built for third-party map engines (e.g. a WorldMonitor community layer):
 * GitHub Pages serves both with Access-Control-Allow-Origin: * so any
 * origin can fetch them client-side.
 *
 * Run after editing the rosters in index.html:
 *   node scripts/build-layer-feed.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// Pull the roster/centroid const blocks out of the inline script and evaluate
// them in an empty sandbox. They are plain object literals by convention.
const BLOCKS = ["SEEDED", "DEVELOPING", "NON_UN", "UN_MEMBERS", "REV_EVENT", "CENTROIDS"];
const sandbox = {};
for (const name of BLOCKS) {
  const m = html.match(new RegExp(`const ${name} = \\{[\\s\\S]*?\\n\\};`));
  if (!m) { console.error(`could not find const ${name} in index.html`); process.exit(1); }
  vm.runInNewContext(m[0].replace("const ", "this."), sandbox);
}
const { SEEDED, DEVELOPING, NON_UN, UN_MEMBERS, REV_EVENT, CENTROIDS } = sandbox;

const features = [];
const list = [];

function add(iso, name, status, { year, event, note, lat, lon } = {}) {
  const c = lat != null ? [lat, lon] : CENTROIDS[iso];
  if (!c) { console.warn(`no coordinates for ${iso} — skipped`); return; }
  const counted = status === "member";
  features.push({
    type: "Feature",
    geometry: { type: "Point", coordinates: [c[1], c[0]] },   // GeoJSON is [lon, lat]
    properties: { iso3: iso, name, status, counted, ...(year && { since: year }), ...(event && { event }), ...(note && { note }) },
  });
  list.push({ iso3: iso, name, status, counted, ...(year && { since: year }) });
}

// Members: a peaceful revolution has taken hold — counted toward the 51%.
for (const [iso, year] of Object.entries(SEEDED))
  add(iso, UN_MEMBERS[iso], "member", { year, event: REV_EVENT[iso] });

// Non-UN polities marked online are first-class members too.
for (const [iso, d] of Object.entries(NON_UN))
  if (d.online || d.status === "online")
    add(iso, d.name, "member", { lat: d.lat, lon: d.lon, note: d.note });

// Candidates: developing now, not yet counted.
for (const [iso, d] of Object.entries(DEVELOPING))
  add(iso, UN_MEMBERS[iso], "candidate", { year: d.year, event: d.note, lat: d.lat, lon: d.lon });

list.sort((a, b) => a.iso3.localeCompare(b.iso3));
const members = list.filter(x => x.status === "member").length;
const total = Object.keys(UN_MEMBERS).length + Object.keys(NON_UN).length;

const meta = {
  layer: "planetary-council",
  title: "Planetary Council — members & candidates",
  description: "Countries and peoples where a peaceful revolution has taken hold (members, counted toward the 51% activation threshold) or is developing now (candidates). Hand-curated, sourced, and challengeable.",
  source: "https://map.planetarycouncil.org/",
  data_license: "CC-BY-4.0",
  attribution: "Planetary Council — map.planetarycouncil.org",
  members, candidates: list.length - members, universe: total,
  threshold_pct: 51,
};

const outDir = path.join(ROOT, "data", "layer");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "planetary-council.geojson"),
  JSON.stringify({ type: "FeatureCollection", metadata: meta, features }, null, 2));
fs.writeFileSync(path.join(outDir, "planetary-council.json"),
  JSON.stringify({ ...meta, countries: list }, null, 2));

console.log(`layer feed: ${members} members, ${list.length - members} candidates → data/layer/`);
