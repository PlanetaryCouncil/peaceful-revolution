# Task brief — fill `data/contacts.json` (for a local / cheap agent)

You are populating official **contact channels** for every country on the Peaceful Revolution
situation map. Work is mechanical and repetitive by design. Accuracy is the whole point —
a wrong URL or phone number is worse than a missing one.

## Hard requirement
You MUST have working **web search + web fetch** tools. If you cannot fetch pages, STOP and
report that — do not answer from memory. Every URL/email/phone you record must be one you
actually opened and confirmed belongs to the country in question.

## Output
Write **one file per country**: `data/contacts/{ISO3}-{CountryName}.json` (e.g. `POL-Poland.json`,
`KEN-Kenya.json`). The full list of codes and country names is the `UN_MEMBERS` object (plus
`NON_UN`) in `../index.html` — use those exact ISO3 keys. Any existing file in `data/contacts/`
is a worked example; match that shape exactly:

```json
{
  "iso": "POL",
  "country_name": "Poland",
  "contacts": [
    { "type": "email",    "label": "Ministry of Foreign Affairs", "value": "...", "source": "..." },
    { "type": "website",  "label": "Official Government Portal",  "url":   "...", "source": "..." },
    { "type": "facebook", "label": "...",                          "url":   "...", "source": "..." }
  ]
}
```

Use `value` for emails/phones/addresses and `url` for links. After adding or changing any file,
run `node scripts/build-contacts-index.js` to refresh the manifest the app reads.

## What to collect per country (email first, then everything else)
1. `email` — **top priority.** Foreign ministry, head-of-state office, government contact desk,
   investment/business-development agency, embassy. Get at least one real, reachable address.
2. `website` — official government portal, ministry sites
3. `facebook` / `twitter` — official government or head-of-state accounts only
4. `phone` — published switchboard or ministry numbers
5. `address` — postal address of ministry / mission
6. `other` — anything else official and useful (contact forms, press desks)

Do **not** add `wikipedia` or `factbook` entries — the app generates those automatically from
`data/factbook-slugs.json` and the country name.

## Authoritative sources to consult (don't free-recall)
- UN Permanent Missions / "Blue Book": https://www.un.org/dgacm/en/content/protocol/permanent-missions
- Wikidata "official website" (property P856) for each country
- The country's own Wikipedia infobox (official website field)
- CIA World Factbook country page → "Government" section (leaders, diplomatic representation)

## Rules
- Never invent a URL/email/phone/address. Omit the field if unverified.
- Every entry needs a `source` (the page you took it from).
- Prefer official gov / IGO sources over aggregators.
- Keep each country file valid JSON.

## How to work
- Go **region by region** (Africa, Americas, Asia, Europe, Oceania), ~10 countries per batch.
- After each batch, validate the JSON parses, then run `node scripts/build-contacts-index.js`.
- Check `data/contacts/` first — skip countries that already have a file unless you can add more.
- Track progress: note the last ISO3 you completed so you can resume.
- When done, report counts: countries filled, entries per type, and any countries where you
  could not verify a given channel.
