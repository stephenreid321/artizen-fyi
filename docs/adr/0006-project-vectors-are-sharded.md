# Project vectors are sharded

A page scores one project, so project vectors are split into 64 shards and the browser fetches the one shard, about 50 KB, that holds its project, instead of a single 3 MB file that downloaded three thousand times what it read. `vectorBucket` in `src/matching/semantic-text.ts` decides the shard, and the builder and the browser must agree on it exactly. Source: commit d9d5404.
