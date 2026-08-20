import type { Leaderboard } from '../artizen';
import { usd } from '../format';
import styles from '../styles.css';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TREE_SCRIPT = `
<script>
  document.addEventListener('DOMContentLoaded', function() {
    function setKids(table, id, show) {
      table.querySelectorAll('tr[data-parent="' + id + '"]').forEach(function(tr) {
        var childId = tr.getAttribute('data-id');
        if (show) {
          tr.classList.remove('artizen-tree-hidden');
          if (!childId) return;
          var toggle = tr.querySelector('a.artizen-tree-toggle');
          setKids(table, childId, toggle && toggle.getAttribute('aria-expanded') === 'true');
        } else {
          tr.classList.add('artizen-tree-hidden');
          if (childId) setKids(table, childId, false);
        }
      });
    }
    document.querySelectorAll('.artizen-funding-tree').forEach(function(table) {
      table.addEventListener('click', function(e) {
        var btn = e.target.closest('a.artizen-tree-toggle');
        if (!btn || !table.contains(btn)) return;
        e.preventDefault();
        var row = btn.closest('tr');
        var id = row && row.getAttribute('data-id');
        if (!id) return;
        var expanding = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', expanding);
        var icon = btn.querySelector('i');
        if (icon) {
          icon.classList.toggle('bi-chevron-down', expanding);
          icon.classList.toggle('bi-chevron-right', !expanding);
        }
        setKids(table, id, expanding);
      });
    });
  });
</script>
`;

