// Rule 8: a check is trusted only after it has been seen to fail on a known-bad sample.
// Each test copies the kit, breaks exactly one thing, and asserts that exactly the
// matching check fails while every other check still passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runChecks } from './check-kit.mjs';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['.git', 'node_modules', path.join('templates', 'five-agent-build')]);
const TEXT = /\.(md|json|txt|mjs)$/; // selftest-run is copied as text only: the kit links to its records

function copyKit() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proofline-kit-'));
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(KIT, rel), { withFileTypes: true })) {
      const r = path.join(rel, e.name);
      if (SKIP.has(r) || e.name.endsWith('.pdf')) continue;
      if (r.startsWith('selftest-run') && e.isFile() && !TEXT.test(e.name)) continue;
      if (e.isDirectory()) { fs.mkdirSync(path.join(dir, r), { recursive: true }); walk(r); }
      else fs.copyFileSync(path.join(KIT, r), path.join(dir, r));
    }
  };
  walk('');
  return dir;
}

function change(dir, rel, fn) {
  const p = path.join(dir, rel);
  fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')));
}

function failing(dir) {
  return runChecks(dir).filter((r) => !r.ok).map((r) => r.id);
}

test('the kit as it is passes every check', () => {
  const dir = copyKit();
  try { assert.deepEqual(failing(dir), []); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

const BREAKS = [
  ['K1', 'a README that states a different version', (d) => change(d, 'README.md', (s) => s.replace(/(Status, plainly\.\*\* )v[\d.]+/, '$1v9.9'))],
  ['K2', 'a self-test check removed without updating the README', (d) => change(d, 'KIT-SELFTEST.md', (s) => s.split('\n').filter((l) => !l.startsWith('| 20 |')).join('\n'))],
  ['K3', 'a compact prompt that grew past its stated length', (d) => change(d, 'COMPACT-PROMPT.txt', (s) => s.trim() + ' Also remember to be thorough and careful in all things at every single step.')],
  ['K4', 'a link to a template that does not exist', (d) => change(d, 'README.md', (s) => s + '\nSee `templates/NOT-A-FILE.md`.\n')],
  ['K5', 'a rule dropped from its kind', (d) => change(d, 'SKILL.md', (s) => s.replace('(rules 1, 4, 5, 6, 7, 10, 11, 17)', '(rules 1, 4, 5, 6, 7, 10, 11)'))],
  ['K6', 'a companion skill with the wrong name', (d) => change(d, 'skills/proofline-plan/SKILL.md', (s) => s.replace('name: proofline-plan', 'name: workflow-plan'))],
  ['K7', 'an old name back in a prompt', (d) => change(d, 'UNIVERSAL-PROMPT.md', (s) => s + '\nUse five-agent-build.\n')],
  ['K8', 'a core rule reworded out of the compact prompt', (d) => change(d, 'COMPACT-PROMPT.txt', (s) => s.replace('SELF-REVIEW', 'SOLO-REVIEW'))],
  ['K9', 'a status missing from the handoff template', (d) => change(d, 'templates/HANDOFF-TEMPLATE.md', (s) => s.replace(' · `dropped`', ''))],
  ['K10', 'an agent that lost its hard rules', (d) => change(d, 'agents/proofline-researcher.md', (s) => s.replace('## Hard rules', '## Rules'))],
];

for (const [id, what, breakIt] of BREAKS) {
  test(`${id} fails on ${what}, and nothing else does`, () => {
    const dir = copyKit();
    try {
      breakIt(dir);
      assert.deepEqual(failing(dir), [id]);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
}
