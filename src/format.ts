import type { ProjectRow } from './artizen';

export type Funded = ProjectRow & {
  sv: number;
  svm: number;
  vmp: number;
  multiple_v?: number;
  multiple_ex?: number;
  multiple_vme?: number;
  multiple?: number;
};

export function usd(value?: number | null, blankZero = false): string {
  if (value == null || Number.isNaN(Number(value))) return '';
  const n = Number(value);
  if (blankZero && n === 0) return '';
  const precision = Math.abs(n) >= 100 ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(n);
}

export function compactNum(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '';
  const n = Number(value);
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  let suffix = '';
  let div = 1;
  if (a >= 1_000_000_000) {
    suffix = 'b';
    div = 1_000_000_000;
  } else if (a >= 1_000_000) {
    suffix = 'm';
    div = 1_000_000;
  } else if (a >= 1_000) {
    suffix = 'k';
    div = 1_000;
  } else {
    return `${sign}${Math.round(a)}`;
  }
  const scaled = a / div;
  const text = scaled >= 100 ? String(Math.round(scaled)) : scaled.toFixed(1).replace(/\.0$/, '');
  return `${sign}${text}${suffix}`;
}

export function delimited(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '';
  return Math.round(Number(value)).toLocaleString('en-US');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, Math.max(0, length - 1)).trimEnd()}…`;
}

export function funding(row: ProjectRow): Funded {
  const sales = Number(row.sales) || 0;
  const venus = Number(row.venus) || 0;
  const match = Number(row.match) || 0;
  const prize = Number(row.prize) || 0;
  const sprint = Number(row.sprint) || 0;
  const sv = sales + venus;
  const svm = sv + match;
  const vmp = venus + match + sprint + prize;
  return {
    ...row,
    sales,
    venus,
    match,
    prize,
    sprint,
    sv,
    svm,
    vmp,
    multiple_v: sales !== 0 ? venus / sales : undefined,
    multiple_ex: sales !== 0 ? (venus + match) / sales : undefined,
    multiple_vme: sales !== 0 ? (venus + match + sprint) / sales : undefined,
    multiple: sales !== 0 ? (venus + match + sprint + prize) / sales : undefined,
    raised: row.raised == null ? sales + vmp : Number(row.raised) || 0,
  };
}

export function multipleLabel(multiple?: number): string {
  if (multiple == null || multiple === 0) return '';
  return `${multiple.toFixed(1)}x`;
}

export type MoneyFormat = 'usd' | 'x';

export type MoneyCol = {
  field: keyof Funded;
  label: string;
  as: MoneyFormat;
};

export const MONEY_COLS: readonly MoneyCol[] = [
  { field: 'sales', label: 'Sales', as: 'usd' },
  { field: 'venus', label: 'Venus', as: 'usd' },
  { field: 'sv', label: 'S+V', as: 'usd' },
  { field: 'match', label: 'Match', as: 'usd' },
  { field: 'svm', label: 'S+V+M', as: 'usd' },
  { field: 'sprint', label: 'Venus extras', as: 'usd' },
  { field: 'prize', label: 'Prize', as: 'usd' },
  { field: 'vmp', label: 'V+M+E+P', as: 'usd' },
  { field: 'multiple_v', label: 'V/S', as: 'x' },
  { field: 'multiple_ex', label: '(V+M)/S', as: 'x' },
  { field: 'multiple_vme', label: '(V+M+E)/S', as: 'x' },
  { field: 'multiple', label: '(V+M+E+P)/S', as: 'x' },
  { field: 'raised', label: 'Raised', as: 'usd' },
];

export const MONEY_INDEXES = MONEY_COLS.map((_, i) => i + 1);
export const RAISED_INDEX = MONEY_COLS.findIndex((col) => col.field === 'raised') + 1;

type MoneyRow = {
  sales?: number | null;
  venus?: number | null;
  match?: number | null;
  prize?: number | null;
  sprint?: number | null;
  raised?: number | null;
};

function funded(row: MoneyRow): Funded {
  return funding({
    name: '',
    url: '',
    sales: row.sales ?? 0,
    venus: row.venus ?? 0,
    match: row.match ?? 0,
    prize: row.prize ?? 0,
    sprint: row.sprint ?? 0,
    raised: row.raised ?? 0,
  });
}

function endCell(content: string, tag: string): string {
  return `<${tag} class="text-end">${content}</${tag}>`;
}

function projectedLabel(label: string, title = 'Projected prize — not yet earned'): string {
  if (!label) return label;
  return `<span class="artizen-prize-projected" data-bs-toggle="tooltip" data-bs-container="body" data-bs-title="${title}" tabindex="0">${label}</span>`;
}

export function prizeLabel(value?: number | null, projected = false): string {
  const label = usd(value, true);
  return projected ? projectedLabel(label) : label;
}

function moneyLabel(row: Funded, col: MoneyCol): string {
  if (col.as === 'x') return multipleLabel(row[col.field] as number | undefined);
  return usd(row[col.field] as number, true);
}

export function moneyHeaders(className = 'text-end'): string {
  return MONEY_COLS.map((col) => `<th class="${className}">${col.label}</th>`).join('');
}

export function moneyCells(row: MoneyRow, tag = 'td'): string {
  const f = funded(row);
  return MONEY_COLS.map((col) => endCell(moneyLabel(f, col), tag)).join('');
}

export function heatRanks<T extends Record<string, unknown>>(rows: T[], fields: (keyof T)[]): Record<string, number[]> {
  const heat: Record<string, number[]> = {};
  for (const field of fields) {
    const pairs = rows.map((row, i) => [i, Number(row[field]) || 0] as const);
    pairs.sort((a, b) => b[1] - a[1]);
    const ranks: number[] = new Array(rows.length);
    let lastVal: number | null = null;
    let lastRank = 0;
    pairs.forEach(([i, val], order) => {
      if (val !== lastVal) {
        lastRank = order + 1;
        lastVal = val;
      }
      ranks[i] = lastRank;
    });
    heat[String(field)] = ranks;
  }
  return heat;
}

export function rankPct(rank: number | undefined, total: number): number | undefined {
  if (!rank || total <= 0) return undefined;
  return Math.max(Math.ceil((rank / total) * 100), 1);
}

export function rankStyle(pct?: number): string {
  if (pct == null || pct <= 1) return 'background-color: #1ACC6C';
  const t = Math.log(pct) / Math.log(100);
  const r = Math.round(26 + (255 - 26) * t);
  const g = Math.round(204 + (255 - 204) * t);
  const b = Math.round(108 + (255 - 108) * t);
  return `background-color: rgb(${r},${g},${b})`;
}

export function heatTd(
  row: Record<string, unknown>,
  field: string,
  ranks: number[],
  index: number,
  total: number,
  as: 'usd' | 'x',
): string {
  const value = Number(row[field]) || 0;
  const pct = rankPct(ranks[index], total);
  const label = as === 'x' ? multipleLabel(row[field] as number | undefined) : usd(value, true);
  const note = label && pct != null ? `<br><small class="artizen-rank">${pct}%</small>` : '';
  const heat = label ? rankStyle(pct) : 'background-color: #fff';
  return `<td class="text-end artizen-heat" data-order="${value}" style="${heat}">${label}${note}</td>`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(value: unknown, withYear = false): string {
  if (value == null || value === '') return '';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTHS[d.getUTCMonth()];
  return withYear ? `${day} ${mon} ${d.getUTCFullYear()}` : `${day} ${mon}`;
}