export function layout(opts: {
  title: string;
  description?: string;
  image?: string | null;
  body: string;
  extra?: string;
  datatables?: boolean;
  chart?: boolean;
  tree?: boolean;
  query?: string;
  season?: string | null;
  boards?: boolean;
  boosts?: boolean;
  stats?: boolean;
}): string {
  const desc = escapeHtml(opts.description || 'Fund and project leaderboards from Artizen');
  const image = escapeHtml(opts.image || 'https://artizen.fyi/og.png');
  const imageSize = opts.image
    ? ''
    : `<meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="artizen.fyi">`;
  const css = [
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/css/bootstrap.min.css">',
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.13.1/font/bootstrap-icons.min.css">',
    opts.datatables
      ? '<link rel="stylesheet" href="https://cdn.datatables.net/v/bs5/dt-3.0.2/datatables.min.css"><noscript><style>.artizen-dt-placeholder{display:none}</style></noscript>'
      : '',
  ]
    .filter(Boolean)
    .join('\n  ');
  const js = [
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.8/js/bootstrap.bundle.min.js"></script><script>document.querySelectorAll(\'[data-bs-toggle="tooltip"]\').forEach(function(el){bootstrap.Tooltip.getOrCreateInstance(el);});(function(){var nav=document.querySelector(".artizen-nav");var q=document.getElementById("artizen-q");var long="Search projects and funds";function sync(){if(nav)document.documentElement.style.setProperty("--artizen-nav-height",nav.offsetHeight+"px");if(q)q.placeholder=window.matchMedia("(max-width: 767px)").matches?"Search":long;}sync();window.addEventListener("resize",sync);})();</script>',
    opts.datatables
      ? '<script src="https://cdn.datatables.net/v/bs5/dt-3.0.2/datatables.min.js"></script>'
      : '',
    opts.chart ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js"></script>' : '',
    opts.tree ? TREE_SCRIPT : '',
    opts.extra || '',
  ]
    .filter(Boolean)
    .join('\n  ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="application-name" content="artizen.fyi">
  <title>${escapeHtml(opts.title)}</title>
  <meta name="description" content="${desc}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="artizen.fyi">
  <meta property="og:title" content="${escapeHtml(opts.title)}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${image}">
  ${imageSize}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${image}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  ${css}
  <link rel="stylesheet" href="https://s3.amazonaws.com/appforest_uf/f1669921386747x462861532157019100/RocGroteskBold.css">
  <link rel="stylesheet" href="https://s3.amazonaws.com/appforest_uf/f1670009029268x384309142695173700/RocGroteskMedium.css">
  <link rel="stylesheet" href="https://s3.amazonaws.com/appforest_uf/f1669919682183x184427803987397440/P22Mackinac-Medium_6.css">
  <style>${styles}</style>
</head>
<body>
  ${nav(opts.query, opts.season, opts.boards, opts.boosts, opts.stats)}
  <div class="artizen-shell">
    ${opts.body}
  </div>
  ${FOOTER}
  ${js}
</body>
</html>`;
}

function nav(query?: string, season?: string | null, boards?: boolean, boosts?: boolean, stats?: boolean): string {
  const seasonField = season
    ? `<input type="hidden" name="season" value="${escapeHtml(season)}">`
    : '';
  const boardsHref = season ? `/projects?season=${encodeURIComponent(season)}` : '/projects';
  const boardsClass = boards ? 'artizen-nav-pill artizen-nav-pill-ink' : 'artizen-nav-pill';
  const boostsClass = boosts ? 'artizen-nav-pill artizen-nav-pill-ink' : 'artizen-nav-pill';
  const statsClass = stats ? 'artizen-nav-pill artizen-nav-pill-ink' : 'artizen-nav-pill';
  return `
<header class="artizen-nav">
  <div class="artizen-nav-inner">
    <div class="artizen-nav-side">
      <div class="d-none d-md-flex gap-2">
        <a class="${boardsClass}" href="${boardsHref}">Seasons</a>
        <a class="${boostsClass}" href="/boosts">Boosts</a>
        <a class="${statsClass}" href="/stats">Stats</a>
      </div>
      <button type="button" class="artizen-nav-toggle d-md-none" data-bs-toggle="offcanvas" data-bs-target="#artizen-nav-offcanvas" aria-controls="artizen-nav-offcanvas" aria-label="Menu">
        <i class="bi bi-list" aria-hidden="true"></i>
      </button>
    </div>
    <a class="artizen-wordmark" href="${boardsHref}" aria-label="artizen.fyi"><i class="bi bi-graph-up-arrow" aria-hidden="true"></i><span>artizen.fyi</span></a>
    <div class="artizen-nav-side artizen-nav-side-end">
      <form class="artizen-search" action="/search" method="get" role="search">
        <label class="visually-hidden" for="artizen-q">Search projects and funds</label>
        <i class="bi bi-search" aria-hidden="true"></i>
        <input id="artizen-q" type="search" name="q" placeholder="Search" value="${escapeHtml(query || '')}" autocomplete="off">
        ${seasonField}
      </form>
    </div>
  </div>
</header>
<div class="offcanvas offcanvas-start" tabindex="-1" id="artizen-nav-offcanvas" aria-labelledby="artizen-nav-offcanvas-label">
  <div class="offcanvas-header">
    <a class="artizen-wordmark" href="${boardsHref}" id="artizen-nav-offcanvas-label" aria-label="artizen.fyi"><i class="bi bi-graph-up-arrow" aria-hidden="true"></i><span>artizen.fyi</span></a>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body">
    <nav class="artizen-offcanvas-nav">
      <a class="${boards ? 'active' : ''}" href="${boardsHref}"${boards ? ' aria-current="page"' : ''}>Seasons</a>
      <a class="${boosts ? 'active' : ''}" href="/boosts"${boosts ? ' aria-current="page"' : ''}>Boosts</a>
      <a class="${stats ? 'active' : ''}" href="/stats"${stats ? ' aria-current="page"' : ''}>Stats</a>
    </nav>
  </div>
</div>
`;
}

const FOOTER = `
<footer class="artizen-footer">
  <div class="artizen-footer-inner">
    <p>
      This is a project by <a href="https://stephenreid.net" target="_blank" rel="noopener">Stephen Reid</a>
      and is not affiliated with Artizen.
    </p>
    <p>
      <a class="artizen-footer-github" href="https://github.com/stephenreid321/artizen-fyi" target="_blank" rel="noopener">
        <i class="bi bi-github" aria-hidden="true"></i>
        GitHub
      </a>
    </p>
  </div>
</footer>
`;


export function panel(inner: string, opts?: { flush?: boolean; className?: string }): string {
  const cls = ['artizen-panel', opts?.flush ? 'artizen-panel-flush' : '', opts?.className || '']
    .filter(Boolean)
    .join(' ');
  return `<div class="${cls}">${inner}</div>`;
}

export function note(text: string): string {
  return `<p class="artizen-note">${text}</p>`;
}

export function heroSplit(image: string | null | undefined, alt: string, copy: string): string {
  if (!image) return panel(copy);
  return panel(
    `<img class="artizen-hero" src="${escapeHtml(image)}" alt="${escapeHtml(alt)}">
    <div class="artizen-hero-copy">${copy}</div>`,
    { className: 'artizen-hero-card' },
  );
}

export function dtPlaceholder(): string {
  return `<div class="artizen-dt-placeholder" aria-hidden="true">
    <span class="artizen-dt-ph artizen-dt-ph-search"></span>
  </div>`;
}

export function datatable(
  tableId: string,
  order: Array<[number, string]>,
  numeric: number[],
  opts?: { pageLength?: number; paging?: boolean; info?: boolean; noun?: string },
): string {
  const pageLength = opts?.pageLength ?? 25;
  const paging = opts?.paging ?? true;
  const info = opts?.info ?? true;
  const noun = opts?.noun ?? 'entries';
  const language = {
    search: '_INPUT_',
    searchPlaceholder: `Search ${noun}`,
    info: `Showing _START_ to _END_ of _TOTAL_ ${noun}`,
    infoEmpty: `No ${noun}`,
    infoFiltered: `(filtered from _MAX_ total ${noun})`,
    zeroRecords: `No matching ${noun}`,
    emptyTable: `No ${noun}`,
  };
  return `<script>
    document.addEventListener('DOMContentLoaded', function() {
      var table = document.getElementById('${tableId}');
      if (!table) return;
      var ph = table.previousElementSibling;
      new DataTable(table, {
        paging: ${paging},
        pageLength: ${pageLength},
        lengthChange: false,
        searching: true,
        info: ${info},
        autoWidth: false,
        order: ${JSON.stringify(order)},
        columnDefs: [{ type: 'num', targets: ${JSON.stringify(numeric)} }],
        layout: {
          topStart: null,
          topEnd: 'search',
          bottomStart: ${info ? "'info'" : 'null'},
          bottomEnd: ${paging ? "'paging'" : 'null'}
        },
        language: ${JSON.stringify(language)}
      });
      var phEl = ph && ph.classList.contains('artizen-dt-placeholder') ? ph : null;
      if (phEl) phEl.remove();
      var wrap = document.createElement('div');
      wrap.className = 'artizen-table-scroll';
      var container = table.closest('.dt-container') || table;
      var searchBox = container.querySelector('.dt-search');
      var searchInput = searchBox && searchBox.querySelector('input');
      if (searchBox && searchInput && !searchBox.querySelector('.bi-search')) {
        var icon = document.createElement('i');
        icon.className = 'bi bi-search';
        icon.setAttribute('aria-hidden', 'true');
        searchBox.insertBefore(icon, searchInput);
        searchInput.setAttribute('aria-label', ${JSON.stringify(`Search ${noun}`)});
      }
      container.parentNode.insertBefore(wrap, container);
      wrap.appendChild(container);
    });
  </script>`;
}

export function boardEmpty(data: Leaderboard): boolean {
  return Boolean(data.error && data.projects.length === 0 && data.funds.length === 0);
}

export function pageTitle(data: Leaderboard): string {
  return data.season ? `artizen.fyi · ${data.season.title}` : 'artizen.fyi';
}

export function seasonQuery(season?: string | null): string {
  return season ? `?season=${encodeURIComponent(season)}` : '';
}

export function board(data: Leaderboard, tab: 'projects' | 'funds' | 'drives', seasonParam: string | null): string {
  const season = data.season;
  const qs = seasonQuery(seasonParam);
  const options = data.seasons
    .map((s) => {
      const selected = season && s.number === season.number ? ' selected' : '';
      const current = s.current ? ' (current)' : '';
      return `<option value="${s.number}"${selected}>${escapeHtml(s.title)}${current}</option>`;
    })
    .join('');
  const raisedLabel = season?.total_raised ? `${usd(season.total_raised)} raised` : '';
  const raised = season?.total_raised
    ? `<span class="artizen-chip" data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="${escapeHtml(raisedLabel)}" tabindex="0"><strong>${usd(season.total_raised)}</strong><span class="text-muted">raised</span></span>`
    : '';
  const error = boardEmpty(data);
  const tabs = error
    ? ''
    : `<nav class="artizen-pills" aria-label="Seasons">
        <a class="${tab === 'projects' ? 'active' : ''}" href="/projects${qs}">Projects (${data.projects.length})</a>
        <a class="${tab === 'funds' ? 'active' : ''}" href="/funds${qs}">Funds (${data.funds.length})</a>
        <a class="${tab === 'drives' ? 'active' : ''}" href="/drives${qs}">Drives (${data.drives.length})</a>
      </nav>`;
  const alert = error
    ? panel(`<p class="mb-0">Could not load Artizen leaderboards. Try again later or visit
        <a href="https://artizen.fund/index/leaderboard" target="_blank" rel="noopener">their leaderboard</a> directly.</p>`)
    : '';
  return panel(`
    <div class="artizen-masthead">
      ${tabs}
      <form method="get" class="artizen-toolbar">
        <label for="artizen-season" class="visually-hidden">Season</label>
        <select name="season" id="artizen-season" class="form-select artizen-season-select" onchange="this.form.submit()">${options}</select>
        ${raised}
      </form>
    </div>
  `) + alert;
}

export function namedLink(url: string, name: string): string {
  return `<a href="${escapeHtml(url)}" class="text-dark">${escapeHtml(name)}</a>`;
}

function chevron(open: boolean, hasKids: boolean): string {
  if (!hasKids) return '';
  return `<a href="#" class="artizen-tree-toggle" aria-expanded="${open}"><i class="bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'}"></i></a>`;
}

export function treeRow(opts: {
  className: string;
  id?: string;
  parent?: string;
  hidden?: boolean;
  open?: boolean;
  hasKids?: boolean;
  label: string;
  cells: string;
}): string {
  const cls = opts.hidden ? `${opts.className} artizen-tree-hidden` : opts.className;
  const attrs = [
    opts.id ? `data-id="${opts.id}"` : '',
    opts.parent ? `data-parent="${opts.parent}"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const mark = chevron(opts.open ?? false, opts.hasKids ?? false);
  return `<tr class="${cls}"${attrs ? ` ${attrs}` : ''}>
    <td>${mark}${mark ? ' ' : ''}${opts.label}</td>
    ${opts.cells}
  </tr>`;
}

export function driveBadges(drive: { multiple?: number | null; active?: boolean | null }): string {
  const multiple = drive.multiple
    ? ` <span class="badge text-bg-primary">${Math.trunc(Number(drive.multiple))}x</span>`
    : '';
  const current = drive.active ? ' <span class="badge text-bg-primary">current</span>' : '';
  return `${multiple}${current}`;
}

export function sumField<T>(rows: T[], field: keyof T): number {
  return rows.reduce((n, row) => n + (Number(row[field]) || 0), 0);
}

export function renderNotFound(): string {
  return layout({
    title: 'Not found',
    body: panel(`
      <h1>Not found</h1>
      <p class="mb-0 text-muted">That page isn’t here. Head back to the leaderboards.</p>
    `),
  });
}
