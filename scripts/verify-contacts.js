#!/usr/bin/env node
/**
 * Verifies the contact dataset and (with --fix) annotates it.
 *
 *   node scripts/verify-contacts.js          # report only
 *   node scripts/verify-contacts.js --fix    # also rewrite the country files
 *
 * The data is agent-collected, so it needs mechanical checks a human would
 * never do by hand across 5,500 entries:
 *
 *  1. Malformed emails — scraper artifacts. The big one is Cloudflare's
 *     "[email protected]" obfuscation placeholder, which looks like an
 *     address but is literally the text on the page when the real one is
 *     JS-decoded. Also prose ("contact via web form") stuffed in a value field.
 *  2. Undeliverable domains — no MX *and* no A record, or the domain does not
 *     resolve at all. Mail cannot reach these.
 *  3. Dead website hostnames — domain does not resolve.
 *
 * --fix never deletes research. Cloudflare placeholders are dropped (they carry
 * no information); prose is retyped to `contact_form`; unreachable entries are
 * kept but marked `"unresolved": <ISO date>` so the UI can hide them and a
 * contributor can repair them. Re-running clears the mark if a domain recovers.
 */
const fs = require("fs");
const path = require("path");
const dns = require("dns").promises;

const FIX = process.argv.includes("--fix");
const DIR = path.join(__dirname, "..", "data", "contacts");
const TODAY = new Date().toISOString().slice(0, 10);

const EMAIL_RE = /^[^@\s,;]+@[^@\s,;]+\.[a-z]{2,}$/i;
const CF_PLACEHOLDER = /\[email\s*protected\]/i;

/**
 * Personal work addresses of identifiable individuals, hidden from the site.
 *
 * This dataset exists so people can contact *countries*, and it is built for
 * volume. Institutional addresses (info@, press@, un.newyork@) are published
 * precisely to receive that. These are not: they are named individuals whose
 * addresses were scraped out of staff directories — including, at the extreme,
 * three administrative assistants at Palau's health ministry, who have no
 * diplomatic function at all and never volunteered for a mailing list.
 *
 * Reviewed by hand, because the signal is "is this a person" — not a pattern a
 * regex can settle. New research passes need the same review; the audit query
 * is in the commit that introduced this. Entries stay in the data files (marked,
 * not deleted) so the judgement is visible and reversible.
 */
const PERSONAL = new Set([
  "alba_noya@govern.ad",
  "david.jordens@diplobel.fed.be", "pierre.steverlynck@diplobel.fed.be",
  "florinda.baleci@diplobel.fed.be",
  "pascal.confavreux@diplomatie.gouv.fr", "glenn.salic@diplomatie.gouv.fr",
  "fearghas.obeara@ep.europa.eu",
  "kaye.bass@mofa.gov.kn", "teresa.edwards@gov.kn", "viera.galloway@gov.kn",
  "arnice.yuji@palauhealth.org", "maelee.sokau@palauhealth.org",
  "morisang.udui@palauhealth.org",
  "karen.portillo@investelsalvador.com",
  "bendito.freitas@timor-leste.gov.tl",
  "ann-marie.cain@nauru.gov.nr",   // hyphenated given name — missed by the first pass

  "florent.rrahmani@president-ksgov.net", "valbona.idrizaj@president-ksgov.net",
  "donika.krasniqi@rks-gov.net",
]);
// Public resolvers: the sandbox/ISP resolver returns spurious SERVFAIL under load.
const resolver = new dns.Resolver();
resolver.setServers(["8.8.8.8", "1.1.1.1"]);

// Tri-state on purpose: "alive" | "dead" | "unknown".
// A bulk run against public resolvers WILL get rate-limited, and a throttled
// lookup fails with SERVFAIL/TIMEOUT/REFUSED — which says nothing about whether
// the domain exists. Only a definitive NXDOMAIN from a completed lookup counts
// as dead; anything inconclusive stays "unknown" and is never marked, because
// mislabelling a live government address as dead is worse than not checking it.
const DEFINITIVE_MISSING = new Set(["ENOTFOUND", "NXDOMAIN", "ENODATA"]);
const cache = new Map();

async function reachable(host) {
  if (cache.has(host)) return cache.get(host);
  const p = (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      let sawDefinitiveMissing = false, sawTransient = false;
      for (const q of ["resolveMx", "resolve4", "resolveCname"]) {
        try {
          const r = await resolver[q](host);
          if (r && r.length) return "alive";
          sawDefinitiveMissing = true;                 // empty answer, no error
        } catch (e) {
          if (DEFINITIVE_MISSING.has(e.code)) sawDefinitiveMissing = true;
          else sawTransient = true;                    // SERVFAIL / TIMEOUT / REFUSED
        }
      }
      if (!sawTransient && sawDefinitiveMissing) return "dead";   // all three agreed it is absent
      await new Promise(r => setTimeout(r, 400 * (attempt + 1) ** 2));  // back off, then retry
    }
    return "unknown";                                  // never mark on this
  })();
  cache.set(host, p);
  return p;
}

