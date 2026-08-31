#!/usr/bin/env node
/**
 * What would it cost to reach every parliamentarian in Europe — by post, by email?
 *   node scripts/parliaments/cost-model.js
 *
 * Uses the real roster where we have it (data/parliaments/index.json) and
 * documented chamber sizes for the rest. Chamber sizes are public constants
 * (a Bundestag has 630 seats whether or not we have fetched it), so the
 * headcount is solid even where the contact data is not yet collected.
 *
 * Postage is the honest part: quoted rates where a provider publishes them,
 * a zone estimate where they do not. Estimated rows are marked.
 */

// Seats per chamber. Council of Europe states + the European Parliament.
// `have` is filled from index.json at runtime.
const CHAMBERS = [
  ["EUR", "European Parliament", 720], ["DEU", "Bundestag", 630], ["DEU", "Bundesrat", 69],
  ["FRA", "Assemblee nationale", 577], ["FRA", "Senat", 348],
  ["GBR", "House of Commons", 650], ["GBR", "House of Lords", 809],
  ["ITA", "Camera dei Deputati", 400], ["ITA", "Senato", 200],
  ["ESP", "Congreso", 350], ["ESP", "Senado", 265],
  ["POL", "Sejm", 460], ["POL", "Senat", 100],
  ["ROU", "Camera Deputatilor", 330], ["ROU", "Senat", 136],
  ["NLD", "Tweede Kamer", 150], ["NLD", "Eerste Kamer", 75],
  ["BEL", "Chambre", 150], ["BEL", "Senat", 60],
  ["GRC", "Hellenic Parliament", 300], ["PRT", "Assembleia da Republica", 230],
  ["CZE", "Poslanecka snemovna", 200], ["CZE", "Senat", 81],
  ["HUN", "Orszaggyules", 199], ["SWE", "Riksdag", 349],
  ["AUT", "Nationalrat", 183], ["AUT", "Bundesrat", 61],
  ["BGR", "National Assembly", 240], ["DNK", "Folketing", 179],
  ["FIN", "Eduskunta", 200], ["SVK", "National Council", 150],
  ["IRL", "Dail Eireann", 174], ["IRL", "Seanad Eireann", 60],
  ["HRV", "Sabor", 151], ["LTU", "Seimas", 141],
  ["SVN", "National Assembly", 90], ["SVN", "National Council", 40],
  ["LVA", "Saeima", 100], ["EST", "Riigikogu", 101],
  ["CYP", "House of Representatives", 56], ["LUX", "Chambre des Deputes", 60],
  ["MLT", "House of Representatives", 79],
  ["CHE", "Nationalrat", 200], ["CHE", "Standerat", 46],
  ["NOR", "Storting", 169], ["ISL", "Althingi", 63],
  ["UKR", "Verkhovna Rada", 450], ["TUR", "Grand National Assembly", 600],
  ["SRB", "National Assembly", 250], ["GEO", "Parliament", 150],
  ["ARM", "National Assembly", 107], ["AZE", "National Assembly", 125],
  ["ALB", "Kuvendi", 140], ["BIH", "House of Representatives", 42],
  ["BIH", "House of Peoples", 15], ["MKD", "Sobranie", 120],
  ["MNE", "Skupstina", 81], ["MDA", "Parliament", 101],
  ["AND", "General Council", 28], ["MCO", "National Council", 24],
  ["SMR", "Grand and General Council", 60], ["LIE", "Landtag", 25],
];

// Pingen published delivery cost per letter, USD (quoted 2026). Print is extra.
const QUOTED_USD = {
  DEU: 0.73, ESP: 0.81, CHE: 0.97, FRA: 1.10, GBR: 1.18,
  NLD: 1.20, AUT: 1.26, BEL: 1.27, LUX: 1.44,
};
const EST_USD = 1.30;              // unquoted European destination, conservative
const USD_EUR = 0.92;

// Print side, per letter, at volume: processing+envelope 0.22, paper 0.06, greyscale print 0.11
const PRINT_USD = 0.22 + 0.06 + 0.11;

// A bulk mail house injecting at domestic business rates, rather than a retail
// letter API. Stannp quotes GBP 0.48 all-in (print+postage) at 4,000+ UK items.
const BULK_EUR = 0.48 / 0.85;      // GBP->EUR approx

const have = {};
try {
  require("../../data/parliaments/index.json").chambers
    .forEach((c) => { have[`${c.iso}|${c.chamber}`] = c.sitting; });
} catch { /* index not built yet */ }

let seats = 0, collected = 0, apiEur = 0, estimatedSeats = 0;
const byCountry = {};

for (const [iso, chamber, size] of CHAMBERS) {
  seats += size;
  collected += have[`${iso}|${chamber}`] || 0;
  const quoted = QUOTED_USD[iso];
  if (!quoted) estimatedSeats += size;
  const perLetter = ((quoted || EST_USD) + PRINT_USD) * USD_EUR;
  apiEur += perLetter * size;
  byCountry[iso] = (byCountry[iso] || 0) + size;
}

const pct = (n, d) => ((100 * n) / d).toFixed(1) + "%";
console.log(`\nEuropean parliamentarians — Council of Europe states + European Parliament\n`);
console.log(`  chambers                ${CHAMBERS.length}`);
console.log(`  countries               ${Object.keys(byCountry).length}`);
console.log(`  seats                   ${seats.toLocaleString()}`);
console.log(`  contact data collected  ${collected.toLocaleString()}  (${pct(collected, seats)})`);

console.log(`\nPOST — retail letter API (Pingen-style, 1 page greyscale, per-country injection)`);
console.log(`  per letter              EUR ${((QUOTED_USD.DEU + PRINT_USD) * USD_EUR).toFixed(2)} (Germany, cheapest quoted)`);
console.log(`                          EUR ${((QUOTED_USD.GBR + PRINT_USD) * USD_EUR).toFixed(2)} (UK)`);
console.log(`  blended per letter      EUR ${(apiEur / seats).toFixed(2)}`);
console.log(`  TOTAL                   EUR ${Math.round(apiEur).toLocaleString()}`);
console.log(`  (postage estimated for ${pct(estimatedSeats, seats)} of seats — only 9 countries publish rates)`);

const bulkTotal = BULK_EUR * seats;
console.log(`\nPOST — bulk mail house at domestic business rates`);
console.log(`  per letter              EUR ${BULK_EUR.toFixed(2)}  (Stannp GBP 0.48 all-in at 4,000+)`);
console.log(`  TOTAL                   EUR ${Math.round(bulkTotal).toLocaleString()}`);
console.log(`  saving vs retail API    EUR ${Math.round(apiEur - bulkTotal).toLocaleString()}`);

console.log(`\nEMAIL — transactional provider at ~EUR 0.0004/send`);
console.log(`  TOTAL                   EUR ${(seats * 0.0004).toFixed(2)}   (rounding error; the cost is deliverability, not money)`);

// The number that actually shapes the postal problem.
console.log(`\nAddresses needed: ~${CHAMBERS.length} buildings, not ${seats.toLocaleString()} addresses.`);
console.log(`  39 of 40 sampled UK MPs share "House of Commons, London, SW1A 0AA".`);
console.log(`  Name + chamber is a deliverable address; per-member address lookup is not needed.\n`);
