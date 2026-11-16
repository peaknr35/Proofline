// U3: AC-07, AC-20 (page part). Body checks of every 200 case in web-cases.json through renderPage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { renderPage } from '../../src/page.mjs';
import { loadStore, emptyStore } from '../../src/store.mjs';
import { FIXTURES, fixtureJson } from '../foundation/helpers.mjs';
import { bodyChecks } from '../web/checks.mjs';

const web = fixtureJson('web-cases.json');
// Only 200 answers are pages; the HEAD case's empty body is an HTTP rule, checked in tests/web.
const pageCases = web.cases.filter((c) => c.status === 200 && c.method === 'GET');

function storeFor(start) {
  return start === 'none' ? emptyStore() : loadStore(path.join(FIXTURES, 'stores', start));
}

test('AC-07/AC-20: every GET 200 body check of web-cases.json through renderPage', async (t) => {
  assert.ok(pageCases.length > 0);
  for (const c of pageCases) {
    await t.test(c.name, () => bodyChecks(c, renderPage(storeFor(c.start))));
  }
});

test('renderPage sorts each section itself (store passed unsorted, not through loadStore)', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'stores', 'valid-sections-unsorted.json'), 'utf8'));
  raw.tasks.reverse();
  const html = renderPage(raw);
  const c = web.cases.find((x) => x.name === 'each section sorted by id');
  bodyChecks(c, html);
  const shuffled = { version: 1, nextId: 30, tasks: [20, 3, 11, 1].map((id) => ({ id, title: `t${id}`, done: id % 2 === 0, createdAt: '2026-11-15T09:00:00.000Z', doneAt: id % 2 === 0 ? '2026-11-15T10:00:00.000Z' : null })) };
  const h2 = renderPage(shuffled);
  bodyChecks({ inOrder: ['<section id="open">', '<li data-id="1">', '<li data-id="3">', '<li data-id="11">', '<section id="done">', '<li data-id="20">'] }, h2);
});

test('renderPage is pure: the store is not changed', () => {
  const store = loadStore(path.join(FIXTURES, 'stores', 'valid-sections-unsorted.json'));
  store.tasks.reverse();
  const before = JSON.stringify(store);
  renderPage(store);
  assert.equal(JSON.stringify(store), before);
});

test('every title goes through escapeHtml', () => {
  const store = { version: 1, nextId: 2, tasks: [{ id: 1, title: '<i>&"\'</i>', done: true, createdAt: '2026-11-15T09:00:00.000Z', doneAt: '2026-11-15T09:00:00.000Z' }] };
  const html = renderPage(store);
  assert.ok(html.includes('<li data-id="1">&lt;i&gt;&amp;&quot;&#39;&lt;/i&gt;</li>'));
  assert.ok(!html.includes('<i>'));
});