// Bounded concurrency — public resolvers rate-limit a naive Promise.all over 1500 names.
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const n = i++; out[n] = await fn(items[n], n); }
  }));
  return out;
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith(".json") && f !== "index.json");
const docs = files.map(f => ({ f, d: JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) }));

// Collect every hostname worth testing, once.
const hosts = new Set();
for (const { d } of docs) {
  for (const c of d.contacts) {
    if (c.type === "email" && c.value && EMAIL_RE.test(c.value.trim()))
      hosts.add(c.value.trim().split("@")[1].toLowerCase());
    if (c.url) { try { hosts.add(new URL(c.url).hostname.toLowerCase()); } catch {} }
  }
}
const hostList = [...hosts];
console.log(`checking ${hostList.length} hostnames across ${docs.length} countries…`);

(async () => {
  // Lower concurrency than feels necessary — public resolvers throttle hard, and
  // every throttled lookup becomes an "unknown" that weakens the report.
  const results = await mapLimit(hostList, 8, reachable);
  const dead = new Set(hostList.filter((h, i) => results[i] === "dead"));
  const unknown = hostList.filter((h, i) => results[i] === "unknown");

  const report = { placeholders: [], prose: [], personal: [], deadEmail: [], deadUrl: [], recovered: [] };

  for (const { f, d } of docs) {
    const kept = [];
    for (const c of d.contacts) {
      const val = (c.value || "").trim();

      if (c.type === "email" && CF_PLACEHOLDER.test(val)) {
        report.placeholders.push(`${d.iso} ${c.label}`);
        continue;                                    // carries no information
      }
      if (c.type === "email" && val && !EMAIL_RE.test(val)) {
        report.prose.push(`${d.iso} ${val.slice(0, 60)}`);
        if (FIX) { c.type = "contact_form"; }        // real info, wrong type
        kept.push(c); continue;
      }
      if (c.type === "email" && PERSONAL.has(val.toLowerCase())) {
        report.personal.push(`${d.iso} ${val} — ${(c.label || "").slice(0, 40)}`);
        if (FIX) c.personal = true;                  // hidden by the UI, kept here
        kept.push(c); continue;
      }

      let host = null;
      if (c.type === "email" && EMAIL_RE.test(val)) host = val.split("@")[1].toLowerCase();
      else if (c.url) { try { host = new URL(c.url).hostname.toLowerCase(); } catch {} }

      if (host && dead.has(host)) {
        (c.type === "email" ? report.deadEmail : report.deadUrl).push(`${d.iso} ${val || c.url}`);
        if (FIX) c.unresolved = TODAY;
      } else if (c.unresolved) {
        report.recovered.push(`${d.iso} ${val || c.url}`);
        if (FIX) delete c.unresolved;                 // came back — clear the mark
      }
      kept.push(c);
    }
    if (FIX && kept.length !== d.contacts.length) d.contacts = kept;
    if (FIX) fs.writeFileSync(path.join(DIR, f), JSON.stringify(d, null, 2));
  }

  const show = (title, arr, n = 8) => {
    console.log(`\n${title}: ${arr.length}`);
    arr.slice(0, n).forEach(x => console.log("  " + x));
    if (arr.length > n) console.log(`  … ${arr.length - n} more`);
  };
  show("Cloudflare placeholders (removed)", report.placeholders);
  show("Prose in email field (retyped contact_form)", report.prose);
  show("Personal addresses of individuals (hidden)", report.personal);
  show("Emails on unreachable domains (marked unresolved)", report.deadEmail);
  show("URLs on unreachable domains (marked unresolved)", report.deadUrl);
  if (report.recovered.length) show("Recovered since last run (mark cleared)", report.recovered);

  console.log(`\n${FIX ? "APPLIED" : "DRY RUN"} — ${dead.size}/${hostList.length} hostnames unreachable (no MX/A/CNAME)` +
    (unknown.length ? `, ${unknown.length} inconclusive (left untouched: ${unknown.slice(0, 5).join(", ")}${unknown.length > 5 ? "…" : ""})` : ""));
  if (!FIX) console.log("re-run with --fix to apply, then: node scripts/build-contacts-index.js");
})();
