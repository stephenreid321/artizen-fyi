import type { Bubble } from './bubble';
import type { Constraint, SuggestedFund } from './types';
import { byId, hidden, ids, localFundPath, maybeNum, sortByDesc, text } from './util';

const MATCH_CAP: Constraint = { key: 'match cap $', constraint_type: 'greater than', value: 0 };

export const SIBLING_CAP = 80;
export const SUGGEST_LIMIT = 6;

// Every project joins this fund, so co-occurrence through it is meaningless.
const GLOBAL_FUND_NAMES = new Set(['artizen fund for human creativity']);
const GLOBAL_FUND_SLUGS = new Set(['artizen-fund-for-human-creativity']);

export type OwnFund = { id: string; name: string; slug?: string };

export function isGlobalFund(fund: { name?: string; slug?: string }): boolean {
  const name = (fund.name ?? '').trim().toLowerCase();
  const slug = (fund.slug ?? '').trim().toLowerCase();
  return GLOBAL_FUND_NAMES.has(name) || GLOBAL_FUND_SLUGS.has(slug);
}

type RankedFund = {
  fundId: string;
  sharedProjects: number;
  connectingFund: string;
  total: number;
};

export function rankCandidates(
  ownFunds: OwnFund[],
  siblingOwn: Map<string, Set<string>>,
  candidateSiblings: Map<string, Set<string>>,
): RankedFund[] {
  const rows: RankedFund[] = [];
  for (const [fundId, siblings] of candidateSiblings) {
    if (siblings.size === 0) continue;

    let connectingFund = '';
    let overlap = 0;
    for (const own of ownFunds) {
      if (!own.name) continue;
      let n = 0;
      for (const siblingId of siblings) {
        if (siblingOwn.get(siblingId)?.has(own.id)) n += 1;
      }
      if (n > overlap) {
        overlap = n;
        connectingFund = own.name;
      }
    }
    if (!(overlap > 0) || !connectingFund) continue;

    rows.push({
      fundId,
      sharedProjects: overlap,
      connectingFund,
      total: siblings.size,
    });
  }
  return sortByDesc(rows, (row) => row.total, (row) => row.sharedProjects);
}

export async function suggestFunds(
  client: Pick<Bubble, 'listWhereIn' | 'indexed'>,
  opts: {
    projectId: string;
    ownFunds: OwnFund[];
    excludeFundIds: Iterable<string>;
    siblingCap?: number;
    limit?: number;
  },
): Promise<SuggestedFund[]> {
  const ownFunds = opts.ownFunds.filter((fund) => fund.id && !isGlobalFund(fund));
  if (ownFunds.length === 0) return [];

  const projectId = String(opts.projectId);
  const exclude = new Set(ids([...opts.excludeFundIds, ...ownFunds.map((fund) => fund.id)]));
  const siblingCap = opts.siblingCap ?? SIBLING_CAP;
  const limit = opts.limit ?? SUGGEST_LIMIT;

  const ownSlices = await client.listWhereIn(
    'projectfundboostslice',
    'fund',
    ownFunds.map((fund) => fund.id),
    [MATCH_CAP],
  );
  const siblingOwn = new Map<string, Set<string>>();
  for (const slice of ownSlices) {
    const siblingId = slice['project'];
    const fundId = slice['fund'];
    if (siblingId == null || siblingId === false || String(siblingId) === projectId) continue;

    const sid = String(siblingId);
    let bucket = siblingOwn.get(sid);
    if (!bucket) {
      if (siblingOwn.size >= siblingCap) continue;
      bucket = new Set();
      siblingOwn.set(sid, bucket);
    }
    if (fundId != null && fundId !== false) bucket.add(String(fundId));
  }

  const siblingIds = [...siblingOwn.keys()];
  if (siblingIds.length === 0) return [];

  const projects = await client.indexed('project', siblingIds);
  for (const sid of siblingIds) {
    if (hidden(byId(projects, sid))) siblingOwn.delete(sid);
  }
  const visibleIds = [...siblingOwn.keys()];
  if (visibleIds.length === 0) return [];

  const theirSlices = await client.listWhereIn('projectfundboostslice', 'project', visibleIds, [MATCH_CAP]);
  const candidateSiblings = new Map<string, Set<string>>();
  for (const slice of theirSlices) {
    const fundId = slice['fund'];
    const siblingId = slice['project'];
    if (fundId == null || fundId === false || siblingId == null || siblingId === false) continue;

    const fid = String(fundId);
    const sid = String(siblingId);
    if (exclude.has(fid) || !siblingOwn.has(sid)) continue;

    let bucket = candidateSiblings.get(fid);
    if (!bucket) {
      bucket = new Set();
      candidateSiblings.set(fid, bucket);
    }
    bucket.add(sid);
  }

  const ranked = rankCandidates(ownFunds, siblingOwn, candidateSiblings);
  if (ranked.length === 0) return [];

  const fundsById = await client.indexed(
    'fund',
    ranked.map((row) => row.fundId),
  );
  const kept = ranked.filter((row) => {
    const fund = byId(fundsById, row.fundId);
    if (!fund || fund['active'] === false) return false;
    const name = text(fund['name']);
    if (!name) return false;
    return !isGlobalFund({ name, slug: text(fund['Slug']) });
  }).slice(0, limit);
  if (kept.length === 0) return [];

  const exts = await client.indexed(
    'fundextendedinfo',
    kept.map((row) => byId(fundsById, row.fundId)?.['Extended info']),
  );

  const suggested: SuggestedFund[] = [];
  for (const row of kept) {
    const fund = byId(fundsById, row.fundId);
    if (!fund) continue;

    const name = text(fund['name']);
    if (!name) continue;

    const slug = text(fund['Slug']) ?? row.fundId;
    const ext = byId(exts, fund['Extended info']);
    const available = maybeNum(fund['Funding - current']);
    const item: SuggestedFund = {
      name,
      url: localFundPath(slug),
      sharedProjects: row.sharedProjects,
      connectingFund: row.connectingFund,
    };
    const subtitle = text(ext?.['subtitle']);
    if (subtitle) item.subtitle = subtitle;
    if (available != null && available > 0) item.available = available;
    suggested.push(item);
  }
  return suggested;
}
