import type { Drive, Leaderboard } from '../artizen';
import { compactNum, delimited, fmtDate, prizeLabel, truncate, usd } from '../format';
import { board, boardEmpty, escapeHtml, layout, namedLink, pageTitle, panel } from './layout';

export function renderDrives(data: Leaderboard, seasonParam: string | null): string {
  const empty = boardEmpty(data);
  let body = '';
  let extra = '';
  if (!empty) {
    if (data.drives.length === 0) {
      body = panel('<p class="text-muted mb-0">No fund drives in this season.</p>');
    } else {
      const chartDrives = [...data.drives].sort((a, b) => (a.number || 0) - (b.number || 0));
      const labels = chartDrives.map((d) => String(d.name).replace(/ Fund Drive$/i, ''));
      const scoreCharts = (
        [
          ['Winning projects', 'artizen-project-score-chart', 'podium', ['#1ACC6C', '#7BC99A', '#C5E8D4']],
          ['Winning funds', 'artizen-fund-score-chart', 'fund_podium', ['#4C6EF5', '#8DA2F7', '#C5CFFB']],
        ] as const
      ).map(([title, id, key, colors]) => ({
        title,
        id,
        series: (['1st', '2nd', '3rd'] as const).map((place, i) => ({
          label: place,
          data: chartDrives.map((d) => d[key]?.[i]?.score ?? null),
          names: chartDrives.map((d) => d[key]?.[i]?.name ?? null),
          borderColor: colors[i],
          backgroundColor: colors[i],
        })),
      }));
      const canvases = scoreCharts
        .map(
          (chart) => `<div class="col-lg-6 mb-3">${panel(`<h2 class="artizen-panel-title">${chart.title}</h2><div class="artizen-prize-chart"><canvas id="${chart.id}"></canvas></div>`)}</div>`,
        )
        .join('');
      extra = `<script>
        document.addEventListener('DOMContentLoaded', function() {
          var compactNum = ${compactNum.toString()};
          var labels = ${JSON.stringify(labels)};
          var charts = ${JSON.stringify(scoreCharts.map((c) => ({ id: c.id, series: c.series })))};
          charts.forEach(function(chart) {
            var el = document.getElementById(chart.id);
            if (!el) return;
            new Chart(el.getContext('2d'), {
              type: 'line',
              data: {
                labels: labels,
                datasets: chart.series.map(function(s) {
                  return Object.assign({ fill: false, tension: 0.2, spanGaps: true }, s);
                })
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } },
                  tooltip: {
                    callbacks: {
                      label: function(ctx) {
                        var n = ctx.parsed.y;
                        if (n == null) return ctx.dataset.label;
                        var name = (ctx.dataset.names || [])[ctx.dataIndex];
                        var text = ctx.dataset.label;
                        if (name) text += ' · ' + name;
                        return text + ': ' + compactNum(n);
                      }
                    }
                  }
                },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true, ticks: { callback: function(v) { return compactNum(v); } } }
                }
              }
            });
          });
        });
      </script>`;
      const cards = data.drives.map((drive) => driveCard(drive)).join('');
      body = `
        <div class="row">${canvases}</div>
        <div class="row">${cards}</div>`;
    }
  }
  return layout({
    title: pageTitle(data),
    body: board(data, 'drives', seasonParam) + body,
    extra,
    chart: Boolean(extra),
    season: seasonParam,
    boards: true,
  });
}

function driveCard(drive: Drive): string {
  const img = drive.image
    ? `<img class="artizen-drive-thumb card-img-top" src="${escapeHtml(drive.image)}" alt="" loading="lazy">`
    : '';
  const multiple = drive.multiple
    ? `<span class="badge text-bg-primary artizen-badge-sm">${Math.trunc(Number(drive.multiple))}x</span>`
    : '';
  const status = drive.active
    ? '<span class="badge text-bg-primary">Active</span>'
    : `<span class="badge text-bg-secondary">${escapeHtml(drive.status)}</span>`;
  const desc = drive.description
    ? `<p class="small text-muted mb-2">${escapeHtml(truncate(String(drive.description), 140))}</p>`
    : '';
  const matchPer = drive.match_per_project
    ? `<div class="artizen-stat"><span>Match / project</span><strong>${usd(drive.match_per_project)}</strong></div>`
    : '';
  const kind = drive.active ? 'Leading' : 'Winning';
  const podiums = (
    [
      [`${kind} projects`, drive.podium, [drive.project_first, drive.project_second, drive.project_third]],
      [`${kind} funds`, drive.fund_podium, [drive.fund_first, drive.fund_second, drive.fund_third]],
    ] as const
  )
    .map(([title, podium, prizes]) => {
      if (!podium || podium.length === 0) return '';
      const rows = podium
        .map(
          (row, i) => `<tr>
            <td><span class="text-muted">${i + 1}.</span> ${namedLink(row.url, row.name)}</td>
            <td class="text-end text-nowrap">${usd(row.sales_match)}</td>
            <td class="artizen-podium-op">x</td>
            <td class="text-end text-nowrap">${delimited(row.points)}</td>
            <td class="artizen-podium-op">=</td>
            <td class="text-end text-nowrap">${compactNum(row.score)}</td>
            <td class="artizen-podium-op">→</td>
            <td class="text-end text-nowrap">${prizeLabel(prizes[i], drive.active)}</td>
          </tr>`,
        )
        .join('');
      return `<div class="artizen-nested">
        <h2 class="artizen-panel-title">${title}</h2>
        <div class="artizen-podium-scroll">
          <table class="table table-sm mb-0 artizen-podium">
            <thead><tr><th></th><th class="text-end">Raised</th><th class="artizen-podium-op">x</th><th class="text-end">Boosts</th><th class="artizen-podium-op">=</th><th class="text-end">Score</th><th class="artizen-podium-op">→</th><th class="text-end">Prize</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
    })
    .join('');
  return `<div class="col-md-6 mb-3">
    <div class="card h-100">
      ${img}
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
          <h5 class="mb-0">${escapeHtml(drive.name)} ${multiple}</h5>
          ${status}
        </div>
        <p class="small text-muted mb-2">${fmtDate(drive.start)} – ${fmtDate(drive.end, true)}</p>
        ${desc}
        <div class="artizen-stat-row">
          <div class="artizen-stat"><span>Match pot</span><strong>${usd(drive.match_pot)}</strong></div>
          <div class="artizen-stat"><span>Project prizes</span><strong>${usd(drive.prize_projects)}</strong></div>
          <div class="artizen-stat"><span>Fund prizes</span><strong>${usd(drive.prize_funds)}</strong></div>
          ${matchPer}
        </div>
        ${podiums}
      </div>
    </div>
  </div>`;
}
