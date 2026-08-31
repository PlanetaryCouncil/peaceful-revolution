#!/usr/bin/env node
/**
 * Parse UK Sanctions List CSV → JSON
 *
 * Input: https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv
 * Output: data/sanctions/UK.json
 */
const fs = require("fs");
const path = require("path");
const { createReadStream } = require("fs");
const { createInterface } = require("readline");

const CSV_URL = "https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv";
const OUT_DIR = path.join(__dirname, "..", "data", "sanctions");
const OUT_FILE = path.join(OUT_DIR, "UK.json");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/**
 * Simple CSV parser that handles quoted fields properly
 */
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  fields.push(current.trim());
  return fields;
}

(async () => {
  console.log("Downloading UK Sanctions List...");
  const response = await fetch(CSV_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const text = await response.text();
  const lines = text.split("\n");

  // Skip report date line
  const headerLine = lines.find(l => l.startsWith("Last Updated"));
  if (!headerLine) throw new Error("No header found");

  const headers = parseCSVLine(headerLine);
  console.log(`Headers: ${headers.length} columns`);

  const entries = [];
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip meta lines
    if (!line || line.startsWith("Report Date") || line.startsWith("Last Updated")) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 10 || !fields[1]) { // need Unique ID at minimum
      skipped++;
      continue;
    }

    // Map fields by header
    const entry = {};
    headers.forEach((h, i) => {
      const val = fields[i];
      if (val) entry[h] = val;
    });

    // Clean up the entry for our schema
    const clean = {
      id: entry["Unique ID"],
      name: entry["Name 1"] || entry["Name 6"] || "Unknown",
      type: entry["Type of entity"] || "unknown",
      regime: entry["Regime Name"],
      designation_type: entry["Designation Type"],
      designation_source: entry["Designation source"],
      sanctions_imposed: entry["Sanctions Imposed"],
      date_designated: entry["Date Designated"],
      reason: entry["Other Information"],
      country: entry["Address Country"],
      nationality: entry["Nationality(/ies)"],
      dob: entry["D.O.B"],
    };

    // Only include non-empty fields
    Object.keys(clean).forEach(k => clean[k] || delete clean[k]);

    entries.push(clean);
  }

  const metadata = {
    jurisdiction: "UK",
    source_url: CSV_URL,
    last_updated: new Date().toISOString().slice(0, 10),
    total_entries: entries.length,
    skipped,
  };

  const output = { entries, metadata };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`✓ Written: ${OUT_FILE}`);
  console.log(`  ${entries.length} entries, ${skipped} skipped`);
  console.log(`  File size: ${(fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
})();
