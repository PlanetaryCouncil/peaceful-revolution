# Sanctions Registry — Handover Note

**Status:** Phase 1 complete (UK only, current designations)  
**Date:** 2026-08-31  
**Scope:** Global Designation Registry POC

---

## What's Done

✅ **UK Sanctions List parsed & stored**
- Source: [gov.uk/government/publications/the-uk-sanctions-list](https://www.gov.uk/government/publications/the-uk-sanctions-list)
- Format: CSV → JSON
- File: `data/sanctions/UK.json` (37 MB, 58,436 entries)
- Parser: `scripts/parse-uk-sanctions.js` (idempotent, self-contained)

**Quick stats:**
- Iran (Nuclear): 17,698
- Russia: 9,911
- ISIL/Al-Qaeda: 8,980
- CAR, Afghanistan, Syria, North Korea, etc.

**Entry schema:** id, name, type, regime, designation_type, designation_source, sanctions_imposed, date_designated, reason, country, nationality, dob

---

## Architecture Choices

1. **Per-jurisdiction files** (`data/sanctions/UK.json`, future: `US.json`, `EU.json`, etc.)
   - Mirrors the peaceful-revolution contacts structure (one file per country)
   - Allows independent updates without merge conflicts

2. **Loose schema, maximize data now**
   - All 58 CSV columns preserved in memory during parse
   - Only essential fields kept in JSON (can extend later)
   - No dedup logic yet (UK list has Sharif University 10× due to multiple related entries — not a bug)

3. **No historical tracking yet**
   - Current designations only
   - Could add `date_delisted` / `date_modified` later if needed

---

## Known Quirks

- **1,920 "universities"** = all Iranian nuclear research institutions (Sharif University, etc.)
- **41,803 "unknown" type** = individuals with no entity type specified (UK omits type for many people)
- **Duplicate entries** — some entities appear multiple times (e.g., Sharif 10×); this reflects the source data structure (different aspects of one entity listed separately)

---

## Next Steps (in priority order)

### 1. **Add OFAC (US Treasury) & EU**
   - **OFAC:** [SDN download](https://www.treasury.gov/ofac/downloads/) (CSV, well-structured)
   - **EU:** [Consolidated sanctions list API](https://webgate.ec.europa.eu/isarQuery/faces/pages/sanctions/sanctionsSectors.xhtml)
   - **Why:** These are the highest-impact regimes (enforcement + cross-border reach)
   - **Effort:** ~2–3 hours parallelized (one agent per source)
   - **Deliverable:** `data/sanctions/US.json`, `data/sanctions/EU.json`

### 2. **Entity Matching & Dedup**
   - **Problem:** "Russia" vs "RUSSIAN FEDERATION" vs "RF" appear in multiple sources as the same entity
   - **Solution:** Fuzzy string matching + manual review on edge cases
   - **Deliverable:** Unified entity table with all jurisdictions that have designated it
   - **Complexity:** Name matching is hard (aliases, transliteration, typos); recommend Levenshtein + hand-review top-N conflicts

### 3. **Integrate into Peaceful Revolution**
   - **Option A:** Add sanctions count to each country's data
     - Query: how many entities from this country are sanctioned by the UK?
     - Display: small badge on country tile
   - **Option B:** Separate "sanctions" modal/panel
     - Show top sanctioning regimes, entities by category
     - Link to source government lists
   - **Recommendation:** Start with Option A (lowest effort, most visible)

### 4. **Build Search / Query API**
   - Simple endpoint: `/api/sanctions?q=entity_name` → returns all jurisdictions that have it
   - Enable "popularity" view: entities sanctioned by 5+ jurisdictions
   - Useful for compliance checks, investigative journalism

### 5. **Add Historical Data (Later)**
   - Track delisted/redesignated entities
   - Show timeline of designations
   - Bigger dataset (10–20× larger) but deferred for now

---

## Setup & Continuation

**To refresh the UK list:**
```bash
cd /Users/m/Code/peaceful-revolution
node scripts/parse-uk-sanctions.js
```

**To add a new jurisdiction:**
1. Find the source URL (gov website or API)
2. Write a parser like `scripts/parse-uk-sanctions.js`
3. Save to `data/sanctions/{COUNTRY}.json`
4. Update `data/sanctions/README.md` with stats

**To build entity matching:**
- Start with OFAC + UK + EU (3 sources, ~150k combined entries)
- Use a simple fuzzy matcher (npm: `string-similarity`, `fuse.js`)
- Manually review matches with Levenshtein distance > 0.8 and count > 1 jurisdiction
- Store dedup mapping in `data/sanctions/entity-map.json` or similar

---

## Deferred: "Terrorist Popularity Contest"

User's eventual goal: **cross-jurisdiction analysis**
- Which entities are sanctioned by the most countries?
- Which regimes overlap most (e.g., US + EU + UK consensus vs. unilateral sanctions)?
- Heat map: co-designation clusters

This requires Phase 1 (multiple jurisdictions) + Phase 2 (entity matching). **Not blocked by anything; just needs the data to exist first.**

---

## Files Touched

- `data/sanctions/UK.json` — 37 MB, main dataset
- `data/sanctions/README.md` — documentation + quick stats
- `scripts/parse-uk-sanctions.js` — parser (reusable template)

## Not Changed

- `index.html` — no integration yet
- `CLAUDE.md` — no update needed yet
- Peaceful Revolution main app — ready for integration when priority shifts

---

## Open Questions for Next Phase

1. **Entity matching strategy** — fuzzy string only, or pull in additional signals (country, type, regime)?
2. **UI integration** — sanctions count on country tiles, or separate feature?
3. **Scope creep** — historical data + 200+ jurisdictions, or stay minimal (current, top 5 sources)?
4. **Public API?** — should this be queryable by external tools / embed-able?

---

## Handoff Checklist

- [x] Data downloaded & parsed
- [x] Schema documented
- [x] Parser is idempotent (safe to re-run)
- [x] Quick stats generated
- [x] README written
- [ ] OFAC/EU sources added
- [ ] Entity matching logic built
- [ ] UI integration complete
- [ ] Search/query API live
