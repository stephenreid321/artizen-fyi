---
name: artizen-context
description: What Artizen is, what artizen.fyi is and is not, and the principles every change keeps. Use when planning or scoping a feature, writing copy that explains Artizen mechanics, deciding whether something belongs on this site, or checking a change against the platform's ethos.
---

# Artizen context

artizen.fyi is an independent companion to [artizen.fund](https://artizen.fund): public leaderboards for every Season, and private, on-device matching of a project to Artizen's Funds. It is not affiliated with Artizen and says so on every page. Vocabulary lives in `CONTEXT.md` at the repo root and decisions in `docs/adr/`; read both before this file changes your plan.

## Artizen in one breath

Artizen funds breakthroughs in art, science, technology and culture, and frames itself as a game that is fair, fun and rewarding rather than a grant queue ("we're flipping the board"). Each Season, people launch Funds, sponsors back them, creators submit Projects, Fund admins curate, Projects sell Artifacts, every dollar unlocks match at the week's Match Multiple, the community casts Boosts, rank follows money raised, and Boosts share a separate bonus pot. Rules change in the open, with a promise to roll back and say so when an experiment fails. The [Playbook](https://play.artizen.fund/) is the primary source: quote it rather than paraphrasing mechanics from memory.

## What this site is for

Reading the game, not playing it. The boards show who raised what and why. The strategies page reads the three ratios. Matching helps a creator find Funds worth applying to. The site never moves money, never speaks for Artizen, and never tells anyone they are eligible.

## Principles every change keeps

1. **Independent, and visibly so.** The byline says the site is not affiliated with Artizen. Copy describes Artizen's rules; it does not promise them.
2. **Private by construction.** A freeform description and its embeddings stay in the browser. Nothing about the description, the tags or the ranking is sent anywhere; only thumbnails load from Artizen's media host. A change that adds a network call from `/match` needs an ADR.
3. **Fit, not eligibility.** Rank comes from published fund language and reviewed facets. Curation history, availability and activity are display context and never touch the score. Results are thematic fit, and the copy says so.
4. **Read the Stash, do not crawl.** Public list pages read KV and wait for the cron. A detail page with no Stash may crawl that one page. Bubble is the only source.
5. **A catalog is a release.** Catalog, vectors and model ship together from one build and must agree on version and fingerprints. A threshold change in code does nothing until the catalog is rebuilt.
6. **One Worker, one KV.** No new Cloudflare service without an ADR.
7. **Honest numbers.** Say the figure and the mechanism. The fit index stops at 99 because it measures alignment, not proof.

## Alignment check

Before finishing a feature, a copy change or a scope decision, answer each in one line. A "no" is a finding for the review, not a reason to stop.

- Does the change keep the site a reader of Artizen rather than an actor in it?
- Does any data about a person's project leave the browser that did not before?
- Could a user read the result as an eligibility decision?
- Does a public list page now crawl Bubble on request?
- Does the copy use CONTEXT.md's terms and Artizen's capitalisation?
