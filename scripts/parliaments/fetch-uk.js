#!/usr/bin/env node
/**
 * UK Parliament — sitting members of both Houses, from the official Members API.
 *   node scripts/parliaments/fetch-uk.js
 *
 * members-api.parliament.uk exposes a per-member /Contact endpoint carrying the
 * parliamentary-office email, phone, website and socials. Two passes: search for
 * the roster, then one contact fetch per member.
 */
const { mapLimit, getJSON, writeChamber } = require("./lib");

const API = "https://members-api.parliament.uk/api";
const HOUSES = [
  { house: 1, iso: "GBR", chamber: "House of Commons", label: "lower" },
  { house: 2, iso: "GBR", chamber: "House of Lords", label: "upper" },
];

async function roster(house) {
  const ids = [];
  for (let skip = 0; ; skip += 20) {
    const page = await getJSON(`${API}/Members/Search?House=${house}&IsCurrentMember=true&skip=${skip}&take=20`);
    const rows = page?.items || [];
    rows.forEach((r) => ids.push(r.value));
    if (rows.length < 20) break;
  }
  return ids;
}

(async () => {
  for (const { house, iso, chamber, label } of HOUSES) {
    console.log(`${chamber} — listing…`);
    const people = await roster(house);
    console.log(`  ${people.length} sitting; fetching contact…`);

    const fetched = await mapLimit(people, Number(process.env.UK_CONC || 4), async (p) => {
      const contact = (await getJSON(`${API}/Members/${p.id}/Contact`))?.value || [];
      const pick = (t) => contact.filter((c) => c.type === t);
      // "Parliamentary office" is the official channel; constituency offices are
      // also public and often the one actually read, so keep both.
      const emails = [...new Set(contact.map((c) => c.email).filter(Boolean))];
      const phones = [...new Set(contact.map((c) => c.phone).filter(Boolean))];
      const site = pick("Website")[0]?.line1 || null;
      // Postal addresses, for the physical-letter channel. Nearly every member
      // shares the chamber address ("House of Commons, London, SW1A 0AA");
      // constituency offices are the only ones that vary.
      const addresses = contact.filter((c) => c.line1 && !c.isWebAddress).map((c) => ({
        type: c.type,
        lines: [c.line1, c.line2, c.line3, c.line4, c.line5].filter(Boolean),
        postcode: c.postcode || null,
        country: "United Kingdom",
      }));
      const x = pick("X (formerly Twitter)")[0]?.line1 || null;

      return {
        id: `UK-${p.id}`,
        sitting: true,
        name: p.nameDisplayAs,
        full_title: p.nameFullTitle || null,
        family_name: (p.nameListAs || "").split(",")[0] || null,
        represents: iso,
        constituency: p.latestHouseMembership?.membershipFrom || null,
        group: p.latestParty?.name || null,
        emails,
        phones,
        addresses,
        website: site,
        socials: x ? [x] : [],
        profile_url: `https://members.parliament.uk/member/${p.id}`,
        source: `${API}/Members/${p.id}/Contact`,
      };
    });

    const failed = people.filter((p, i) => !fetched[i] || fetched[i].__error);
    const members = fetched.filter((m) => m && !m.__error);
    if (failed.length) console.warn(`  !! ${failed.length} unfetchable, recorded as pending`);

    writeChamber({
      iso, country: "United Kingdom", chamber, house: label,
      source_url: "https://members-api.parliament.uk/",
      pending: failed.map((p) => ({ id: `UK-${p.id}`, name: p.nameDisplayAs, reason: "contact endpoint unavailable" })),
      members,
    });
  }
})();
