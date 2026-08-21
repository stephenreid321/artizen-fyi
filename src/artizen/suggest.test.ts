import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Constraint, Row } from './types';
import { rankCandidates, suggestFunds } from './suggest';

function slice(project: string, fund: string, cap = 10): Row {
  return { project, fund, 'match cap $': cap };
}

class MockBubble {
  slices: Row[];
  projects: Record<string, Row>;
  funds: Record<string, Row>;
  exts: Record<string, Row>;

  constructor(
    slices: Row[],
    projects: Record<string, Row> = {},
    funds: Record<string, Row> = {},
    exts: Record<string, Row> = {},
  ) {
    this.slices = slices;
    this.projects = projects;
    this.funds = funds;
    this.exts = exts;
  }

  async listWhereIn(_type: string, field: string, idList: unknown[], extra: Constraint[] = []): Promise<Row[]> {
    const wanted = new Set(idList.map(String));
    return this.slices.filter((row) => {
      if (!wanted.has(String(row[field] ?? ''))) return false;
      for (const constraint of extra) {
        if (constraint.constraint_type === 'greater than' && !(Number(row[constraint.key]) > Number(constraint.value))) {
          return false;
        }
      }
      return true;
    });
  }

  async indexed(type: string, idList: unknown[]): Promise<Record<string, Row>> {
    const src = type === 'fund' ? this.funds : type === 'project' ? this.projects : this.exts;
    const out: Record<string, Row> = {};
    for (const id of idList) {
      if (id == null || id === false || id === '') continue;
      const row = src[String(id)];
      if (row) out[String(id)] = { _id: String(id), ...row };
    }
    return out;
  }
}

const ocean = { id: 'ocean', name: 'Ocean DAO' };
const climate = {
  name: 'Climate Lab',
  Slug: 'climate-lab',
  active: true,
  'Extended info': 'climate-ext',
  'Funding - current': 1200,
};
const forest = { name: 'Forest Fund', Slug: 'forest', active: true };
const projects = {
  a: { Name: 'A' },
  b: { Name: 'B' },
  c: { Name: 'C' },
  d: { Name: 'D' },
};

describe('rankCandidates', () => {
  it('picks the own fund with the most shared siblings', () => {
    const siblingOwn = new Map([
      ['a', new Set(['ocean'])],
      ['b', new Set(['ocean'])],
      ['c', new Set(['forest'])],
    ]);
    const candidateSiblings = new Map([['climate', new Set(['a', 'b', 'c'])]]);
    const [row] = rankCandidates(
      [ocean, { id: 'forest', name: 'Forest Fund' }],
      siblingOwn,
      candidateSiblings,
    );
    assert.equal(row.connectingFund, 'Ocean DAO');
    assert.equal(row.sharedProjects, 2);
    assert.equal(row.total, 3);
  });
});

