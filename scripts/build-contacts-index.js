#!/usr/bin/env node
/**
 * Scans data/contacts/*.json and emits data/contacts/index.json — a manifest
 * mapping ISO3 -> { file, country_name, counts }.
 *
 * Why a manifest: filenames are "{ISO3}-{CountryName}.json" for human navigation,
 * but the CountryName written by research agents drifts from the map's display
 * name (e.g. "Democratic Republic of the Congo" vs "DR Congo"). Guessing the
 * filename in the browser 404s. The manifest is the single source of truth.
 *
 * Run after adding/updating any country file:  node scripts/build-contacts-index.js
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "data", "contacts");
const OUT = path.join(DIR, "index.json");

if (!fs.existsSync(DIR)) {
  console.error(`No contacts dir at ${DIR}`);
  process.exit(1);
}

const index = {};
let skipped = 0;

fs.readdirSync(DIR)
  .filter((f) => f.endsWith(".json") && f !== "index.json")
  .sort()
  .forEach((file) => {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
    } catch (e) {
      console.warn(`  skip ${file}: invalid JSON (${e.message})`);
      skipped++;
      return;
    }
    const iso = data.iso || file.split("-")[0];
    if (!iso || !Array.isArray(data.contacts)) {
      console.warn(`  skip ${file}: missing iso or contacts[]`);
      skipped++;
      return;
    }
    // Count only entries the app actually shows. verify-contacts.js marks
    // `unresolved` (domain gone) and `personal` (an individual's address);
    // both are hidden, so counting them would overstate coverage.
    const usable = data.contacts.filter((c) => !c.unresolved && !c.personal);
    const byType = {};
    usable.forEach((c) => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });
    index[iso] = {
      file,
      country_name: data.country_name || iso,
      total: usable.length,
      types: byType,
      ...(usable.length !== data.contacts.length && { unresolved: data.contacts.length - usable.length }),
    };
  });

fs.writeFileSync(OUT, JSON.stringify(index, null, 2));

const isos = Object.keys(index);
const withEmail = isos.filter((i) => index[i].types.email).length;
console.log(`index.json written: ${isos.length} countries (${withEmail} with email)${skipped ? `, ${skipped} skipped` : ""}`);
