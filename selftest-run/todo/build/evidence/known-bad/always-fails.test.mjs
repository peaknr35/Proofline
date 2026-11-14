// QA known-bad sample: proves scripts/test.mjs exits non-zero when a test fails. Not part of the suite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
test('known-bad: this must fail', () => { assert.equal(1, 2); });
