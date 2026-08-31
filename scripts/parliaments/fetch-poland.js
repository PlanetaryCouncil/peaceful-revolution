#!/usr/bin/env node
/**
 * Poland — Sejm (lower house), from the official API.
 *   node scripts/parliaments/fetch-poland.js
 *
 * api.sejm.gov.pl serves the whole roster including email in a single call,
 * and marks departed members with active:false. The Senat has no equivalent
 * open API and is left to a later pass (see data/parliaments/README.md).
 */
const { getJSON, writeChamber } = require("./lib");

const TERM = process.env.PL_TERM || "10";

(async () => {
  console.log(`Sejm, term ${TERM} — fetching…`);
  const rows = await getJSON(`https://api.sejm.gov.pl/sejm/term${TERM}/MP`);

  const members = rows.map((m) => ({
    id: `PL-${m.id}`,
    sitting: m.active !== false,
    name: m.firstLastName,
    given_name: m.firstName || null,
    family_name: m.lastName || null,
    represents: "POL",
    constituency: m.districtName || null,
    group: m.club || null,
    emails: m.email ? [m.email] : [],
    phones: [],
    profile_url: `https://www.sejm.gov.pl/sejm${TERM}.nsf/posel.xsp?id=${String(m.id).padStart(3, "0")}`,
    source: `https://api.sejm.gov.pl/sejm/term${TERM}/MP`,
  }));

  const sitting = members.filter((m) => m.sitting).length;
  console.log(`  ${members.length} in term (${sitting} sitting)`);
  writeChamber({
    iso: "POL", country: "Poland", chamber: "Sejm", house: "lower",
    source_url: "https://api.sejm.gov.pl/",
    members,
  });
})();
