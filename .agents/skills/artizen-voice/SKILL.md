---
name: artizen-voice
description: The house voice for artizen.fyi prose. Use when writing or editing UI copy, page notes and empty states, README or MATCHING.md text, commit subjects, or pull request descriptions for this repo.
---

# Artizen voice

The site explains a game to the people playing it. It sounds like a sharp friend who has read the rules: plain, specific, a little dry, never selling. General prose craft lives in the `humanize-writing` skill; this file holds only what is particular to artizen.fyi.

## Rules, each in the site's own words

1. **One idea per sentence, and short.** "Rank is sales plus match. Prizes follow rank. Boosts take a share of a separate bonus pot."
2. **The number and the mechanism, not the adjective.** "A 3× week turns $1 into $4 raised from one pool", never "high-multiple weeks are very valuable".
3. **The why rides in the same sentence.** "Algae cannot carry white type (2.1:1 on white). Moss can, so filled chrome uses Moss." Use so, because, which is why.
4. **Second person and imperative moves when talking to creators.** "Submit to every Fund you qualify for. One curation is enough to start."
5. **Dry beats hyped.** "Extra sales past the cap are just sales." No exclamation marks in UI copy; the byline keeps its one.
6. **Say what the site cannot do.** "Results describe thematic fit and published eligibility language; they are not eligibility decisions."
7. **Artizen's nouns, Artizen's capitals.** Fund, Project, Artifact, Boost, Venus, Endowment, Match Multiple, Fair Finish, Season, Drive. Lowercase sales, match and prize as column names. Use the canonical term in `CONTEXT.md`: match is money on the boards and fit on `/match`.
8. **Name controls by what happens.** "Find matching funds"; "Update matches" only while a refinement is pending; "Improve with local AI" only when it could improve something.
9. **Guidance is not an error.** An untagged project gets a prompt in the warning palette without red. A failed asset load says "Baseline only", not "Error".

## Punctuation and spelling

- No em dashes. Rewrite with a comma, a colon, a full stop or parentheses, whichever the sentence wants. Commit 6110b28 dropped them from matching copy; that is the rule everywhere now.
- British spelling in prose and commits: colour, maximise, catalogue. "Catalog" stays as it is, because the code and the URLs say so.
- Numbers as figures with the unit: $10,000, 3×, 1.48 MB, 30 days.
- Sentence case for headings and buttons.

## Before and after

| Before | After |
| --- | --- |
| "Boost your chances by leveraging our powerful AI-driven matching engine!" | "Choose an Artizen project or describe one. Your description stays in this browser while the matching engine compares it with the public fund catalog." |
| "Something went wrong loading semantic data." | "Baseline only. Prepared semantic matching did not load, so these results use the lexical and facet ranker." |
| "We recommend adding tags for better results." | "A third of the catalog carries no tags. Tagged projects average 7.6 evidence-backed matches against 3.4; add up to eight impact tags." |

## Commits and pull requests

Subject: one sentence, imperative, carrying the reason. "Use Moss for filled green chrome instead of a custom ink, so badges and links stay in the brand palette." Add a body only when the subject cannot hold the why. `CONTRIBUTING.md` holds the convention.
