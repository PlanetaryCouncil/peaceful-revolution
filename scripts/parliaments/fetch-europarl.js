#!/usr/bin/env node
/**
 * European Parliament — current MEPs, from the official open-data API.
 *   node scripts/parliaments/fetch-europarl.js
 *
 * data.europarl.europa.eu publishes MEPs as JSON-LD, email included
 * (`hasEmail: "mailto:..."`). No scraping.
 *
 * Two passes: the list endpoint gives ids only, so each MEP needs a detail
 * fetch for email/country/group. Political groups are org refs resolved once
 * and cached — a few hundred MEPs share ~8 EU groups and ~200 national parties.
 */
const { mapLimit, getJSON, writeChamber } = require("./lib");

const API = "https://data.europarl.europa.eu/api/v2";
const LD = "format=application%2Fld%2Bjson";
const TERM = process.env.EP_TERM || "10";          // 10 = 2024-2029

const orgCache = new Map();
async function orgLabel(ref) {                     // "org/7038" -> "S&D"
  const id = String(ref).replace(/^org\//, "");
  if (!/^\d+$/.test(id)) return null;              // "ep-10" etc: the institution itself
  if (!orgCache.has(id)) {
    orgCache.set(id, getJSON(`${API}/corporate-bodies/${id}?${LD}`)
      .then((r) => r?.data?.[0]?.label || null).catch(() => null));
  }
  return orgCache.get(id);
}

const COUNTRY = (uri) => (uri || "").split("/").pop();   // .../country/DEU -> DEU

(async () => {
  console.log(`European Parliament, term ${TERM} — listing MEPs…`);
  const ids = [];
  for (let offset = 0; ; offset += 500) {
    const page = await getJSON(`${API}/meps?parliamentary-term=${TERM}&${LD}&offset=${offset}&limit=500`);
    const rows = page?.data || [];
    rows.forEach((p) => ids.push(p.identifier));
    if (rows.length < 500) break;
  }
  console.log(`  ${ids.length} MEPs; fetching detail…`);

  const fetched = await mapLimit(ids, Number(process.env.EP_CONC || 2), async (id) => {
    const p = (await getJSON(`${API}/meps/${id}?${LD}`))?.data?.[0];
    if (!p) return null;

    // Only memberships still open today describe the sitting MEP.
    const current = (p.hasMembership || []).filter((m) => !m.memberDuring?.endDate);
    const seat = current.find((m) => m.role === "def/ep-roles/MEMBER_PARLIAMENT");
    const euGroup = current.find((m) => m.membershipClassification === "def/ep-entities/EU_POLITICAL_GROUP");
    const natParty = current.find((m) => m.membershipClassification === "def/ep-entities/NATIONAL_POLITICAL_GROUP");

    const email = (p.hasEmail || "").replace(/^mailto:/, "") || null;
    const phones = (seat?.contactPoint || [])
      .map((c) => c.hasTelephone?.hasValue?.replace(/^tel:/, ""))
      .filter(Boolean);

    // The term-10 list includes everyone who served during the term, including
    // members who have since left (resigned, took a Commission post). They have
    // no open seat membership. Keep them, but marked — a departed MEP's address
    // is not a live channel to that country's delegation.
    return {
      id: `EP-${id}`,
      sitting: Boolean(seat),
      name: p.label,
      given_name: p.givenName || null,
      family_name: p.familyName || null,
      represents: COUNTRY(seat?.represents?.[0]) || null,
      group: await orgLabel(euGroup?.organization),
      national_party: await orgLabel(natParty?.organization),
      emails: email ? [email] : [],
      phones: [...new Set(phones)],
      profile_url: `https://www.europarl.europa.eu/meps/en/${id}`,
      source: `${API}/meps/${id}`,
    };
  });

  const failed = ids.filter((id, i) => !fetched[i] || fetched[i].__error);
  const members = fetched.filter((m) => m && !m.__error);
  const sitting = members.filter((m) => m.sitting).length;
  console.log(`  ${members.length} fetched (${sitting} sitting, ${members.length - sitting} departed)`);
  // A handful of ids return 429 indefinitely while their public profile page
  // serves fine — the API uses 429 as a generic "cannot serve this record".
  // Record them in the file instead of dropping them, so the gap is visible
  // and a later pass (or a contributor) can fill it in.
  if (failed.length) console.warn(`  !! ${failed.length} unfetchable, recorded as pending: ${failed.join(", ")}`);

  writeChamber({
    pending: failed.map((id) => ({ id: `EP-${id}`, profile_url: `https://www.europarl.europa.eu/meps/en/${id}`, reason: "API returns 429 for this record" })),
    iso: "EUR",
    country: "European Union",
    chamber: "European Parliament",
    house: "supranational",
    source_url: "https://data.europarl.europa.eu/",
    members,
  });
})();
