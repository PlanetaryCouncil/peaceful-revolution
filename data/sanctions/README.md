# UK Sanctions List Dataset

**Source:** [UK Government Sanctions List](https://www.gov.uk/government/publications/the-uk-sanctions-list)  
**Last Updated:** 2026-08-28  
**Total Designations:** 58,436

## Files

- **`UK.json`** — Full dataset with all fields

## Quick Stats

### By Regime (top 15)
- **Iran (Nuclear):** 17,698
- **Russia:** 9,911
- **ISIL/Al-Qaeda:** 8,980
- **Central African Republic:** 4,222
- **Afghanistan:** 3,720
- **Syria:** 3,468
- **North Korea:** 1,461
- **Counter-Terrorism:** 1,408
- **Global Human Rights:** 1,141

### By Entity Type (top 10)
- Unknown/Individual: 41,803
- Enterprise: 5,929
- Import/Export: 3,643
- University: 1,920
- LLC: 977

## Schema

Each entry contains:
```json
{
  "id": "AFG0001",
  "name": "HAJI KHAIRULLAH HAJI SATTAR MONEY EXCHANGE",
  "type": "Enterprise",
  "regime": "The Afghanistan (Sanctions) (EU Exit) Regulations 2020",
  "designation_type": "Entity",
  "designation_source": "UN",
  "sanctions_imposed": "Asset freeze",
  "date_designated": "29/06/2012",
  "reason": "...",
  "country": "Afghanistan",
  "nationality": "...",
  "dob": "..."
}
```

## Next Steps

- Add other jurisdictions (US OFAC, EU, UN, etc.)
- Build entity matching/dedup across jurisdictions
- Generate cross-jurisdiction "popularity" view
