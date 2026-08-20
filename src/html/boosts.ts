import type { BoostsPage } from '../artizen';
import { compactNum, delimited } from '../format';
import { datatable, dtPlaceholder, escapeHtml, layout, panel } from './layout';

function pct(share: number): string {
  const p = share * 100;
  if (p >= 10) return `${p.toFixed(1)}%`;
  if (p >= 1) return `${p.toFixed(2)}%`;
  return `${p.toFixed(3)}%`;
}

function stat(label: string, value: string, hint?: string): string {
  const title = hint ? ` title="${escapeHtml(hint)}"` : '';
  return `<div class="artizen-stat"${title}><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

export function renderBoosts(boosts: BoostsPage): string {
  const failed = boosts.error && boosts.top.length === 0;
  let body = '';
  let extra = '';
  if (failed) {
    body = panel(
      `<h1>Boosts</h1>
      <p class="mb-0">Could not load remaining boosts. Try again later or visit
        <a href="https://artizen.fund" target="_blank" rel="noopener">artizen.fund</a> directly.</p>`,
    );
  } else {
    const rows = boosts.top
      .map((holder) => {
        const avatar = holder.image
          ? `<img class="artizen-holder-avatar" src="${escapeHtml(holder.image)}" alt="" loading="lazy">`
          : '<span class="artizen-holder-avatar artizen-holder-avatar-empty" aria-hidden="true"></span>';
        const admin = holder.admin ? ' <span class="badge text-bg-secondary artizen-badge-sm">admin</span>' : '';
        return `<tr>
          <td>
            <span class="artizen-holder">${avatar}<strong>${escapeHtml(holder.name)}</strong>${admin}</span>
          </td>
          <td class="text-end" data-order="${holder.points}">${delimited(holder.points)}</td>
          <td class="text-end" data-order="${holder.share}">${pct(holder.share)}</td>
          <td class="text-end" data-order="${holder.cumulative}">${pct(holder.cumulative)}</td>
        </tr>`;
      })
      .join('');
    const dist = boosts.buckets
      .map((bucket) => {
        const share = boosts.remaining > 0 ? bucket.points / boosts.remaining : 0;
        return `<tr>
          <td>${escapeHtml(bucket.label)}</td>
          <td class="text-end">${delimited(bucket.users)}</td>
          <td class="text-end">${delimited(bucket.points)}</td>
          <td class="artizen-boost-bar-cell">
            <span class="artizen-bar" title="${pct(share)} of remaining"><span style="width:${(share * 100).toFixed(2)}%"></span></span>
          </td>
        </tr>`;
      })
      .join('');
    const stats = `
      <div class="artizen-stat-row artizen-stat-row-boosts mb-3">
        ${stat('Remaining', delimited(boosts.remaining), `${compactNum(boosts.remaining)} unspent boosts`)}
        ${stat('Holders', delimited(boosts.holders), `${delimited(boosts.accounts)} accounts, ${delimited(boosts.zero)} empty`)}
        ${stat('Median', delimited(boosts.median))}
        ${stat('Mean', compactNum(boosts.mean))}
        ${stat('Top 100', pct(boosts.top_share), `${delimited(boosts.top_points)} of remaining`)}
      </div>`;
    body = panel(`
      <h1>Boosts</h1>
      ${stats}
      <div class="artizen-nested mb-3">
        <h2 class="artizen-panel-title">Distribution</h2>
        <table class="table table-sm mb-0 artizen-boost-dist">
          <thead><tr><th>Balance</th><th class="text-end">Users</th><th class="text-end">Boosts</th><th></th></tr></thead>
          <tbody>${dist}</tbody>
        </table>
      </div>
      ${dtPlaceholder()}
      <table id="artizen-boosts-table" class="table table-sm">
        <thead><tr>
          <th>Holder</th>
          <th class="text-end">Boosts</th>
          <th class="text-end">Share</th>
          <th class="text-end">Cumulative</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
    extra = datatable('artizen-boosts-table', [[1, 'desc']], [1, 2, 3], {
      paging: false,
      info: false,
      noun: 'holders',
    });
  }
  return layout({
    title: 'Boosts · artizen.fyi',
    description: 'Unspent Artizen boosts: remaining supply and the top 100 holders',
    body,
    extra,
    datatables: Boolean(extra),
    boosts: true,
  });
}
