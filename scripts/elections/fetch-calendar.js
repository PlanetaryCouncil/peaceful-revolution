#!/usr/bin/env node
/**
 * National elections worldwide, from Wikipedia's national electoral calendars.
 *   node scripts/elections/fetch-calendar.js [startYear] [endYear]
 *
 * Why this source: Wikipedia maintains one "<year> national electoral calendar"
 * page per year, each a dated list of every national election and referendum on
 * earth. It is the only comprehensive, free, machine-readable calendar I found.
 *
 * Rejected alternatives, recorded so nobody re-walks them:
 *  - Wikidata SPARQL: right shape, but the public endpoint 502s on any query
 *    broad enough to be useful (the election subclass tree is 2,421 deep, and
 *    a VALUES list that large exceeds GET limits while POST still times out).
 *  - IFES ElectionGuide: authoritative and well structured, but its API is
 *    401-gated and the public page lists only ~36 upcoming elections.
 *
 * Wikipedia is crowd-maintained, so every entry keeps its source URL and the
 * data is treated as a starting point for verification, not as settled fact.
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "..", "data", "elections");
const MONTHS = ["January","February","March","April","May","June","July","August",
                "September","October","November","December"];

// ISO3 lookup, built from the contacts dataset (202 countries, already curated)
// plus the aliases Wikipedia actually uses for the same places.
function buildIsoMap() {
  const map = new Map();
  const norm = (s) => s.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
  try {
    const idx = require(path.join(OUT, "..", "contacts", "index.json"));
    for (const [iso, meta] of Object.entries(idx)) map.set(norm(meta.country_name), iso);
  } catch { /* contacts not built; aliases below still cover the common cases */ }
  const alias = {
    "united states":"USA","united states of america":"USA","us":"USA",
    "united kingdom":"GBR","uk":"GBR","great britain":"GBR",
    "south korea":"KOR","north korea":"PRK","russia":"RUS","ivory coast":"CIV",
    "cote divoire":"CIV","cape verde":"CPV","cabo verde":"CPV","east timor":"TLS",
    "timorleste":"TLS","democratic republic of the congo":"COD","dr congo":"COD",
    "republic of the congo":"COG","congo":"COG","czech republic":"CZE","czechia":"CZE",
    "myanmar":"MMR","burma":"MMR","eswatini":"SWZ","swaziland":"SWZ",
    "vatican city":"VAT","holy see":"VAT","the gambia":"GMB","gambia":"GMB",
    "bosnia and herzegovina":"BIH","north macedonia":"MKD","macedonia":"MKD",
    "sao tome and principe":"STP","saint kitts and nevis":"KNA",
    "saint vincent and the grenadines":"VCT","saint lucia":"LCA",
    "trinidad and tobago":"TTO","antigua and barbuda":"ATG",
    "papua new guinea":"PNG","solomon islands":"SLB","marshall islands":"MHL",
    "federated states of micronesia":"FSM","micronesia":"FSM",
    "netherlands":"NLD","the netherlands":"NLD","turkey":"TUR","turkiye":"TUR",
    "laos":"LAO","syria":"SYR","iran":"IRN","venezuela":"VEN","bolivia":"BOL",
    "tanzania":"TZA","moldova":"MDA","brunei":"BRN","palestine":"PSE",
    "taiwan":"TWN","hong kong":"HKG","kosovo":"XKX","western sahara":"ESH",
    "somaliland":"SOL","abkhazia":"ABK","transnistria":"PMR","northern cyprus":"CYN",
  };
  for (const [k, v] of Object.entries(alias)) map.set(k, v);
  return { map, norm };
}

const { map: ISO, norm } = buildIsoMap();

