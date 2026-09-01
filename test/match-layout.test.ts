import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderMatch } from '../src/html/match';

const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const client = readFileSync(new URL('../src/client/match-client.ts', import.meta.url), 'utf8');

describe('matching layout', () => {
  it('reserves one shared grid track for both project-source panels', () => {
    const html = renderMatch();

    expect(html).toContain('class="artizen-match-source-panels"');
    expect(html).toContain(
      'data-source-panel="describe" aria-labelledby="describe-project-title" aria-hidden="true" inert',
    );
    expect(styles).toMatch(/\.artizen-match-source-panels\s*\{[^}]*display:\s*grid;/);
    expect(styles).toMatch(/\[data-source-panel\]\s*\{[^}]*grid-area:\s*1 \/ 1;/);
    expect(styles).toMatch(/\[data-source-panel\]\[aria-hidden="true"\]\s*\{[^}]*visibility:\s*hidden;/);
    expect(client).toContain("panel.toggleAttribute('inert', !active)");
    expect(client).toContain("panel.setAttribute('aria-hidden', 'true')");
  });

  it('keeps fund names to one line and adds fast accessible tooltips only for overflow', () => {
    const headingRule = styles.match(/\.artizen-match-card h3\s*\{([^}]*)\}/)?.[1] || '';

    expect(headingRule).toContain('text-overflow: ellipsis');
    expect(headingRule).toContain('white-space: nowrap');
    expect(headingRule).not.toContain('line-clamp');
    expect(styles).not.toContain('.artizen-match-card-title h3');
    expect(client).toContain('link.dataset.fundName = fund.name');
    expect(client).toContain('link.scrollWidth > link.clientWidth');
    expect(client).toContain('const TOOLTIP_DELAY_MS = 100');
    expect(client).toContain("element.removeAttribute('title')");
    expect(client).toContain('element.dataset.tooltip = message');
    expect(styles).toMatch(/\.artizen-tooltip\s*\{[^}]*position:\s*fixed;/);
    expect(renderMatch()).not.toContain('data-filter-new aria-pressed="false" title=');
    expect(renderMatch()).toContain('data-filter-new aria-pressed="false" data-tooltip=');
  });

  it('labels baseline-only results when prepared semantic assets fail', () => {
    expect(client).toContain('Baseline only — prepared semantic matching did not load.');
    expect(client).toContain('These are baseline word-and-facet results, not the full semantic ranking.');
    expect(styles).toMatch(/\.artizen-ai-note-warning\s*\{[^}]*background:/);
  });

  it('uses Moss for relationship history so the card stays one green', () => {
    expect(styles).not.toContain('--lavender');
    expect(styles).toMatch(/\.artizen-fit-strong\s*\{[^}]*background:\s*var\(--green-deep\);/);
    expect(styles).toMatch(/\.artizen-known-relationship\s*\{[^}]*color:\s*#fff;/);
    expect(styles).toMatch(/\.artizen-known-relationship\s*\{[^}]*background:\s*var\(--green-deep\);/);
  });
});
