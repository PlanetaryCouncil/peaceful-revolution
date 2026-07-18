# Task brief — fill `data/contacts.json` (for a local / cheap agent)

You are populating official **contact channels** for every country on the Peaceful Revolution
situation map. Work is mechanical and repetitive by design. Accuracy is the whole point —
a wrong URL or phone number is worse than a missing one.

## Hard requirement
You MUST have working **web search + web fetch** tools. If you cannot fetch pages, STOP and
report that — do not answer from memory. Every URL/email/phone you record must be one you
actually opened and confirmed belongs to the country in question.

## Output
Edit `data/contacts.json` in place. It is keyed by **ISO3 code**. The full list of codes and
country names is the `UN_MEMBERS` object (plus `NON_UN`) in `../index.html` — use those exact
keys. Read `_schema` at the top of `contacts.json` for the entry format, field list, and rules.
Two worked examples are already there (`USA`, `FRA`) — match that shape exactly.

## What to collect per country (in priority order)
1. `gov` — official national government web portal (one per country)
2. `mfa` — Ministry / Department of Foreign Affairs
3. `un_mission` — Permanent Mission to the United Nations (New York). Include site, and email/
   phone/address if the UN "Blue Book" page lists them.
4. `head_of_state` — office of the head of state or head of government
5. `parliament` — national legislature
6. `nhri` — national human-rights institution (if one exists)
7. `social` — official government social account(s), only if clearly official

Do **not** add `wikipedia` or `factbook` entries — the app generates those automatically.

## Authoritative sources to consult (don't free-recall)
- UN Permanent Missions / "Blue Book": https://www.un.org/dgacm/en/content/protocol/permanent-missions
- Wikidata "official website" (property P856) for each country
- The country's own Wikipedia infobox (official website field)
- CIA World Factbook country page → "Government" section (leaders, diplomatic representation)

## Rules (also in `_schema.rules`)
- Never invent a URL/email/phone/address. Omit the field if unverified.
- Every entry needs a `source` (the page you took it from) and a `verified` date (YYYY-MM-DD).
- Prefer official gov / IGO sources over aggregators.
- Keep `contacts.json` valid JSON after every edit.

## How to work
- Go **region by region** (Africa, Americas, Asia, Europe, Oceania), ~10 countries per batch.
- After each batch, validate the JSON parses and save.
- Track progress: note the last ISO3 you completed so you can resume.
- When done, report counts: countries filled, entries per type, and any countries where you
  could not verify a given channel.
