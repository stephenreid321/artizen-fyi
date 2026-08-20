import type { FundRow, Leaderboard } from '../artizen';
import { truncate, usd } from '../format';
import { board, boardEmpty, datatable, dtPlaceholder, escapeHtml, layout, namedLink, note, pageTitle, panel } from './layout';

export function renderFunds(data: Leaderboard, seasonParam: string | null): string {
  const empty = boardEmpty(data);
  const current = Boolean(data.season?.current);
  let table = '';
  let extra = '';
  if (!empty) {
    const extraHeads = current
      ? '<th class="text-end">Unlocked</th><th class="text-end">Available</th><th class="text-end">Raised</th>'
      : '';
    const funds = [...data.funds].sort((a, b) =>
      current ? (b.raised ?? -1) - (a.raised ?? -1) : b.season_total - a.season_total,
    );
    const body = funds
      .map((fund: FundRow) => {
        const subtitle = fund.subtitle
          ? `<br><small class="text-muted">${escapeHtml(truncate(fund.subtitle, 90))}</small>`
          : '';
        const inactive = fund.active === false ? '<br><span class="badge text-bg-secondary">Inactive</span>' : '';
        const extraCols = current
          ? `<td class="text-end" data-order="${fund.unlocked ?? -1}">${usd(fund.unlocked)}</td>
             <td class="text-end" data-order="${fund.available ?? -1}">${usd(fund.available)}</td>
             <td class="text-end" data-order="${fund.raised ?? -1}">${usd(fund.raised)}</td>`
          : '';
        return `<tr>
          <td><strong>${namedLink(fund.url, fund.name)}</strong>${subtitle}${inactive}</td>
          <td class="text-end" data-order="${fund.season_total}">${usd(fund.season_total)}</td>
          ${extraCols}
        </tr>`;
      })
      .join('');
    table = panel(`
      ${note('Fund unlocked = match paid to projects plus awards on curated submissions (Artizen’s distributed). Raised = unlocked + available.')}
      ${dtPlaceholder()}
      <table id="artizen-funds-table" class="table table-sm">
        <thead><tr><th>Fund</th><th class="text-end">Contributions</th>${extraHeads}</tr></thead>
        <tbody>${body}</tbody>
      </table>`);
    extra = current
      ? datatable('artizen-funds-table', [[3, 'desc']], [1, 2, 3, 4], { noun: 'funds' })
      : datatable('artizen-funds-table', [[1, 'desc']], [1], { noun: 'funds' });
  }
  return layout({
    title: pageTitle(data),
    body: board(data, 'funds', seasonParam) + table,
    extra,
    datatables: Boolean(extra),
    season: seasonParam,
    boards: true,
  });
}