/** "22–23 March" -> the first date; ranges keep both ends. */
function parseDates(dayPart, month, year) {
  const mi = MONTHS.indexOf(month);
  if (mi < 0) return null;
  const days = [...dayPart.matchAll(/\d{1,2}/g)].map((m) => Number(m[0]));
  if (!days.length) return null;
  const iso = (d) => `${year}-${String(mi + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { date: iso(days[0]), ...(days.length > 1 && { date_end: iso(days[days.length - 1]) }) };
}

async function fetchYear(year) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${year}_national_electoral_calendar`;
  const r = await fetch(url, { headers: { "User-Agent": "PlanetaryCouncilMap/1.0 (map.planetarycouncil.org)" } });
  if (!r.ok) { console.warn(`  ${year}: HTTP ${r.status} — skipped`); return []; }
  const html = await r.text();

  const out = [];
  const unmatched = new Set();

  // Wikipedia writes the date once per polling day, then lists further countries
  // voting that day as plain siblings with no date of their own:
  //
  //   <li>4 October: Bosnia and Herzegovina, Presidency ...</li>
  //   <li>Brazil, President, Chamber of Deputies and Senate</li>   <-- same day
  //
  // So the date has to carry forward. Requiring it on every line silently drops
  // every country that shares a polling day with another - which is how Brazil's
  // general election went missing on the first pass.
  //
  // Two guards keep the carry-forward from swallowing unrelated list items
  // (navboxes, footnotes): a heading resets the date, and the country must
  // resolve to a real ISO code.
  const headings = [...html.matchAll(/<h[1-4][^>]*>/g)].map((m) => m.index);
  let carried = null, carriedAt = -1;

  for (const m of html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
    const at = m.index;
    if (headings.some((h) => h > carriedAt && h < at)) carried = null;   // new section

    const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const dated = text.match(/^([\d\u2013\u2014\-\s]+)\s(January|February|March|April|May|June|July|August|September|October|November|December):\s*(.+)$/);

    let when, body;
    if (dated) {
      when = parseDates(dated[1], dated[2], year);
      if (!when) continue;
      body = dated[3];
      carried = when; carriedAt = at;
    } else if (carried && text.includes(",") && text.length < 200) {
      when = carried; body = text;                    // same polling day as above
    } else continue;

    body = body.replace(/\[\s*\d+\s*\]/g, "").trim();     // drop footnote markers
    const comma = body.indexOf(",");
    const country = (comma > 0 ? body.slice(0, comma) : body).trim();
    const type = comma > 0 ? body.slice(comma + 1).trim() : null;

    const iso = ISO.get(norm(country));
    if (!iso) { if (dated) unmatched.add(country); continue; }

    out.push({
      ...when, iso, country, type, year,
      source: `https://en.wikipedia.org/wiki/${year}_national_electoral_calendar`,
    });
  }
  console.log(`  ${year}: ${out.length} elections` + (unmatched.size ? `, ${unmatched.size} unmapped (${[...unmatched].slice(0,4).join(", ")}${unmatched.size>4?"…":""})` : ""));
  return out;
}

(async () => {
  const start = Number(process.argv[2]) || 2025;
  const end = Number(process.argv[3]) || 2028;
  console.log(`National electoral calendars ${start}-${end}…`);

  let all = [];
  for (let y = start; y <= end; y++) all = all.concat(await fetchYear(y));

  fs.mkdirSync(OUT, { recursive: true });
  const byIso = {};
  all.forEach((e) => (byIso[e.iso] ||= []).push(e));

  const today = new Date().toISOString().slice(0, 10);
  const index = { generated: today, years: [start, end], totals: {}, countries: {} };

  for (const [iso, list] of Object.entries(byIso)) {
    list.sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = list.filter((e) => e.date >= today);
    // The most recent completed election matters as much as the next one: it is
    // who currently holds power. A country with nothing scheduled is not a
    // country with nothing to know.
    const past = list.filter((e) => e.date < today);
    const last = past[past.length - 1] || null;
    fs.writeFileSync(path.join(OUT, `${iso}.json`), JSON.stringify({
      iso, country: list[0].country, retrieved: today,
      total: list.length, upcoming: upcoming.length,
      next: upcoming[0] || null,
      last,
      elections: list,
    }, null, 2));
    index.countries[iso] = {
      country: list[0].country, total: list.length, upcoming: upcoming.length,
      next: upcoming[0] ? { date: upcoming[0].date, type: upcoming[0].type } : null,
      last: last ? { date: last.date, type: last.type } : null,
    };
  }
  index.totals = {
    countries: Object.keys(byIso).length,
    elections: all.length,
    upcoming: all.filter((e) => e.date >= today).length,
  };
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 2));
  console.log(`\nindex.json: ${index.totals.countries} countries, ${index.totals.elections} elections, ${index.totals.upcoming} upcoming`);
})();
