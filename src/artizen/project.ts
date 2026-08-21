import type { Bubble } from './bubble';
import { appendLegacyProjectSeasons, applyLegacySubmissionAwards } from './legacy';
import { suggestFunds } from './suggest';
import type {
  Drive,
  DriveStat,
  MatchingFund,
  ProjectDriveDetail,
  ProjectFundingSeason,
  ProjectPage,
  ProjectSubmission,
  Row,
  Season,
  SuggestedFund,
} from './types';
import {
  LEAD_CREATOR,
  assignVenusDrive,
  bump,
  byId,
  communitySales,
  driveContext,
  firstMedia,
  groupBy,
  ids,
  int,
  leftoverMatch,
  localFundPath,
  mapSome,
  num,
  seasonFunding,
  projectUrl,
  sortByDesc,
  sum,
  text,
  venusSplit,
} from './util';

export async function buildProject(client: Bubble, slug: string): Promise<ProjectPage | null> {
  const row = await client.findOne('project', slug);
  if (row == null || row['Hide']) return null;

  const id = String(row['_id'] ?? '');
  const slugValue = text(row['Slug']) ?? id;
  const seasonsMeta = await client.seasonsById();
  const seasonRows = await client.list('projectseason', {
    constraints: [{ key: 'project', constraint_type: 'equals', value: id }],
  });
  const artifacts = await client.list('artifact', {
    constraints: [{ key: 'Project', constraint_type: 'equals', value: id }],
  });
  const slices = await client.list('projectfundboostslice', {
    constraints: [{ key: 'project', constraint_type: 'equals', value: id }],
  });
  const participants = await client.list('boostparticipant', {
    constraints: [{ key: 'project', constraint_type: 'equals', value: id }],
  });

  const boostIds = ids([...slices, ...participants].map((r) => r['boost']));
  const drives = await client.fetchNormalizedDrives(boostIds, seasonsMeta);
  sortByDesc(drives, (d) => d.season_number || 0, (d) => d.number || 0);

  const venusTxs = await client.venusTransactions({ projectId: id });
  const venusBySeason: Record<string, number> = {};
  const sprintBySeason: Record<string, number> = {};
  const venusByBoost: Record<string, number> = {};
  const sprintByBoost: Record<string, number> = {};
  for (const tx of venusTxs) {
    const seasonKey = String(tx['Season'] ?? '');
    const split = venusSplit(tx);
    bump(venusBySeason, seasonKey, split.venus);
    bump(sprintBySeason, seasonKey, split.sprint);
    const drive = assignVenusDrive(tx, drives);
    if (drive) {
      bump(venusByBoost, drive.id, split.venus);
      bump(sprintByBoost, drive.id, split.sprint);
    }
  }

  const prizeBySeason: Record<string, number> = {};
  const stats: Record<string, Record<string, DriveStat>> = {};
  stats[id] = stats[id] || {};
  for (const part of participants) {
    if (!part['boost']) continue;

    const boostKey = String(part['boost']);
    const venus = num(venusByBoost[boostKey]);
    const sprint = num(sprintByBoost[boostKey]);
    const sales = communitySales(part['fund drive sales (both)'], venus);
    const match = num(part['match boost unlocked (both)']);
    const prize = num(part['prize earned usd']);
    stats[id][boostKey] = {
      sales,
      venus,
      match,
      prize,
      sprint,
      raised: sales + venus + match + prize + sprint,
    };
    let seasonId = part['season'];
    if (!seasonId) {
      const drive = drives.find((d) => d.id == part['boost']);
      seasonId = drive && drive.season_id;
    }
    if (seasonId != null && seasonId !== false && prize > 0) {
      bump(prizeBySeason, String(seasonId), prize);
    }
  }
  for (const [boostId, grouped] of groupBy(slices, (s) => s['boost'])) {
    if (!boostId) continue;

    const leftover = leftoverMatch(grouped);
    if (!(leftover > 0)) continue;

    const drive = drives.find((d) => d.id == boostId);
    const key = String(boostId);
    stats[id][key] ||= { sales: 0.0, venus: 0.0, match: 0.0, raised: 0.0 };
    stats[id][key].available = drive && drive.active ? leftover : 0.0;
  }

  const fundIds = ids(slices.map((s) => s['fund']));
  const fundsById = await client.indexed('fund', fundIds);
  const matchingFunds = sortByDesc(
    mapSome(groupBy(slices, (s) => [s['fund'], s['boost']]), ([pair, grouped]) => {
      const [fundId, boostId] = pair as [unknown, unknown];
      const fund = byId(fundsById, fundId);
      if (!fund) return undefined;

      const drive = drives.find((d) => d.id == boostId);
      const fundSlug = text(fund['Slug']) ?? fundId;
      return {
        name: text(fund['name']) ?? '',
        url: localFundPath(fundSlug),
        ...driveContext(drive),
        available: drive && drive.active ? leftoverMatch(grouped) : 0.0,
        unlocked: sum(grouped, (r) => num(r['match unlocked'])),
        cap: sum(grouped, (r) => num(r['match cap $'])),
      } satisfies MatchingFund;
    }),
    (f) => f.season_number || 0,
    (f) => f.drive_number || 0,
    (f) => f.cap,
  );

  const rawTags = row['impact tags (impact tag)'];
  const tagIds = rawTags == null || rawTags === false ? [] : Array.isArray(rawTags) ? rawTags : [rawTags];
  const tags = (await client.fetchByIds('impacttag', tagIds)).flatMap((t) => {
    const name = text(t['name']);
    return name ? [name] : [];
  });

  const driveDetails = projectDriveDetails(drives, stats[id]);
  const seasons = mapSome(seasonRows, (srow) => {
    const meta = byId(seasonsMeta, srow['season ']);
    const seasonKey = String(srow['season '] ?? '');
    const funding = seasonFunding(
      srow,
      { venus: venusBySeason[seasonKey], sprint: sprintBySeason[seasonKey] },
      prizeBySeason[seasonKey],
    );
    if (!(funding.raised > 0)) return undefined;

    const number =
      srow['season number'] != null && srow['season number'] !== false
        ? (srow['season number'] as number)
        : meta?.number;
    return {
      number,
      title: meta?.title ?? `Season ${srow['season number']}`,
      ...funding,
    } satisfies ProjectFundingSeason;
  });
  const submissionRows = await client.list('projectsubmission', {
    constraints: [{ key: 'Project', constraint_type: 'equals', value: id }],
  });
  appendLegacyProjectSeasons(seasons, row, seasonsMeta);
  applyLegacySubmissionAwards(seasons, submissionRows, seasonsMeta);
  sortByDesc(seasons, (s) => s.number || 0);
  const submissions = await formatProjectSubmissions(client, submissionRows, seasonsMeta);
  const suggested = await projectSuggestedFunds(client, id, slices, submissionRows, fundsById);
  return {
    name: text(row['Name']) ?? '',
    artizen_url: projectUrl(slugValue),
    creator: text(row[LEAD_CREATOR]),
    logline: text(row['Logline']),
    image: projectImage(row, seasonRows, artifacts, seasonsMeta),
    tags,
    seasons: nestProjectFunding(seasons, driveDetails, matchingFunds),
    submissions,
    ...(suggested.length ? { suggestedFunds: suggested } : {}),
  };
}

