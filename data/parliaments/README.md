# European parliamentarians — contact dataset

Every sitting member of every national parliament in Europe, plus the European
Parliament: name, seat, party, and **direct email**, sourced from each
parliament's own open-data API.

Built the same way as `data/contacts/` (per-country official channels), one tier
down: that dataset reaches *institutions*, this one reaches *the people holding
the seats*.

## Why this is not a scraping job

Parliaments publish their own rosters as open data — email included. Every source
probed so far serves it directly:

| Source | Members | With email |
|---|---|---|
| `data.europarl.europa.eu` | 708 sitting MEPs | 708 |
| `members-api.parliament.uk` | 650 Commons + 809 Lords | 1,451 |
| `api.sejm.gov.pl` | 460 sitting Sejm | 460 |

So the unit of work is **one fetcher per chamber (~65 of them)**, not one lookup
per person (~15,000). That is the whole design.

## Files

- **`{ISO3}-{Chamber}.json`** — one file per chamber. Bicameral countries get two
  (`GBR-House-of-Commons.json`, `GBR-House-of-Lords.json`) so a contributor can
  repair one without touching the other.
- **`index.json` is generated — never hand-edit.** Rebuild with
  `node scripts/build-parliaments-index.js` after adding or refreshing a chamber.
- Fetchers live in `scripts/parliaments/`, sharing `lib.js`.

## Member schema

Deliberately loose — maximize what each source gives, normalize later.

```json
{
  "id": "UK-172",
  "sitting": true,
  "name": "Ms Diane Abbott",
  "family_name": "Abbott",
  "represents": "GBR",
  "constituency": "Hackney North and Stoke Newington",
  "group": "Labour",
  "emails": ["diane.abbott.office@parliament.uk"],
  "phones": ["020 7219 4426"],
  "profile_url": "https://members.parliament.uk/member/172",
  "source": "https://members-api.parliament.uk/api/Members/172/Contact"
}
```

`source` is per-member on purpose: every address can be re-verified against the
exact endpoint it came from.

### Two fields that carry judgement

- **`sitting: false`** — the source's term roster includes members who have since
  left (resigned, took a Commission post). They stay in the file, marked. A
  departed member's address is not a live channel, and `index.json` counts only
  sitting members so coverage is never overstated.
- **`pending`** (chamber level) — members the source *knows about* but would not
  serve. The EP returns HTTP 429 indefinitely for 11 records whose public profile
  pages load fine. They are recorded with their profile URL rather than dropped,
  so the gap is visible and repairable instead of silently absent.

## Running

```bash
node scripts/parliaments/fetch-europarl.js
node scripts/parliaments/fetch-uk.js
node scripts/parliaments/fetch-poland.js
node scripts/build-parliaments-index.js
```

Responses are cached under `.cache/parliaments/` (gitignored). These are public
APIs with real rate limits — the EP throttles hard enough that one bulk pass
exhausts the window. The cache means recovering from a throttle re-fetches only
what is missing. Delete the directory to force a full refresh.

## Coverage and what is left

Done: European Parliament, UK (both Houses), Poland (Sejm).

Scope boundary: **Council of Europe membership (46 states) + the European
Parliament.** That is the pan-European democratic body — it excludes Russia
(expelled 2022) and Belarus (never a member), which is a defensible line rather
than an arbitrary one.

Remaining chambers are tiered by how the data is obtained:

- **Tier 1 — confirmed open API.** Ireland (`api.oireachtas.ie`) and Sweden
  (`data.riksdagen.se`) were probed and serve full rosters. Each needs a fetcher
  of ~40 lines, like `fetch-poland.js`.
- **Tier 2 — open data believed available, not yet probed.** Germany, France,
  Netherlands, Denmark, Norway, Finland, Czechia, Estonia, Austria, Switzerland,
  Italy, Spain, Portugal and others publish parliamentary open data. Confirm the
  endpoint before writing a fetcher; do not assume the tier.
- **Tier 3 — HTML directory, no API.** Smaller and newer parliaments. These are
  the only ones warranting a scraper, and they are also where misattribution risk
  is highest — the failure mode found in the contacts audit was never
  hallucination, it was confidently pulling the wrong address off a low-quality
  page.

Verify tier before writing code. The probe is one `curl`, and it is the
difference between a 40-line fetcher and a fragile scraper.

## Provenance and privacy

These are **public office-holders' published contact addresses** — parliaments
publish them precisely so constituents can write. That is a different case from
the individuals hidden in `data/contacts/` (see the `PERSONAL` set in
`scripts/verify-contacts.js`), who were ministry staff with no public mandate,
scraped from internal directories. The distinction is not "named individual vs
institution" — it is whether the person holds an office that comes with a duty to
receive correspondence.

Where a source exposes a *private* or campaign address alongside the official
one, prefer the official one.
