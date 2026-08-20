import type { StatsAward, StatsPage, StatsSeasonRow, StatsTier } from '../artizen';
import { compactNum, delimited, fmtDate, usd } from '../format';
import { datatable, dtPlaceholder, escapeHtml, layout, note, panel } from './layout';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(month: string): string {
  const [year, index] = month.split('-').map(Number);
  return `${MONTHS[index - 1] || month} ${String(year).slice(2)}`;
}

function stat(label: string, value: string, hint?: string): string {
  const title = hint ? ` title="${escapeHtml(hint)}"` : '';
  return `<div class="artizen-stat"${title}><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function statRow(stats: string[]): string {
  return `<div class="artizen-stat-row artizen-stat-row-boosts mb-3">${stats.join('')}</div>`;
}

// Zero-heavy tables read better with the empty cells left empty.
function cash(value: number): string {
  return value > 0 ? usd(value) : '';
}

function artPrice(price: number): string {
  if (!(price > 0)) return '';
  return `$${price.toFixed(price < 0.001 ? 6 : 4)}`;
}

type Series = {
  label: string;
  data: number[];
  type: 'bar' | 'line';
  color: string;
  axis: 'y' | 'y1';
  money: boolean;
};

type ChartSpec = {
  id: string;
  labels: string[];
  series: Series[];
  stacked?: boolean;
};

function canvas(spec: ChartSpec): string {
  return `<div class="artizen-stats-chart"><canvas id="${spec.id}"></canvas></div>`;
}

function chartScript(specs: ChartSpec[]): string {
  return `<script>
    document.addEventListener('DOMContentLoaded', function() {
      var compactNum = ${compactNum.toString()};
      var fmt = function(n, money) { return (money ? '$' : '') + compactNum(n); };
      var specs = ${JSON.stringify(specs)};
      specs.forEach(function(spec) {
        var el = document.getElementById(spec.id);
        if (!el) return;
        new Chart(el.getContext('2d'), {
          data: {
            labels: spec.labels,
            datasets: spec.series.map(function(s) {
              return {
                type: s.type,
                label: s.label,
                data: s.data,
                yAxisID: s.axis,
                money: s.money,
                borderColor: s.color,
                backgroundColor: s.color,
                borderWidth: s.type === 'line' ? 2 : 0,
                pointRadius: 0,
                fill: false,
                tension: 0.25,
                order: s.type === 'line' ? 0 : 1
              };
            })
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
              tooltip: {
                callbacks: {
                  label: function(ctx) {
                    return ctx.dataset.label + ': ' + fmt(ctx.parsed.y, ctx.dataset.money);
                  }
                }
              }
            },
            scales: {
              x: { grid: { display: false }, stacked: !!spec.stacked, ticks: { maxRotation: 0, autoSkipPadding: 16 } },
              y: {
                beginAtZero: true,
                position: 'left',
                stacked: !!spec.stacked,
                ticks: { callback: function(v) { return fmt(v, spec.series[0].money); } }
              },
              y1: {
                beginAtZero: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { callback: function(v) { return fmt(v, spec.series[0].money); } }
              }
            }
          }
        });
      });
    });
  </script>`;
}

function tierRows(tiers: StatsTier[], issued: number): string {
  return tiers
    .map((tier) => {
      const share = issued > 0 ? tier.art / issued : 0;
      const price = tier.price == null ? 'No ceiling set' : artPrice(tier.price);
      return `<tr>
        <td>${escapeHtml(price)}</td>
        <td class="text-end">${delimited(tier.count)}</td>
        <td class="text-end">${usd(tier.usd)}</td>
        <td class="text-end">${compactNum(tier.art)}</td>
        <td class="artizen-boost-bar-cell">
          <span class="artizen-bar" title="${(share * 100).toFixed(1)}% of ART issued"><span style="width:${(share * 100).toFixed(2)}%"></span></span>
        </td>
      </tr>`;
    })
    .join('');
}

function awardRows(awards: StatsAward[]): string {
  return awards
    .map((award) => {
      const season = award.season_number == null ? '' : `Season ${award.season_number}`;
      const active = award.active ? ' <span class="badge text-bg-primary artizen-badge-sm">active</span>' : '';
      return `<tr>
        <td><a href="${escapeHtml(award.url)}" class="text-dark" target="_blank" rel="noopener">${escapeHtml(award.name)}</a>${active}</td>
        <td>${escapeHtml(award.type)}</td>
        <td>${escapeHtml(season)}</td>
        <td class="text-end" data-order="${award.projects}">${cash(award.projects)}</td>
        <td class="text-end" data-order="${award.funds}">${cash(award.funds)}</td>
        <td class="text-end" data-order="${award.match}">${cash(award.match)}</td>
        <td class="text-end" data-order="${award.awarded}">${cash(award.awarded)}</td>
        <td class="text-end" data-order="${award.total}">${cash(award.total)}</td>
      </tr>`;
    })
    .join('');
}

function seasonRows(seasons: StatsSeasonRow[]): string {
  return seasons
    .map((season) => {
      const current = season.current ? ' <span class="badge text-bg-primary artizen-badge-sm">current</span>' : '';
      return `<tr>
        <td><a href="/projects?season=${season.number}" class="text-dark">${escapeHtml(season.title)}</a>${current}</td>
        <td class="text-end">${cash(season.raised)}</td>
        <td class="text-end">${cash(season.sales)}</td>
        <td class="text-end">${cash(season.match)}</td>
        <td class="text-end">${cash(season.prize)}</td>
        <td class="text-end">${cash(season.venus)}</td>
        <td class="text-end">${cash(season.funds)}</td>
        <td class="text-end">${cash(season.endowment + season.fees)}</td>
        <td class="text-end">${season.art > 0 ? compactNum(season.art) : ''}</td>
      </tr>`;
    })
    .join('');
}

export function renderStats(data: StatsPage): string {
  if (data.error && data.seasons.length === 0) {
    return layout({
      title: 'Stats · artizen.fyi',
      body: panel(
        `<h1>Stats</h1>
        <p class="mb-0">Could not load platform stats. Try again later or visit
          <a href="https://artizen.fund" target="_blank" rel="noopener">artizen.fund</a> directly.</p>`,
      ),
      stats: true,
    });
  }

  const { endowment, art, spend, users } = data;
  const raised = data.seasons.reduce((total, season) => total + season.raised, 0);
  const monthLabels = endowment.months.map((month) => monthLabel(month.month));
  const userLabels = users.months.map((month) => monthLabel(month.month));

  const charts: ChartSpec[] = [];
  if (endowment.months.length > 0) {
    charts.push({
      id: 'artizen-endowment-chart',
      stacked: true,
      labels: monthLabels,
      series: [
        { label: 'Contributions', data: endowment.months.map((m) => m.usd), type: 'bar', color: '#1ACC6C', axis: 'y', money: true },
        { label: 'Sales fee', data: endowment.months.map((m) => m.fees), type: 'bar', color: '#4C6EF5', axis: 'y', money: true },
        { label: 'Cumulative', data: endowment.months.map((m) => m.total_usd), type: 'line', color: '#101212', axis: 'y1', money: true },
      ],
    });
    charts.push({
      id: 'artizen-art-chart',
      labels: monthLabels,
      series: [
        { label: 'ART issued', data: endowment.months.map((m) => m.art), type: 'bar', color: '#4C6EF5', axis: 'y', money: false },
        { label: 'Cumulative', data: endowment.months.map((m) => m.total_art), type: 'line', color: '#101212', axis: 'y1', money: false },
      ],
    });
  }
  if (users.months.length > 0) {
    charts.push({
      id: 'artizen-users-chart',
      labels: userLabels,
      series: [
        { label: 'New accounts', data: users.months.map((m) => m.signups), type: 'bar', color: '#8690A0', axis: 'y', money: false },
        { label: 'Cumulative', data: users.months.map((m) => m.total), type: 'line', color: '#101212', axis: 'y1', money: false },
      ],
    });
  }
  const chartById = Object.fromEntries(charts.map((spec) => [spec.id, spec]));
  const draw = (id: string) => (chartById[id] ? canvas(chartById[id]) : '');

  const headline = panel(`
    <h1>Stats</h1>
    ${statRow([
      stat('Users', delimited(users.accounts), `${delimited(users.wallets)} with a wallet`),
      stat('Raised all time', usd(raised), 'Sum of every season total'),
      stat('Endowment in', usd(endowment.total), `${usd(endowment.contributed)} contributed, ${usd(endowment.fees)} from sales`),
      stat('ART issued', compactNum(art.issued), `${delimited(art.issued)} ART`),
      stat('Endowment out', usd(spend.total), 'Prizes, match boosts and Venus Artifact buys'),
    ])}
    ${note(
      `Everything here is aggregated from the public Artizen API and refreshed hourly. Money into the endowment is
      confirmed contributions plus the 10% fee on Artifact sales; money out is prizes awarded on fund drives and
      sprints, match boost pots, and Artifacts bought by the Venus house account.`,
    )}
  `);

  const endowmentPanel = panel(`
    <h2 class="artizen-panel-title">Endowment</h2>
    ${statRow([
      stat('Total in', usd(endowment.total)),
      stat('Contributions', usd(endowment.contributed), `${delimited(endowment.contributions)} gifts from ${delimited(endowment.contributors)} contributors`),
      stat('Sales fee', usd(endowment.fees), `10% of ${usd(endowment.fee_sales)} in Artifact sales`),
      stat('Median gift', usd(endowment.median), `Mean ${usd(endowment.average)}`),
      stat('Largest gift', usd(endowment.largest)),
    ])}
    ${draw('artizen-endowment-chart')}
    ${note(
      `Two streams feed the endowment: direct contributions, and a 10% fee on Artifact sales. The fee is read from
      the ${delimited(endowment.fee_purchases)} purchases that booked one, covering ${usd(endowment.fee_sales)} of sales.
      Admin-entered sales carry no fee, so they are not counted here.`,
    )}
    <p class="small text-muted mb-0">First contribution ${fmtDate(endowment.first_at, true)}, most recent ${fmtDate(endowment.last_at, true)}.</p>
  `);

  const spendPanel = panel(`
    <h2 class="artizen-panel-title">Endowment out</h2>
    ${statRow([
      stat('Total out', usd(spend.total)),
      stat('Drive prizes', usd(spend.prizes_total), `${usd(spend.prizes_projects)} to projects, ${usd(spend.prizes_funds)} to funds, across ${delimited(spend.prize_winners)} winners`),
      stat('Sprint prizes', usd(spend.sprint_prizes), 'Advertised sales-sprint pots'),
      stat('Match boosts', usd(spend.match_boosts)),
      stat('Venus buys', usd(spend.venus_buys), `${delimited(spend.venus_purchases)} purchases, ${delimited(spend.venus_artifacts)} Artifacts`),
    ])}
    ${note(
      `Fund-drive prizes are what participants actually earned, not the advertised pots. Sales sprints book no payout
      record, so their advertised pots stand in. Venus — the Artizen house account — has bought ${usd(spend.venus_buys)}
      of Artifacts since ${fmtDate(spend.venus_first_at, true)}, unlocking a further ${usd(spend.venus_match)} of match;
      that is endowment money reaching projects as sales. Match funding of ${usd(spend.match_unlocked)} has also been
      unlocked overall, but it comes from sponsor matching funds rather than the endowment, so it is not counted here.`,
    )}
    ${dtPlaceholder()}
    <table id="artizen-awards-table" class="table table-sm">
      <thead><tr>
        <th>Boost</th>
        <th>Type</th>
        <th>Season</th>
        <th class="text-end">Project prizes</th>
        <th class="text-end">Fund prizes</th>
        <th class="text-end">Match pot</th>
        <th class="text-end">Awarded</th>
        <th class="text-end">Total</th>
      </tr></thead>
      <tbody>${awardRows(spend.awards)}</tbody>
    </table>
  `);

  const artPanel = panel(`
    <h2 class="artizen-panel-title">ART token</h2>
    ${statRow([
      stat('ART issued', compactNum(art.issued), `${delimited(art.issued)} ART`),
      stat('Average price', artPrice(art.price), 'Dollars paid per ART issued'),
      stat('Ceiling price', artPrice(art.ceiling), 'Most recent ceiling price on an ART buy'),
      stat('Holders', delimited(art.holders), 'Accounts that have received ART'),
      stat('Issuing buys', delimited(art.contributions)),
    ])}
    ${draw('artizen-art-chart')}
    <div class="artizen-nested">
      <h3 class="artizen-panel-title">By ceiling price</h3>
      <table class="table table-sm mb-0 artizen-boost-dist">
        <thead><tr><th>Ceiling</th><th class="text-end">Buys</th><th class="text-end">Paid</th><th class="text-end">ART</th><th></th></tr></thead>
        <tbody>${tierRows(art.tiers, art.issued)}</tbody>
      </table>
    </div>
  `);

  const usersPanel = panel(`
    <h2 class="artizen-panel-title">Users</h2>
    ${statRow([
      stat('Accounts', delimited(users.accounts)),
      stat('With a wallet', delimited(users.wallets)),
      stat('Named', delimited(users.named)),
      stat('Boost holders', delimited(users.holders), `${compactNum(users.points)} unspent boosts`),
      stat('Pro subscriptions', delimited(users.pro)),
    ])}
    ${draw('artizen-users-chart')}
    <p class="small text-muted mb-0">Account creation is read from the Artizen record id, so the series starts in May 2024.
    The August 2024 spike is a bulk import rather than organic signups.</p>
  `);

  const checkRows: Array<[string, string, string, string]> = [
    [
      'Endowment in',
      usd(endowment.total),
      'endowmentcontribution + the endowment fee on transaction',
      'https://artizen.fund/index/endowment',
    ],
    [
      'Endowment out',
      usd(spend.total),
      'boostparticipant prizes, boost pots, Venus Artifact buys',
      'https://artizen.fund/index/endowment',
    ],
    [
      'ART issued',
      `${compactNum(art.issued)} ART`,
      'ART received on endowmentcontribution',
      'https://artizen.fund/index/endowment',
    ],
    [
      'Venus buys',
      usd(spend.venus_buys),
      'confirmed transaction rows bought by the Venus account',
      'https://artizen.fund/index/profile/1774215063859x668765896046542800',
    ],
    ['Raised all time', usd(raised), 'total raised usd on season', 'https://artizen.fund/index/leaderboard'],
    ['Users', delimited(users.accounts), 'useraccount records', ''],
  ];
  const crossCheck = panel(`
    <h2 class="artizen-panel-title">Cross-check</h2>
    ${note(
      `Each headline figure, the API records behind it, and where to check it on artizen.fund. ART issued counts every
      token the endowment has ever minted, so it reads higher than the ART pool shown on the endowment page — the
      difference is ART that has since left the endowment.`,
    )}
    <div class="artizen-table-scroll">
      <table class="table table-sm mb-0">
        <thead><tr><th>Figure</th><th class="text-end">artizen.fyi</th><th>Built from</th><th>Check against</th></tr></thead>
        <tbody>${checkRows
          .map(
            ([label, value, source, url]) => `<tr>
              <td>${escapeHtml(label)}</td>
              <td class="text-end text-nowrap">${escapeHtml(value)}</td>
              <td class="small text-muted">${escapeHtml(source)}</td>
              <td class="small">${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">artizen.fund</a>` : ''}</td>
            </tr>`,
          )
          .join('')}</tbody>
      </table>
    </div>
  `);

  const seasonsPanel = panel(`
    <h2 class="artizen-panel-title">Seasons</h2>
    <div class="artizen-table-scroll">
      <table class="table table-sm mb-0">
        <thead><tr>
          <th>Season</th>
          <th class="text-end">Raised</th>
          <th class="text-end">Sales</th>
          <th class="text-end">Match</th>
          <th class="text-end">Prize</th>
          <th class="text-end">Venus</th>
          <th class="text-end">Into funds</th>
          <th class="text-end">Into endowment</th>
          <th class="text-end">ART</th>
        </tr></thead>
        <tbody>${seasonRows(data.seasons)}</tbody>
      </table>
    </div>
  `);

  return layout({
    title: 'Stats · artizen.fyi',
    description: 'Platform-wide Artizen stats: endowment flows, ART issuance and user growth',
    body: headline + endowmentPanel + spendPanel + artPanel + usersPanel + seasonsPanel + crossCheck,
    extra: chartScript(charts) + datatable('artizen-awards-table', [[7, 'desc']], [3, 4, 5, 6, 7], { paging: false, info: false }),
    chart: charts.length > 0,
    datatables: true,
    stats: true,
  });
}