async function projectSuggestedFunds(
  client: Bubble,
  projectId: string,
  slices: Row[],
  submissionRows: Row[],
  fundsById: Record<string, Row>,
): Promise<SuggestedFund[]> {
  const awardFundIds = ids(
    submissionRows
      .filter((row) => row['Status'] === 'Curated' && num(row['$ amount raised']) > 0)
      .map((row) => row['Fund']),
  );
  const ownFundIds = ids([...slices.map((slice) => slice['fund']), ...awardFundIds]);
  if (ownFundIds.length === 0) return [];

  const missing = ownFundIds.filter((id) => !byId(fundsById, id));
  const catalog = missing.length ? { ...fundsById, ...(await client.indexed('fund', missing)) } : fundsById;
  const ownFunds = ownFundIds.map((id) => {
    const row = byId(catalog, id);
    return {
      id,
      name: text(row?.['name']) ?? '',
      slug: text(row?.['Slug']),
    };
  });
  const excludeFundIds = ids([
    ...ownFundIds,
    ...submissionRows.filter((row) => !(row['Submitted'] == false)).map((row) => row['Fund']),
  ]);
  return suggestFunds(client, { projectId, ownFunds, excludeFundIds });
}

function projectDriveDetails(drives: Drive[], statsByDrive: Record<string, DriveStat>): ProjectDriveDetail[] {
  return mapSome(drives, (drive) => {
    const stat = statsByDrive[drive.id];
    if (!stat) return undefined;
    if (!(num(stat.available) > 0 || num(stat.raised) > 0 || num(stat.sales) > 0 || num(stat.venus) > 0)) return undefined;

    return {
      ...stat,
      name: drive.name,
      status: drive.status,
      active: drive.active,
      number: drive.number,
      url: drive.url,
      multiple: drive.multiple,
      season: drive.season,
      season_id: drive.season_id,
      season_number: drive.season_number,
    };
  });
}

