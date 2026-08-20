import type { FundPage } from '../artizen';
import { delimited, usd } from '../format';
import { driveBadges, escapeHtml, heroSplit, layout, namedLink, note, panel, sumField, treeRow } from './layout';

export function renderFund(fund: FundPage): string {
  const prize = fund.prize_usd
    ? `<span class="badge text-bg-primary">Prize ${usd(fund.prize_usd)}</span>`
    : fund.prize_art
      ? `<span class="badge text-bg-primary">Prize ${delimited(fund.prize_art)} ART</span>`
      : '';
  const fundingTable = fund.seasons.length ? fundFundingTable(fund) : '';
  return layout({
    title: fund.name,
    description: fund.subtitle || fund.for_title || `Artizen fund: ${fund.name}`,
    image: fund.image,
    tree: true,
    body: `
      ${heroSplit(
        fund.image,
        fund.name,
        `<h1>${escapeHtml(fund.name)}</h1>
          ${fund.subtitle ? `<p class="lead">${escapeHtml(fund.subtitle)}</p>` : ''}
          ${fund.sponsor ? `<p>Lead sponsor: ${escapeHtml(fund.sponsor)}</p>` : ''}
          <div class="mb-2">${fund.active === false ? '<span class="badge text-bg-secondary me-1">Inactive</span>' : ''}${prize}</div>
          <p class="mb-0"><a href="${escapeHtml(fund.artizen_url)}" target="_blank" rel="noopener">View on Artizen</a></p>`,
      )}
      ${fundingTable}
    `,
  });
}

function fundCells(contrib: string, unlocked: string, available: string, raised: string): string {
  return [contrib, unlocked, available, raised].map((content) => `<td class="text-end">${content}</td>`).join('');
}

function raisedLabel(unlocked?: number | null, available?: number | null, show = true): string {
  return show ? usd((unlocked || 0) + (available || 0)) : '';
}

function fundFundingTable(fund: FundPage): string {
  const seasons = fund.seasons
    .map((season, si) => {
      const seasonId = `s${si}`;
      const seasonOpen = si === 0;
      const drives = season.drives || [];
      const count =
        Number(season.count) > 0
          ? `<small class="text-muted">${season.count} ${season.count === 1 ? 'contribution' : 'contributions'}</small>`
          : '';
      const seasonRow = treeRow({
        className: 'artizen-tree-season',
        id: seasonId,
        open: seasonOpen,
        hasKids: drives.length > 0,
        label: `${escapeHtml(season.title)} ${count}`,
        cells: fundCells(
          usd(season.total),
          usd(season.unlocked),
          Number(season.available) > 0 ? usd(season.available) : '',
          raisedLabel(season.unlocked, season.available),
        ),
      });
      const driveRows = drives
        .map((drive, di) => {
          const driveId = `${seasonId}d${di}`;
          const driveOpen = seasonOpen && di === 0;
          const live = drive.active || drive.adjustment;
          const projects = drive.projects || [];
          const driveRow = treeRow({
            className: `artizen-tree-drive${drive.adjustment ? ' artizen-tree-adjust' : ''}`,
            id: driveId,
            parent: seasonId,
            hidden: !seasonOpen,
            open: driveOpen,
            hasKids: projects.length > 0,
            label: `${escapeHtml(drive.name)}${driveBadges(drive)}`,
            cells: fundCells(
              '',
              drive.adjustment ? '' : usd(drive.unlocked),
              live ? usd(drive.available) : '',
              raisedLabel(drive.unlocked, drive.available, live || Number(drive.unlocked) > 0),
            ),
          });
          const projectRows = projects
            .map((project) =>
              treeRow({
                className: 'artizen-tree-project',
                parent: driveId,
                hidden: !driveOpen,
                label: `<span class="artizen-tree-label">
                    ${namedLink(project.url, project.name)}
                    ${project.hidden ? ' <span class="badge text-bg-secondary">hidden</span>' : ''}
                  </span>`,
                cells: fundCells(
                  '',
                  usd(project.unlocked),
                  live ? usd(project.available) : '',
                  raisedLabel(project.unlocked, project.available, live || Number(project.unlocked) > 0),
                ),
              }),
            )
            .join('');
          return driveRow + projectRows;
        })
        .join('');
      return seasonRow + driveRows;
    })
    .join('');
  return panel(`
    <h2 class="artizen-panel-title">Funding</h2>
    ${note('Unlocked = match paid to projects plus awards on curated submissions (Artizen’s distributed). Raised = unlocked + available.')}
    <div class="table-responsive">
      <table class="table table-sm artizen-funding-tree">
        <thead><tr>
          <th></th><th class="text-end">Contributions</th><th class="text-end">Unlocked</th>
          <th class="text-end">Available</th><th class="text-end">Raised</th>
        </tr></thead>
        <tbody>${seasons}</tbody>
        <tfoot><tr>
          <th>Total</th>
          <th class="text-end">${usd(sumField(fund.seasons, 'total'))}</th>
          <th class="text-end">${usd(sumField(fund.seasons, 'unlocked'))}</th>
          <th class="text-end">${usd(sumField(fund.seasons, 'available'))}</th>
          <th class="text-end">${usd(sumField(fund.seasons, 'unlocked') + sumField(fund.seasons, 'available'))}</th>
        </tr></tfoot>
      </table>
    </div>`);
}
