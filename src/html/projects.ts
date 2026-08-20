import type { Leaderboard } from '../artizen';
import { funding, heatRanks, heatTd, MONEY_COLS, MONEY_INDEXES, RAISED_INDEX, moneyHeaders, truncate } from '../format';
import { board, boardEmpty, datatable, dtPlaceholder, escapeHtml, layout, namedLink, note, pageTitle, panel } from './layout';

export function renderProjects(data: Leaderboard, seasonParam: string | null): string {
  const empty = boardEmpty(data);
  let table = '';
  let extra = '';
  if (!empty) {
    const rows = data.projects.map(funding).sort((a, b) => (b.raised || 0) - (a.raised || 0));
    const heat = heatRanks(
      rows,
      MONEY_COLS.map((col) => col.field),
    );
    const body = rows
      .map((project, i) => {
        const logline = project.logline
          ? `<br><small class="text-muted">${escapeHtml(truncate(project.logline, 90))}</small>`
          : '';
        const cells = MONEY_COLS.map((col) =>
          heatTd(project, String(col.field), heat[String(col.field)], i, rows.length, col.as),
        ).join('');
        return `<tr>
          <td><strong>${namedLink(project.url, project.name)}</strong>${logline}</td>
          ${cells}
        </tr>`;
      })
      .join('');
    table = panel(`
      ${note('Sales excludes Venus artifact buys. S+V = sales + Venus. S+V+M = sales + Venus + match. V+M+E+P = Venus + match + extras + prize. Raised = S+V+M+E+P. The % under each figure is that project’s rank in the column — 1% is the top 1%. Color follows that percentile on a log scale: full green at 1%, fading to white at 100%. <span class="text-body">Tables scroll horizontally on small screens.</span>')}
      ${dtPlaceholder()}
      <table id="artizen-projects-table" class="table table-sm">
        <thead><tr><th>Project</th>${moneyHeaders('text-end artizen-heat')}</tr></thead>
        <tbody>${body}</tbody>
      </table>`);
    extra = datatable('artizen-projects-table', [[RAISED_INDEX, 'desc']], MONEY_INDEXES, { noun: 'projects' });
  }
  return layout({
    title: pageTitle(data),
    body: board(data, 'projects', seasonParam) + table,
    extra,
    datatables: Boolean(extra),
    season: seasonParam,
    boards: true,
  });
}