describe('suggestFunds', () => {
  it('returns nothing when the project has no own funds', async () => {
    const client = new MockBubble([slice('a', 'ocean')]);
    const rows = await suggestFunds(client, { projectId: 'p', ownFunds: [], excludeFundIds: [] });
    assert.deepEqual(rows, []);
  });

  it('ranks Climate Lab by Ocean DAO co-occurrence', async () => {
    const client = new MockBubble(
      [
        slice('p', 'ocean'),
        slice('a', 'ocean'),
        slice('b', 'ocean'),
        slice('c', 'ocean'),
        slice('d', 'ocean'),
        slice('a', 'climate'),
        slice('b', 'climate'),
        slice('c', 'climate'),
        slice('d', 'climate'),
      ],
      projects,
      { climate, ocean: { name: 'Ocean DAO', Slug: 'ocean', active: true } },
      { 'climate-ext': { subtitle: 'A climate fund' } },
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [ocean],
      excludeFundIds: ['ocean'],
    });
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      name: 'Climate Lab',
      url: '/funds/climate-lab',
      subtitle: 'A climate fund',
      available: 1200,
      sharedProjects: 4,
      connectingFund: 'Ocean DAO',
    });
  });

  it('excludes own matching funds and submissions', async () => {
    const client = new MockBubble(
      [slice('p', 'ocean'), slice('a', 'ocean'), slice('a', 'climate'), slice('a', 'submitted')],
      projects,
      {
        climate,
        submitted: { name: 'Already Submitted', Slug: 'submitted', active: true },
      },
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [ocean],
      excludeFundIds: ['ocean', 'submitted'],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'Climate Lab');
  });

  it('skips hidden siblings and the project itself', async () => {
    const client = new MockBubble(
      [slice('p', 'ocean'), slice('hidden', 'ocean'), slice('hidden', 'climate'), slice('p', 'climate')],
      { hidden: { Name: 'Hidden', Hide: true }, p: { Name: 'P' } },
      { climate },
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [ocean],
      excludeFundIds: ['ocean'],
    });
    assert.deepEqual(rows, []);
  });

  it('skips inactive candidate funds', async () => {
    const client = new MockBubble(
      [slice('p', 'ocean'), slice('a', 'ocean'), slice('a', 'climate')],
      projects,
      { climate: { ...climate, active: false } },
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [ocean],
      excludeFundIds: ['ocean'],
    });
    assert.deepEqual(rows, []);
  });

  it('drops slices with no match cap', async () => {
    const client = new MockBubble(
      [slice('p', 'ocean'), slice('a', 'ocean', 0), slice('a', 'climate')],
      projects,
      { climate },
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [ocean],
      excludeFundIds: ['ocean'],
    });
    assert.deepEqual(rows, []);
  });

  it('caps siblings so a huge fund cannot explode the crawl', async () => {
    const slices = [slice('p', 'ocean')];
    const many: Record<string, Row> = {};
    for (let i = 0; i < 5; i++) {
      many[`s${i}`] = { Name: `S${i}` };
      slices.push(slice(`s${i}`, 'ocean'), slice(`s${i}`, 'climate'));
    }
    const client = new MockBubble(slices, many, { climate });
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [ocean],
      excludeFundIds: ['ocean'],
      siblingCap: 2,
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].sharedProjects, 2);
  });

  it('keeps the top 6 candidates', async () => {
    const slices = [slice('p', 'ocean')];
    const funds: Record<string, Row> = {};
    for (let i = 0; i < 8; i++) {
      const pid = `s${i}`;
      const fid = `f${i}`;
      slices.push(slice(pid, 'ocean'), slice(pid, fid));
      funds[fid] = { name: `Fund ${i}`, Slug: fid, active: true };
    }
    const client = new MockBubble(
      slices,
      Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`s${i}`, { Name: `S${i}` }])),
      funds,
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [ocean],
      excludeFundIds: ['ocean'],
    });
    assert.equal(rows.length, 6);
  });

  it('omits leftover dollars when Funding - current is missing or zero', async () => {
    const client = new MockBubble(
      [slice('p', 'ocean'), slice('a', 'ocean'), slice('a', 'climate')],
      projects,
      { climate: { name: 'Climate Lab', Slug: 'climate-lab', active: true, 'Funding - current': 0 } },
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [ocean],
      excludeFundIds: ['ocean'],
    });
    assert.equal(rows[0].available, undefined);
    assert.equal(rows[0].subtitle, undefined);
  });

  it('ignores Artizen Fund for Human Creativity as an own fund', async () => {
    const human = {
      id: 'human',
      name: 'Artizen Fund for Human Creativity',
      slug: 'artizen-fund-for-human-creativity',
    };
    const client = new MockBubble(
      [
        slice('p', 'human'),
        slice('a', 'human'),
        slice('b', 'human'),
        slice('a', 'climate'),
        slice('b', 'climate'),
      ],
      projects,
      { climate, human: { name: human.name, Slug: human.slug, active: true } },
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [human],
      excludeFundIds: ['human'],
    });
    assert.deepEqual(rows, []);
  });

  it('does not crawl siblings through Human Creativity when other own funds exist', async () => {
    const human = {
      id: 'human',
      name: 'Artizen Fund for Human Creativity',
      slug: 'artizen-fund-for-human-creativity',
    };
    const client = new MockBubble(
      [
        slice('p', 'human'),
        slice('p', 'ocean'),
        slice('a', 'human'),
        slice('b', 'human'),
        slice('a', 'forest'),
        slice('b', 'forest'),
        slice('c', 'ocean'),
        slice('c', 'climate'),
      ],
      { ...projects, c: { Name: 'C' } },
      {
        climate,
        forest,
        human: { name: human.name, Slug: human.slug, active: true },
      },
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [human, ocean],
      excludeFundIds: ['human', 'ocean'],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'Climate Lab');
    assert.equal(rows[0].connectingFund, 'Ocean DAO');
    assert.equal(rows[0].sharedProjects, 1);
  });

  it('does not suggest Artizen Fund for Human Creativity as a candidate', async () => {
    const client = new MockBubble(
      [slice('p', 'ocean'), slice('a', 'ocean'), slice('a', 'human')],
      projects,
      {
        human: {
          name: 'Artizen Fund for Human Creativity',
          Slug: 'artizen-fund-for-human-creativity',
          active: true,
        },
      },
    );
    const rows = await suggestFunds(client, {
      projectId: 'p',
      ownFunds: [ocean],
      excludeFundIds: ['ocean'],
    });
    assert.deepEqual(rows, []);
  });
});
