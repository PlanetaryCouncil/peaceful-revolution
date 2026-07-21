#!/usr/bin/env node
/**
 * Ingests country-contact research results from a workflow journal into
 * data/contacts/{ISO3}-{CountryName}.json (one file per country).
 *
 * Usage:  node scripts/ingest-workflow-results.js <path-to-journal.jsonl> [...more]
 *
 * Idempotent: re-running overwrites a country only if the new record has at
 * least as many contacts, so a partial re-run never degrades existing data.
 * Run scripts/build-contacts-index.js afterwards to refresh the manifest.
 */
const fs = require("fs");
const path = require("path");

const journals = process.argv.slice(2);
if (!journals.length) {
  console.error("usage: node scripts/ingest-workflow-results.js <journal.jsonl> [...]");
  process.exit(1);
}

const DIR = path.join(__dirname, "..", "data", "contacts");
fs.mkdirSync(DIR, { recursive: true });

// Filenames must stay stable and filesystem-safe while remaining human-scannable.
const slug = (name) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // strip accents rather than delete the letter
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

let written = 0, skipped = 0, malformed = 0;

for (const journal of journals) {
  if (!fs.existsSync(journal)) {
    console.warn(`missing journal: ${journal}`);
    continue;
  }
  for (const line of fs.readFileSync(journal, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type !== "result" || !entry.result) continue;

    const r = entry.result;
    if (!r.iso || !r.country_name || !Array.isArray(r.contacts)) { malformed++; continue; }

    const basename = `${r.iso}-${slug(r.country_name)}.json`;
    const file = path.join(DIR, basename);

    // Exactly one file per ISO. An earlier pass may have used a different
    // country_name (or an older slug rule), leaving a stale sibling that would
    // register the same ISO twice in the manifest.
    const stale = fs
      .readdirSync(DIR)
      .filter((f) => f.startsWith(`${r.iso}-`) && f.endsWith(".json") && f !== basename);

    // Union rather than pick-a-winner. Passes find different things — an early
    // pass may have websites and socials while a later email-focused pass finds
    // the addresses that actually matter. Choosing by contact count discards
    // real data (it once kept a 14-entry US record with no email over a
    // 13-entry one with three).
    const merged = [];
    const seen = new Set();
    // Agents that exhaust their search budget report it as a pseudo-contact
    // rather than fabricating (good), but it is not a contact and would render
    // as a bogus "error" section in the panel.
    const NON_CONTACT = new Set(["error", "status", "research_status"]);

    const add = (c) => {
      if (!c || !c.type) return;
      if (NON_CONTACT.has(String(c.type).toLowerCase())) return;
      const val = (c.value || c.url || "").trim();
      if (!val) return;
      const key = `${c.type}|${val.toLowerCase().replace(/\/+$/, "")}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(c);
    };

    for (const f of [basename, ...stale]) {
      const p = path.join(DIR, f);
      if (!fs.existsSync(p)) continue;
      try {
        const prev = JSON.parse(fs.readFileSync(p, "utf8"));
        if (Array.isArray(prev.contacts)) prev.contacts.forEach(add);
      } catch { /* unreadable — ignore, the new record still lands */ }
    }
    const before = merged.length;
    r.contacts.forEach(add);
    if (before && merged.length === before) skipped++;

    stale.forEach((f) => fs.unlinkSync(path.join(DIR, f)));
    fs.writeFileSync(file, JSON.stringify({ ...r, contacts: merged }, null, 2));
    written++;
  }
}

console.log(`ingested: ${written} written, ${skipped} added nothing new, ${malformed} malformed`);
console.log(`next: node scripts/build-contacts-index.js`);
