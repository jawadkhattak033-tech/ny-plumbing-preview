# Content brief (shared by all content writers)

Project: static Astro plumbing site. All page copy lives in JSON files under `src/content/<collection>/<slug>.json`.
Schemas are enforced in `src/content.config.ts`; read it before writing. A wrong field name or count fails the build.

## Reference examples (match these exactly in shape, tone and length)
- Service page: `src/content/services/drain-cleaning.json` (commercial pages use the identical schema)
- Region page: `src/content/regions/capital-region.json`
- Town page:   `src/content/towns/troy-ny.json`

## Business tokens
Never hardcode the business name, phone, city of the shop, owner, etc. Use these tokens; they are filled from `src/data/business.json` at build:
`{name}` full business name · `{shortName}` short brand · `{phone}` · `{email}` · `{city}` city where the shop is (currently Albany) · `{state}` state name · `{stateAbbr}` · `{years}` years in business · `{rating}` · `{reviews}` review count · `{owner}` owner full name · `{ownerFirst}` · `{license}` · `{address}` · `{hours}` = "24 hours a day, 7 days a week".

Real place names (towns, counties, neighborhoods, rivers) are written directly, not tokenized.

## Writing rules
- Write all copy fresh. Do NOT visit or copy fullertonplumbinganddrain.com or any other plumbing site.
- Every page must be genuinely different: different angles, examples, local details, FAQ questions. Never reuse a paragraph with the name swapped.
- Plain, direct, homeowner-friendly. Short sentences. No hype words ("top-notch", "premier", "best in class"), no em dashes, no exclamation marks.
- Do not invent specific statistics, prices in dollars, awards, certifications, warranties or guarantees. Talk about what drives cost, not numbers.
- Do not invent customer names, testimonials or staff names.
- Business is open 24/7, gives upfront pricing before work starts, is fully insured, uses sewer cameras, cleans up after jobs.
- Lengths: hero.sub 25-40 words; quickAnswer 35-60 words; intro paragraphs 50-90 words each; FAQ answers 30-70 words; seoTitle under 65 characters (count it as if tokens were ~12 chars); metaDescription 130-160 characters.
- Valid JSON only (double quotes, no trailing commas, no comments). Escape inner double quotes.

## Slugs you may reference
Residential services (`/plumbing/<slug>/`), in nav order:
1 emergency-plumbing, 2 drain-cleaning, 3 hydro-jetting, 4 sewer-line-repair, 5 trenchless-sewer-replacement, 6 sewer-camera-inspection, 7 water-heater-repair, 8 water-heater-replacement, 9 tankless-water-heaters, 10 frozen-pipe-repair, 11 burst-pipe-repair, 12 repiping, 13 leak-detection, 14 toilet-repair, 15 faucet-and-sink-repair, 16 garbage-disposals, 17 sump-pumps, 18 water-softener-installation (title "Water Softeners")

Commercial services (`/commercial/<slug>/`), in nav order:
1 commercial-plumbing, 2 commercial-drain-cleaning, 3 grease-trap-cleaning, 4 restaurant-plumbing, 5 property-management-plumbing, 6 preventive-drain-maintenance, 7 multifamily-apartment-plumbing (title "Apartment and Multifamily Plumbing"), 8 office-retail-plumbing (title "Office and Retail Plumbing")

Regions (`/regions/<slug>/`), in order:
1 capital-region, 2 new-york-city, 3 long-island, 4 mid-hudson, 5 mohawk-valley, 6 central-new-york, 7 finger-lakes, 8 western-new-york, 9 southern-tier, 10 north-country

Capital Region towns (`/<slug>/`), order and county:
1 albany-ny (Albany), 2 schenectady-ny (Schenectady), 3 clifton-park-ny (Saratoga), 4 saratoga-springs-ny (Saratoga), 5 glens-falls-ny (Warren), 6 troy-ny (Rensselaer), 7 latham-ny (Albany), 8 hudson-ny (Columbia), 9 colonie-ny (Albany), 10 queensbury-ny (Warren), 11 catskill-ny (Greene), 12 saratoga-ny (Saratoga; the Town of Saratoga incl. Schuylerville and Victory, not the city), 13 delmar-ny (Albany), 14 ballston-spa-ny (Saratoga), 15 rotterdam-ny (Schenectady), 16 easton-ny (Washington), 17 guilderland-ny (Albany), 18 halfmoon-ny (Saratoga), 19 mechanicville-ny (Saratoga), 20 rensselaer-ny (Rensselaer), 21 niskayuna-ny (Schenectady), 22 stillwater-ny (Saratoga)

## Field notes
- Service `related`: exactly 3 slugs from the SAME collection (residential→residential, commercial→commercial), never itself.
- Service `order`: the nav order number above.
- Town `popular`: 6 residential service slugs most relevant to that town. `nearby`: 4-6 other town slugs that are geographically close. `problems[].service`: a residential or commercial slug. `region`: "capital-region". `geo`: approximate real coordinates of the town center. `zips`: real ZIP codes for the town.
- Town `order`: the number above. Town `name` is the plain name ("Clifton Park").
- Region `counties`: the real counties in that New York region (names without "County"). `communities`: 16-24 real cities/towns in it. `order`: number above. Regions other than the Capital Region are farther from the {city} shop: be honest that arrival takes longer and is scheduled, emergency calls answered 24/7 and routed to the nearest available tech.
- `imageAlt` always starts with "Placeholder photo: " followed by a description of the photo that should go there.
