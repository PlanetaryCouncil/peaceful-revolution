/**
 * Shared helpers for parliament fetchers.
 *
 * One file per chamber: data/parliaments/{ISO3}-{Chamber-Slug}.json
 * Bicameral countries get two files (GBR-House-of-Commons, GBR-House-of-Lords)
 * so a contributor can repair one chamber without touching the other — same
 * reasoning as the per-country contacts files.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DIR = path.join(__dirname, "..", "..", "data", "parliaments");
const CACHE = path.join(__dirname, "..", "..", ".cache", "parliaments");

/**
 * On-disk response cache, keyed by URL.
 *
 * Parliament APIs are public infrastructure with real rate limits — the EP
 * throttles hard enough that a single bulk pass exhausts the window and the
 * tail of the roster fails. Caching makes a re-run fetch only what is still
 * missing, so recovering from a throttle costs 11 requests instead of 743.
 * Delete .cache/parliaments to force a full refresh.
 */
function cachePath(url) {
  const key = crypto.createHash("sha1").update(url).digest("hex");
  return path.join(CACHE, key.slice(0, 2), key + ".json");
}

/** Bounded concurrency. Parliament APIs are public and unfunded — do not hammer them. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const n = i++;
        try { out[n] = await fn(items[n], n); }
        catch (e) { out[n] = { __error: e.message }; }
      }
    })
  );
  return out;
}

async function getJSON(url, headers = {}, tries = 6) {
  const cf = cachePath(url);
  if (fs.existsSync(cf)) {
    try { return JSON.parse(fs.readFileSync(cf, "utf8")); } catch { /* refetch */ }
  }
  for (let a = 0; a < tries; a++) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json", ...headers } });
      // 429 is the common failure on these APIs and it is *transient* — retry it
      // hard. Treating a throttled request as "no data" silently drops real
      // people from the roster, which is the worst possible failure here.
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      if (!r.ok) return null;                       // 404 = genuinely absent, not a retry
      const json = await r.json();
      fs.mkdirSync(path.dirname(cf), { recursive: true });
      fs.writeFileSync(cf, JSON.stringify(json));
      return json;
    } catch (e) {
      if (a === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** a));   // 1s,2s,4s,8s,16s
    }
  }
}

const slug = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "")
   .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Writes one chamber file. `members` are already normalised to the schema in
 * data/parliaments/README.md. Sorted by family name so diffs stay readable
 * when a chamber is re-fetched.
 */
function writeChamber({ iso, country, chamber, house, source_url, members, pending = [] }) {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  const file = `${iso}-${slug(chamber)}.json`;
  const sorted = [...members].sort((a, b) =>
    (a.family_name || a.name || "").localeCompare(b.family_name || b.name || ""));
  const withEmail = sorted.filter((m) => m.emails && m.emails.length).length;
  const doc = {
    iso, country, chamber, house,
    source_url,
    retrieved: new Date().toISOString().slice(0, 10),
    total: sorted.length,
    with_email: withEmail,
    // Members the source knows about but would not serve. Kept so coverage is
    // never overstated and the gap stays repairable.
    ...(pending.length && { pending }),
    members: sorted,
  };
  fs.writeFileSync(path.join(DIR, file), JSON.stringify(doc, null, 2));
  console.log(`  ${file}: ${sorted.length} members, ${withEmail} with email` +
    (pending.length ? `, ${pending.length} pending` : ""));
  return file;
}

module.exports = { mapLimit, getJSON, slug, writeChamber, DIR, CACHE };
