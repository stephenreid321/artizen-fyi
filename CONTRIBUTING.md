# Contributing

PRs are welcome. This file is the standard the `review` skill checks a diff against, so keep it short and true.

## Seam map

- `src/artizen/` crawls Artizen's Bubble API and shapes the results into the types in `src/artizen/types.ts`. Nothing else talks to Bubble.
- `src/matching/` builds and scores the matching catalog. The ranking code is pure so the same functions run in the Worker, in the browser's Web Worker and in the build scripts.
- `src/client/` is the browser: the match page, its Web Worker and the scorers, bundled by `scripts/build-client.mjs` under a 60 KB gzip budget for the base client.
- `src/html/` renders pages as template strings. Every interpolated value goes through `escapeHtml`. Matching CSS lives between the `ARTIZEN_MATCHING_CSS_START` and `END` markers in `src/styles.css` so only `/match` pays for it.
- `src/index.ts` is the Worker: routes, the KV Stash, the ten-minute cron.
- `scripts/` are the release and QA tools, plain `.mjs` files run through `npm run`.
- Dependency direction: `src/html/` and `src/client/` import from `src/matching/` and `src/artizen/`; `src/matching/` imports only types and helpers from `src/artizen/` and contains no fetch and no DOM. The one edge that runs the other way is `src/artizen/client.ts` calling `buildMatchIndex` to build the match index for the Stash. Keep it the only one.

## Tests

- Vitest, in `test/`, one file per module or route. Test through the public interface: `worker.fetch`, the exported matching functions, the built index. Do not reach into internals.
- Fixtures live in `test/fixtures/`. Production rejects fixture indexes, so a test of release behaviour must not depend on one passing as live.
- Expected values are literals or worked examples, never recomputed the way the code computes them.
- `npm run check` must pass: both typechecks, the tests, and the bundle budgets.

## Copy and prose

Follow the `artizen-voice` skill. British spelling, no em dashes in UI copy, Artizen's nouns capitalised as Artizen does, and CONTEXT.md's terms.

## Colours and markup

Follow the `artizen-design-system` skill. Brand and Interface colours only on chrome. Bootstrap's buttons are retargeted once in `styles.css`, never per call site.

## Commits and pull requests

The canonical repo is [stephenreid321/artizen-fyi](https://github.com/stephenreid321/artizen-fyi). Work on a branch in your fork and open pull requests against its `main`. Name the canonical repo `upstream` locally so the commands below work as written:

```bash
git remote add upstream https://github.com/stephenreid321/artizen-fyi.git
```

- Subject: one sentence, imperative, with the reason in it, as the upstream log already does: "Use Moss for filled green chrome instead of a custom ink, so badges and links stay in the brand palette." Not a conventional prefix such as `fix(client):`.
- One concern per commit. Agent configuration (AGENTS.md, skills, ADRs) goes in its own commits, so a feature pull request stays about the feature.
- Never commit `public/`, `.wrangler/`, or machine-specific editor config.
- Before opening a pull request: fetch `upstream` and bring `upstream/main` into your branch, run `npm run check`, then run `review` from a fresh session against `upstream/main`.

## Decisions

Anything hard to reverse, surprising without context, and the result of a real trade-off gets a one-paragraph ADR in `docs/adr/`. The `domain-modeling` skill holds the bar and the format.
