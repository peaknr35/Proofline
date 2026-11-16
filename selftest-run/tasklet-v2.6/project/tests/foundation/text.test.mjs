// AC-01 (titles.json), AC-02 (ids.json), AC-14 (safeText), plus parsePort and escapeHtml (SPEC 7.3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTitle, parseId, parsePort, safeText, escapeHtml } from '../../src/text.mjs';
import { TodoError, makeError } from '../../src/errors.mjs';
import { fixtureJson } from './helpers.mjs';

const titles = fixtureJson('titles.json');
const ids = fixtureJson('ids.json');

function thrown(fn) {
  try {
    fn();
  } catch (err) {
    return err;
  }
  return undefined;
}

test('AC-01: every titles.json case through normalizeTitle', async (t) => {
  assert.ok(titles.cases.length > 0);
  for (const c of titles.cases) {
    await t.test(c.name, () => {
      if (c.error) {
        const err = thrown(() => normalizeTitle(c.args));
        assert.ok(err instanceof TodoError, 'expected a TodoError');
        assert.equal(err.name, c.error);
        if (c.count !== undefined) {
          assert.equal(err.message, makeError('E_TITLE_TOO_LONG', { n: c.count }).message);
        }
      } else {
        assert.equal(normalizeTitle(c.args), c.title);
      }
    });
  }
});

test('AC-02: every ids.json case through parseId', async (t) => {
  assert.ok(ids.cases.length > 0);
  for (const c of ids.cases) {
    await t.test(JSON.stringify(c.arg), () => {
      if (c.error) {
        const err = thrown(() => parseId(c.arg));
        assert.ok(err instanceof TodoError);
        assert.equal(err.name, c.error);
      } else {
        assert.equal(parseId(c.arg), c.id);
      }
    });
  }
});

test('parsePort: 1..65535 in ^[1-9][0-9]*$ syntax, else E_USAGE_BAD_PORT', () => {
  for (const [arg, n] of [['1', 1], ['7070', 7070], ['65535', 65535]]) {
    assert.equal(parsePort(arg), n);
  }
  for (const arg of [undefined, '', '0', '65536', '070', '-1', '+1', '1e3', '0x10', ' 80', '80 ', '\uFF18\uFF10', '99999999999999999999']) {
    const err = thrown(() => parsePort(arg));
    assert.ok(err instanceof TodoError, `expected TodoError for ${JSON.stringify(arg)}`);
    assert.equal(err.name, 'E_USAGE_BAD_PORT');
  }
});

test('AC-14: safeText replaces each refused character with ?', () => {
  assert.equal(safeText('C:\\tmp\\a\u001b[31mb\nc.json'), 'C:\\tmp\\a?[31mb?c.json');
  assert.equal(safeText('/x/\u202Eevil\u2028\u0000\ud800y'), '/x/?evil???y');
  assert.equal(safeText('caf\u00e9 \ud83c\udf89 \u200d ok'), 'caf\u00e9 \ud83c\udf89 \u200d ok');
  assert.equal(safeText('plain/path.json'), 'plain/path.json');
});

test('escapeHtml maps & < > " \' and nothing else', () => {
  assert.equal(escapeHtml('<b>&"\'x</b>'), '&lt;b&gt;&amp;&quot;&#39;x&lt;/b&gt;');
  assert.equal(escapeHtml('&amp;'), '&amp;amp;');
  assert.equal(escapeHtml('caf\u00e9 \ud83c\udf89'), 'caf\u00e9 \ud83c\udf89');
});
