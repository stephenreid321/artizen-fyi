import type { FundRow, Leaderboard, ProjectRow } from '../artizen';
import { truncate } from '../format';
import { escapeHtml, layout, note, pageTitle, panel } from './layout';

function haystack(...parts: unknown[]): string {
  return parts
    .filter((part) => part != null && part !== '')
    .join(' ')
    .toLowerCase();
}

function matches(query: string, ...parts: unknown[]): boolean {
  const needle = query.trim().toLowerCase();
  return needle !== '' && haystack(...parts).includes(needle);
}

function rank(query: string, name: string): number {
  const needle = query.trim().toLowerCase();
  const n = name.toLowerCase();
  if (n === needle) return 0;
  if (n.startsWith(needle)) return 1;
  return 2;
}

function resultCard(kind: 'Project' | 'Fund', name: string, url: string, detail?: string): string {
  const sub = detail ? `<p class="text-muted small artizen-subtitle mb-0">${escapeHtml(truncate(detail, 120))}</p>` : '';
  return `<a class="artizen-result card mb-3" href="${escapeHtml(url)}">
    <div class="card-body">
      <span class="badge artizen-kind-${kind.toLowerCase()} mb-2">${kind}</span>
      <h2 class="artizen-result-title mb-1">${escapeHtml(name)}</h2>
      ${sub}
    </div>
  </a>`;
}

function resultCol(title: string, count: number, cards: string): string {
  const body = cards || `<p class="text-muted mb-0">No matching ${title.toLowerCase()}.</p>`;
  return `<div class="col-lg-6 mb-3">
    ${panel(`<h2 class="artizen-panel-title">${escapeHtml(title)} (${count})</h2>${body}`)}
  </div>`;
}

export function renderSearch(data: Leaderboard, query: string, seasonParam: string | null): string {
  const q = query.trim();
  const projects = q
    ? [...data.projects]
        .filter((row: ProjectRow) => matches(q, row.name, row.logline, row.creator))
        .sort((a, b) => rank(q, a.name) - rank(q, b.name) || a.name.localeCompare(b.name))
    : [];
  const funds = q
    ? [...data.funds]
        .filter((row: FundRow) => matches(q, row.name, row.subtitle))
        .sort((a, b) => rank(q, a.name) - rank(q, b.name) || a.name.localeCompare(b.name))
    : [];
  const heading = q
    ? `Results for “${escapeHtml(q)}”`
    : 'Search projects and funds';
  const empty = !q
    ? panel(note('Type a name in the search box to find projects and funds in this season.'))
    : '';
  const cols = q
    ? `<div class="row">
        ${resultCol('Projects', projects.length, projects.map((p) => resultCard('Project', p.name, p.url, p.logline || p.creator)).join(''))}
        ${resultCol('Funds', funds.length, funds.map((f) => resultCard('Fund', f.name, f.url, f.subtitle)).join(''))}
      </div>`
    : '';
  return layout({
    title: q ? `${q} · ${pageTitle(data)}` : `Search · ${pageTitle(data)}`,
    description: 'Search Artizen projects and funds',
    query: q,
    season: seasonParam,
    body: `
      ${panel(`<h1 class="mb-0">${heading}</h1>`)}
      ${empty}
      ${cols}
    `,
  });
}
