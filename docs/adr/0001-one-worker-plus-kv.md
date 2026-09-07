# One Worker plus KV, nothing else on Cloudflare

artizen.fyi is a single Worker with one KV namespace: HTML routes, static assets, the Bubble crawler and the ten-minute cron all ship in one deployable, and the README rules out D1, R2, Queues, Durable Objects and Pages. It runs on Workers Paid so a season rebuild has enough CPU and the cron can run for up to fifteen minutes. The reason for stopping at KV is not written down anywhere; treat adding another Cloudflare service as a decision in its own right, and record it here when it happens.
