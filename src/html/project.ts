import type { ProjectPage, ProjectSubmission } from '../artizen';
import { MONEY_COLS, moneyCells, moneyHeaders, usd } from '../format';
import { driveBadges, escapeHtml, heroSplit, layout, namedLink, panel, sumField, treeRow } from './layout';

export function renderProject(project: ProjectPage): string {
  const tags = (project.tags || []).map((tag) => `<span class="badge text-bg-secondary me-1 mb-1">${escapeHtml(tag)}</span>`).join('');
  const fundingTable = project.seasons.length ? projectFundingTable(project) : '';
  const submissions = project.submissions?.length ? projectSubmissions(project.submissions) : '';
  return layout({
    title: project.name,
    description: project.logline || `Artizen project: ${project.name}`,
    image: project.image,
    tree: true,
    body: `
      ${heroSplit(
        project.image,
        project.name,
        `<h1>${escapeHtml(project.name)}</h1>
          ${project.logline ? `<p class="lead">${escapeHtml(project.logline)}</p>` : ''}
          ${tags ? `<div class="mb-2">${tags}</div>` : ''}
          <p class="mb-0"><a href="${escapeHtml(project.artizen_url)}" target="_blank" rel="noopener">View on Artizen</a></p>`,
      )}
      ${fundingTable}
      ${submissions}
    `,
  });
}

function projectFundingTable(project: ProjectPage): string {
  const seasons = project.seasons
    .map((season, si) => {
      const seasonId = `s${si}`;
      const seasonOpen = si === 0;
      const drives = season.drives || [];
      const seasonRow = treeRow({
        className: 'artizen-tree-season',
        id: seasonId,
        open: seasonOpen,
        hasKids: drives.length > 0,
        label: escapeHtml(season.title),
        cells: `${moneyCells(season)}<td class="text-end">${Number(season.available) > 0 ? usd(season.available) : ''}</td>`,
      });
      const driveRows = drives
        .map((drive, di) => {
          const driveId = `${seasonId}d${di}`;
          const driveOpen = seasonOpen && di === 0;
          const funds = drive.funds || [];
          const driveRow = treeRow({
            className: 'artizen-tree-drive',
            id: driveId,
            parent: seasonId,
            hidden: !seasonOpen,
            open: driveOpen,
            hasKids: funds.length > 0,
            label: `${escapeHtml(drive.name)}${driveBadges(drive)}`,
            cells: `${moneyCells(drive)}<td class="text-end">${drive.active ? usd(drive.available) : ''}</td>`,
          });
          const fundRows = funds
            .map((fund) =>
              treeRow({
                className: 'artizen-tree-fund',
                parent: driveId,
                hidden: !driveOpen,
                label: namedLink(fund.url, fund.name),
                // Unlocked sits in Match; other money columns stay empty so Available lines up.
                cells:
                  MONEY_COLS.map((col) =>
                    `<td class="text-end">${col.field === 'match' ? usd(fund.unlocked) : ''}</td>`,
                  ).join('') + `<td class="text-end">${drive.active ? usd(fund.available) : ''}</td>`,
              }),
            )
            .join('');
          return driveRow + fundRows;
        })
        .join('');
      return seasonRow + driveRows;
    })
    .join('');
  const totals = {
    sales: sumField(project.seasons, 'sales'),
    venus: sumField(project.seasons, 'venus'),
    match: sumField(project.seasons, 'match'),
    prize: sumField(project.seasons, 'prize'),
    sprint: sumField(project.seasons, 'sprint'),
    raised: sumField(project.seasons, 'raised'),
  };
  return panel(`
    <h2 class="artizen-panel-title">Funding</h2>
    <div class="table-responsive">
      <table class="table table-sm artizen-funding-tree">
        <thead><tr>
          <th></th>${moneyHeaders()}
          <th class="text-end">Available</th>
        </tr></thead>
        <tbody>${seasons}</tbody>
        <tfoot><tr>
          <th>Total</th>
          ${moneyCells(totals, 'th')}
          <th class="text-end">${usd(sumField(project.seasons, 'available'))}</th>
        </tr></tfoot>
      </table>
    </div>`);
}

function projectSubmissions(submissions: ProjectSubmission[]): string {
  const groups: { title: string; items: ProjectSubmission[] }[] = [];
  const index = new Map<string, number>();
  for (const s of submissions) {
    const key = `${s.season_number}\0${s.season}`;
    let i = index.get(key);
    if (i == null) {
      i = groups.length;
      index.set(key, i);
      groups.push({ title: s.season || 'Season', items: [] });
    }
    groups[i].items.push(s);
  }
  const rows = groups
    .map((group, si) => {
      const seasonId = `sub${si}`;
      const open = si === 0;
      const head = treeRow({
        className: 'artizen-tree-season',
        id: seasonId,
        open,
        hasKids: true,
        label: escapeHtml(group.title),
        cells: '<td></td>',
      });
      const kids = group.items
        .map((submission) => {
          const status = String(submission.status);
          const cls =
            status === 'Curated' || status === 'Approved'
              ? 'text-bg-primary'
              : status === 'Removed'
                ? 'text-bg-danger'
                : 'text-bg-secondary';
          return treeRow({
            className: 'artizen-tree-submission',
            parent: seasonId,
            hidden: !open,
            label: namedLink(submission.url, submission.name),
            cells: `<td class="text-end"><span class="badge ${cls}">${escapeHtml(status)}</span></td>`,
          });
        })
        .join('');
      return head + kids;
    })
    .join('');
  return panel(`
    <h2 class="artizen-panel-title">Submissions</h2>
    <div class="table-responsive">
      <table class="table table-sm artizen-funding-tree">
        <thead><tr><th></th><th class="text-end">Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`);
}
