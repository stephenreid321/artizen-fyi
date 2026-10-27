# artizen.fyi

Created by [Stephen Reid](https://stephenreid.net/).

The live Cloudflare Worker behind [artizen.fyi](https://artizen.fyi) is retired. That domain now redirects here.

It was a public mirror of [artizen.fund](https://artizen.fund/) leaderboards, with private on-device fund matching. Artizen Works shut the platform down in October 2026.

## Archived KV cache

A snapshot of the production Cloudflare KV cache, taken 9 October 2026 — leaderboards, project pages, and remaining boosts:

**[Download prod-kv-2026-10-09.zip](archive/prod-kv-2026-10-09.zip)** (8.8 MB)

The zip contains:

| Path | Contents |
| --- | --- |
| `prod-kv.json` / `prod-kv.csv` | Raw key/value dump (384 keys) |
| `csv/projects.csv` | Project pages |
| `csv/leaderboard-projects.csv`, `csv/leaderboard-funds.csv` | Season tables |
| `csv/drives.csv`, `csv/boosts.csv`, `csv/boost-holders.csv` | Drives and boosts |
| `csv/` | Other flattened tables (tags, submissions, seasons, …) |

## Source

Worker source remains in this repo as a historical record. It is no longer deployed. Matching internals are in [MATCHING.md](MATCHING.md).
