#!/usr/bin/env node
/**
 * Fetch one House of Commons division (a recorded vote) from the official
 * Commons Votes API and store who voted which way.
 *
 *   node scripts/record/fetch-division.js 2078
 *
 * Output: data/record/divisions/{id}.json
 *
 * Vote lists are pulled, never typed by hand: a hand-copied list of 400 names
 * is where a wrong name ends up next to a vote they never cast.
 */
const fs = require("fs");
const path = require("path");

const id = Number(process.argv[2]);
if (!id) { console.error("usage: fetch-division.js <divisionId>"); process.exit(1); }

const OUT = path.join(__dirname, "..", "..", "data", "record", "divisions");

(async () => {
  const url = `https://commonsvotes-api.parliament.uk/data/division/${id}.json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  const d = await r.json();

  const who = (list) => (list || [])
    .map((m) => ({ id: m.MemberId, name: m.Name, party: m.Party, constituency: m.MemberFrom }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const out = {
    house: "Commons",
    division_id: d.DivisionId,
    number: d.Number,
    date: d.Date.slice(0, 10),
    title: d.Title,
    aye_count: d.AyeCount,
    no_count: d.NoCount,
    source_url: `https://votes.parliament.uk/votes/commons/division/${d.DivisionId}`,
    api_url: url,
    retrieved: new Date().toISOString().slice(0, 10),
    ayes: who(d.Ayes),
    noes: who(d.Noes),
    // Tellers count the vote and are not listed among those voting.
    aye_tellers: who(d.AyeTellers),
    no_tellers: who(d.NoTellers),
  };

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${id}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  console.log(`${out.date}  ${out.title}`);
  console.log(`  ayes ${out.ayes.length}/${out.aye_count}  noes ${out.noes.length}/${out.no_count}  -> ${path.relative(process.cwd(), file)}`);
  // The published name lists do not always add up to the official count. Say so
  // rather than pad: the count is Parliament's, the names are what it published.
  if (out.ayes.length !== out.aye_count || out.noes.length !== out.no_count)
    console.log("  note: published name lists differ from the official counts; both stored as given");
})();
