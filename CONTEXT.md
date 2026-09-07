# artizen.fyi

Public leaderboards and private, on-device fund matching for artizen.fund. One Cloudflare Worker plus KV, not affiliated with Artizen.

## Language

### Artizen mechanics

**Season**:
A numbered competition period on Artizen. Every board is read per Season (`?season=`), and Season totals roll into a finale prize.

**Drive**:
One week of competition inside a Season, Thursday to Thursday, with its own Match Multiple, match pot, prizes and Boost Bonus pot. Artizen's own copy says "Fund Drive".
_Avoid_: round, week (on its own)

**Fund**:
A community fund on Artizen that curates Projects and supplies match. A Fund is curating when Artizen marks it active; the boards and matching say "Not curating" otherwise.
_Avoid_: grant, matching fund, pool

**Project**:
A creator's entry on Artizen. Projects sell Artifacts, get curated by Funds, and rank on money raised.

**Artifact**:
The digital collectible a Project sells. Sales are Artifact buys.

**Venus**:
Artizen's AI cofounder. Venus buys Artifacts through quests, sprints and raffles; her buys are House buys, peeled out of Sales and counted under V.

**House buys**:
Artifact purchases made by Artizen itself rather than a fan: Venus from Season 7, and the Artizen admin account in Season 6, before Venus existed. Other accounts named Artizen are people or fund admins, not house.
_Avoid_: Venus buys (when Season 6 is in scope)

**Endowment**:
Artizen's own pool, which gives every approved Project a baseline of available match.

**Match Multiple**:
The Drive's multiplier: each $1 of Sales or Venus unlocks that many dollars of match, until the Project's available cap runs out.

**Boost**:
A community vote on a Project or Fund, paid in Boost Points. Since the Harvest Drive, Boosts win a share of the Boost Bonus pot and no longer set rank.

**Fair Finish**:
The five-minute overtime at a Drive's close, Thursday 11:00 AM PT. The timer restarts only if the lead flips.

### Leaderboard columns

**Sales (S)**:
Community Artifact buys on a Project, with House buys removed.

**Venus (V)**:
House buys plus Venus extras from quests, sprints and raffles.

**Match (M)**:
Match funding a Project has unlocked from its Funds and the Endowment.

**Prize (P)**:
The weekly cash prize, which follows rank.

**Bonus (B)**:
A Project's share of a Drive's Boost Bonus pot, which follows Boosts.

**Raised**:
S + V + M + P, plus B when a Drive has a pot. Rank on the project board follows Raised.

**Strategy**:
One of the three ways to play, read from a ratio on `/strategies`: The Best Friend (V/S), The Multiplier (M/S), The Closer (P/S).
_Avoid_: archetype (the code's current name; rename when touched), playstyle

### Fund matching

**Catalog**:
The fixed, versioned public index the browser fetches for matching: `core.json` (funds, facets, scoring, published fund language), `projects.json`, and one record per project. Built at deploy and treated as current for 30 days.
_Avoid_: index (except for the combined `index.json` the QA tools read)

**Release**:
The Catalog, the fund and project vectors, and the pinned model, shipped together. Every piece carries the release version and text fingerprints, and the build fails if they disagree.

**Fit**:
Thematic alignment between a Project and a Fund, from published fund language, reviewed facets and core concepts. Fit is not eligibility.
_Avoid_: match (see Flagged ambiguities), score (for the displayed number)

**Fit index**:
The 0 to 99 number on a card, mapped onto the bands so number and label always agree.

**Bands**:
Strong, Good, Worth a look, Limited. The first two are evidence-backed. The primary list holds twelve Funds: strong and good first, then the closest exploratory ones.

**Focus facets**:
The shared taxonomy facets a Fund or Project carries, used for the focus chips and their filter.

**Impact tags**:
A Project's tags on Artizen, the largest single lever on match quality.

**Curation history**:
A Project's past relationship with a Fund: Applied, Curated or Funded. Shown on the card, never used in ranking.
_Avoid_: relationship (in copy), history badge

**Prepared vectors**:
Fund and project embeddings built at release time, so a catalog Project is scored in the browser with a dot product and no model download. Older copy says "precomputed".

**Local AI**:
The opt-in on-device model path (pinned `mxbai-embed-xsmall-v1`) for a freeform description or an edited Project, which Prepared vectors cannot cover.

**Baseline only**:
The label on results when prepared semantic assets fail to load and only the deterministic lexical and facet ranker ran.

### Infrastructure

**Stash**:
The KV cache of leaderboard, project, fund and boosts JSON. Public list pages read the Stash and never crawl; a detail page with no Stash crawls that one page.
_Avoid_: cache (when you mean the KV entry)

**Bubble**:
Artizen's backend API, the only source the crawler reads.

**Cron refresh**:
The job, every ten minutes, that refreshes every Season and the remaining Boosts, then drops project and fund pages so they rebuild on the next visit.

## Relationships

- A **Season** holds many **Drives**; a Drive runs two boards, Projects and Funds.
- A **Fund** curates many **Projects**; a Project may be curated by many Funds and always has the **Endowment**.
- **Sales** and **Venus** unlock **Match** at the Drive's **Match Multiple**; **Raised** sums the columns; rank follows Raised; **Prize** follows rank; **Bonus** follows **Boosts**.
- A **Release** contains one **Catalog**; a Catalog holds Funds and Projects with their **Curation history**; **Fit** is computed between one Project and every Fund.

## Flagged ambiguities

- **match**: on the boards it is money (the M column, "match funding", "available match"); on `/match` the route and the code (`src/matching/`) use it for thematic fit. Current usage keeps "match" for money and "fit" for the ranking result, with "matching" only as the feature's name. Unresolved: whether the route should follow the nav label "Find funds".
- **prepared vs precomputed**: MATCHING.md and the client use both words for the same vectors. Prepared is the term here because the release scripts and the parity check use it; sweep the copy when next touched.
- **archetype vs strategy**: `src/html/play.ts` calls the three strategies archetypes; the page and the nav say Strategies. Rename the code when next touched.
