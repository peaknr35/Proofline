// Body checks of web-cases.json, shared by tests/page and tests/web (not a test file).
import assert from 'node:assert/strict';

function count(haystack, needle) {
  let n = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) n += 1;
  return n;
}

export function bodyChecks(c, body, sub = (s) => s) {
  if (c.body !== undefined) assert.equal(body, sub(c.body), 'body');
  for (const s of c.mustContain ?? []) assert.ok(body.includes(sub(s)), `body contains ${JSON.stringify(s)}`);
  for (const s of c.mustNotContain ?? []) assert.ok(!body.includes(sub(s)), `body lacks ${JSON.stringify(s)}`);
  for (const r of c.mustNotMatch ?? []) assert.ok(!new RegExp(r).test(body), `body does not match /${r}/`);
  for (const [s, n] of Object.entries(c.countOf ?? {})) assert.equal(count(body, s), n, `count of ${JSON.stringify(s)}`);
  if (c.inOrder) {
    let at = -1;
    for (const s of c.inOrder) {
      const i = body.indexOf(sub(s), at + 1);
      assert.ok(i > at, `${JSON.stringify(s)} appears after the previous item`);
      at = i;
    }
  }
}
