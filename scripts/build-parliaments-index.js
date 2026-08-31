#!/usr/bin/env node
/**
 * Scans data/parliaments/*.json -> index.json (ISO3+chamber -> file, counts).
 *
 * Same reasoning as the contacts manifest: the app must never guess a filename.
 * Run after adding or refreshing any chamber.
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "data", "parliaments");
const OUT = path.join(DIR, "index.json");

const chambers = [];
let members = 0, emails = 0, pending = 0;

fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== "index.json").sort()
  .forEach((file) => {
    const d = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
    const sitting = d.members.filter((m) => m.sitting !== false);
    const withMail = sitting.filter((m) => m.emails && m.emails.length).length;
    chambers.push({
      file, iso: d.iso, country: d.country, chamber: d.chamber, house: d.house,
      sitting: sitting.length, with_email: withMail,
      ...(d.pending?.length && { pending: d.pending.length }),
      retrieved: d.retrieved, source_url: d.source_url,
    });
    members += sitting.length; emails += withMail; pending += d.pending?.length || 0;
  });

const index = {
  generated: new Date().toISOString().slice(0, 10),
  totals: { chambers: chambers.length, countries: new Set(chambers.map((c) => c.iso)).size,
            sitting_members: members, with_email: emails, pending },
  chambers,
};
fs.writeFileSync(OUT, JSON.stringify(index, null, 2));
console.log(`index.json: ${chambers.length} chambers, ${members} sitting members, ${emails} with email` +
  (pending ? `, ${pending} pending` : ""));
