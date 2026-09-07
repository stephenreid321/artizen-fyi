# artizen-fyi

Public leaderboards and private, on-device fund matching for artizen.fund, running as one Cloudflare Worker plus KV. Not affiliated with Artizen. [README.md](README.md) covers infra and local development; [MATCHING.md](MATCHING.md) covers how matching works and how its assets are built.

## Before you explore

- [CONTEXT.md](CONTEXT.md) is the glossary. Use its terms in code, tests, copy and commits. "match" is flagged there because it means two things.
- [docs/adr/](docs/adr/) records decisions that are hard to reverse. Read the ones touching the area you are changing, and contradict one only by saying so.
- [CONTRIBUTING.md](CONTRIBUTING.md) holds the seam map, test conventions, commit style, and the standards the `review` skill checks a diff against.

## Checks

`npm run check` runs both typechecks, the unit tests and the browser bundle budgets. `public/` is gitignored and built at deploy, so a fresh clone has no matching assets until you follow MATCHING.md.

## Skills

Skills live in `.agents/skills/`, which Codex and Cursor read directly; `.claude/skills/` holds relative symlinks for Claude Code. Six of them (`grilling`, `grill-with-docs`, `domain-modeling`, `codebase-design`, `tdd`, `improve-codebase-architecture`) are unmodified copies from mattpocock/skills v1.2.3 (commit 6654f6b); refresh them with `npx skills@latest add mattpocock/skills --skill <name>` under Node 22.20 or newer. `review` is a fork of that repo's `code-review` and is edited here.

- Before building a feature, run `grill-with-docs` (grilling plus domain-modeling) so the decision and its vocabulary land in CONTEXT.md and docs/adr/ first.
- Build test-first at seams agreed up front with `tdd`. Design module shapes in the `codebase-design` vocabulary: module, interface, seam, depth.
- Review every diff with `review` from a fresh session, against `main` or the branch point. It reads CONTRIBUTING.md, CONTEXT.md and the three artizen skills as standards.
- Every few weeks, from Claude Code, run `improve-codebase-architecture`, one candidate per session.
- `artizen-context`, `artizen-design-system` and `artizen-voice` load on their own when a task touches scope and ethos, CSS and markup, or prose. Load one by name when in doubt.
