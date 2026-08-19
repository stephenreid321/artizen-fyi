# Artizen leaderboards

Public leaderboards for [artizen.fund](https://artizen.fund/), running on Cloudflare. [artizen.fyi](https://artizen.fyi) is the only canonical deployment.

By [Stephen Reid](https://stephenreid.net/).

## Infra

artizen.fyi is a Worker plus KV. No D1, R2, Queues, Durable Objects, or Pages.

- **Worker** — HTML routes, Bubble API crawler, hourly cron
- **KV** — JSON cache (`artizen/leaderboard/…`, `artizen/project/…`, `artizen/fund/…`, `artizen/boosts/…`, `artizen/stats/…`)

It runs on Workers Paid so a season rebuild has enough CPU (free is 10 ms) and the hourly cron can run up to 15 minutes. Cron refreshes every season and drops project/fund pages so they rebuild on next visit. POST `/refresh` with `Authorization: Bearer …` (`REFRESH_SECRET` in the Worker dashboard) rebuilds without waiting for the hour.

artizen.fyi is the apex; `www` 301s there.

## Local development

PRs are welcome. Work against a local Worker:

```bash
npm install
npm run dev          # local Worker + local KV
```

The first `/projects`, `/boosts` or `/stats` hit with an empty cache crawls Bubble and can take ~30–60s. After that, pages read KV.

## Routes

| Path | Page |
| --- | --- |
| `/` | redirect to `/projects` (keeps `?season=`) |
| `/projects`, `/funds`, `/drives` | season leaderboards (`?season=` optional) |
| `/boosts` | remaining boosts + top 100 holders |
| `/stats` | platform totals: endowment flows, ART issuance, users |
| `/search` | project/fund search (`?q=`) |
| `/projects/:slug`, `/funds/:slug` | detail |
| `POST /refresh` | cache rebuild (secret) |