function nestProjectFunding(
  seasons: ProjectFundingSeason[],
  drives: ProjectDriveDetail[],
  matchingFunds: MatchingFund[],
): ProjectFundingSeason[] {
  const known = seasons.map((season) => season.number);
  for (const row of [...drives, ...matchingFunds]) {
    if (known.some((n) => n == row.season_number)) continue;

    seasons.push({
      number: row.season_number,
      title: row.season ?? `Season ${row.season_number}`,
      sales: 0.0,
      venus: 0.0,
      match: 0.0,
      prize: 0.0,
      raised: 0.0,
    });
    known.push(row.season_number);
  }
  sortByDesc(seasons, (season) => season.number || 0);

  return seasons.map((season) => {
    const seasonDrives = drives.filter((drive) => drive.season_number == season.number);
    const seasonFunds = matchingFunds.filter((fund) => fund.season_number == season.number);
    const named = seasonDrives.map((drive) => drive.name);
    const stubs = [...new Set(seasonFunds.map((fund) => fund.drive))].filter(
      (name) => name != null && !named.some((n) => n == name),
    );
    for (const name of stubs) {
      const sample = seasonFunds.find((fund) => fund.drive == name);
      seasonDrives.push({
        name: name as string,
        url: null,
        active: sample && sample.drive_active,
        number: sample && sample.drive_number,
        sales: 0.0,
        venus: 0.0,
        match: 0.0,
        prize: 0.0,
        available: sum(
          seasonFunds.filter((fund) => fund.drive == name),
          (fund) => num(fund.available),
        ),
        multiple: sample && sample.drive_multiple,
        status: undefined,
        season: undefined,
        season_id: undefined,
        raised: 0,
      });
    }
    sortByDesc(seasonDrives, (drive) => drive.number || 0);
    const nested = seasonDrives.map((drive) => ({
      ...drive,
      funds: seasonFunds.filter((fund) => fund.drive == drive.name),
    }));
    return {
      ...season,
      available: sum(nested, (drive) => num(drive.available)),
      drives: nested,
    };
  });
}

async function formatProjectSubmissions(
  client: Bubble,
  rows: Row[],
  seasonsMeta: Record<string, Season>,
): Promise<ProjectSubmission[]> {
  const kept = rows.filter((row) => !(row['Submitted'] == false));
  const fundIds = ids(kept.map((row) => row['Fund']));
  const fundsById = await client.indexed('fund', fundIds);
  return mapSome(kept, (row) => {
    const fund = byId(fundsById, row['Fund']);
    if (!fund) return undefined;

    const slug = text(fund['Slug']) ?? row['Fund'];
    const meta = byId(seasonsMeta, row['season']);
    const number =
      row['season number'] != null && row['season number'] !== false
        ? (row['season number'] as number)
        : meta?.number;
    return {
      name: text(fund['name']) ?? '',
      url: localFundPath(slug),
      status: text(row['Status']),
      season: meta?.title ?? (number != null ? `Season ${number}` : undefined),
      season_number: number,
      created_at: row['Created Date'],
    } satisfies ProjectSubmission;
  }).sort((a, b) => {
    const season = (b.season_number || 0) - (a.season_number || 0);
    if (season) return season;
    const rank = submissionStatusRank(a.status) - submissionStatusRank(b.status);
    if (rank) return rank;
    return String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''));
  });
}

function submissionStatusRank(status: string | undefined): number {
  switch (status) {
    case 'Curated':
    case 'Approved':
      return 0;
    case 'Submitted':
      return 1;
    default:
      return 2;
  }
}

function projectImage(row: Row, seasonRows: Row[], artifacts: Row[], seasonsMeta: Record<string, Season>): string | undefined {
  const current = Object.values(seasonsMeta).find((season) => season.current);
  const artifactFile = (artifact: Row) => artifact['image - crop'] || artifact['image - compressed'] || artifact['image - original'];
  const forSeason = (artifact: Row) =>
    (current?.id != null && String(artifact['Season'] ?? '') === current.id) ||
    (current?.number != null && int(artifact['season number']) === current.number);
  const currentArtifact = artifacts.find(forSeason);
  const latestArtifact = [...artifacts].sort((a, b) => int(b['season number']) - int(a['season number']))[0];
  const currentSeasonCrop = seasonRows.find(
    (srow) => current?.id != null && String(srow['season '] ?? '') === current.id,
  )?.['image crop'];
  return firstMedia(
    currentArtifact && artifactFile(currentArtifact),
    currentSeasonCrop,
    latestArtifact && artifactFile(latestArtifact),
    row['(old) Artifact Image -crop'],
    row['Profile image lead creator'],
  );
}
