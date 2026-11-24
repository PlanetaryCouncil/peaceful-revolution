# Armed conflicts 2025 (`ucdp-2025.json`)

Every fighting pair recorded for 2025 by the Uppsala Conflict Data Program, version 26.1 (https://ucdp.uu.se/downloads/, licence CC BY 4.0):

1. Dyadic dataset plus Battle-Related Deaths (dyadic): conflicts with a government on at least one side.
2. Non-State Conflict dataset: armed groups fighting each other.
3. One-sided Violence dataset: deliberate killing of civilians by a government or an armed group.

Full group names come from the UCDP Actor dataset 26.1. Built by `python3 scripts/conflicts/build-ucdp-2025.py`, which also checks every country name against an ISO3 code and stops if one is missing.

The totals reproduce the published figures: 65 conflicts involving a state, 8 between states, 13 wars, 75 non-state conflicts and 244,579 deaths. Counting the countries where state-based fighting took place gives 37; Uppsala's published 35 leaves out the United Kingdom and the United States, which appear only because the strikes on Yemen are coded as an interstate conflict located in all three.

Field notes:

1. `location_iso3`: where the fighting took place. The map draws a circle here.
2. `states_involved_iso3`: every government named on either side, including allies with troops in the fight. The panel lists these under "Government involved abroad".
3. `war`: true when the whole conflict (all its pairs together) passed 1,000 battle deaths in 2025, Uppsala's threshold for a war.
4. "Government of Yemen (North Yemen)" is Uppsala's name for the Sanaa authority (Ansar Allah); the Aden government is "Forces of the Presidential Leadership Council".
