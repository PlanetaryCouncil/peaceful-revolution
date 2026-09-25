# National elections worldwide

Every national election and referendum on earth, per country, with the next one
(or the most recent one) surfaced on the map panel.

Rebuild: `node scripts/elections/fetch-calendar.js 2025 2027`

## Files

- **`{ISO3}.json`** — one per country: full list, plus `next` and `last`.
- **`index.json` is generated, never hand-edited.** It carries `next`/`last` per
  country so the map loads one small file instead of 124.

## Source, and the two that did not work

Wikipedia's `<year>_national_electoral_calendar` pages. Crowd-maintained, so
every entry keeps its `source` URL and this is a starting point for
verification, not settled fact.

Recorded so nobody re-walks them:

- **Wikidata SPARQL** — right shape, unusable in practice. The election subclass
  tree is 2,421 deep (and drifts: "approval voting" and a Jesuit congregation
  are both in it). The `P279*` path times out per-quarter; a `VALUES` list of
  all 2,421 exceeds GET limits, and POST still 502s.
- **IFES ElectionGuide** — authoritative and cleanly structured, but the API is
  401-gated and the public page lists only ~36 upcoming elections.

## The parsing trap

Wikipedia writes the date once per polling day, then lists further countries
voting that day as plain siblings with **no date of their own**:

```html
<li>4 October: Bosnia and Herzegovina, Presidency ...</li>
<li>Brazil, President, Chamber of Deputies and Senate</li>   <!-- same day -->
```

Requiring a date on every line silently drops every country that shares a
polling day — which is how Brazil's general election went missing on the first
pass. The parser carries the date forward, guarded by a heading reset and by
requiring the country to resolve to a real ISO code. That fix recovered 38
elections, 25% of the dataset.

## Coverage, stated honestly

190 elections, 124 countries, 2025&ndash;2027.

- **National only.** Parliamentary by-elections, local, regional and municipal
  votes are not here. A UK Westminster by-election will not appear; neither will
  US state or Brazilian municipal races.
- **No line is not the same as no election.** The UK has none listed because its
  next general election is not due until 2029, outside the fetched range.
- **Future years thin out.** 2027 has 13 entries because the page is still being
  filled in, not because the world stops voting.
- **Dependencies are skipped.** Bermuda, Tokelau, the Faroes, New Caledonia and
  similar have elections but no ISO3 in our country map; the fetcher reports
  them as unmapped rather than dropping them silently.
