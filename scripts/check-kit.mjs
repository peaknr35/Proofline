#!/usr/bin/env node
// Checks the Proofline kit's own text for the drift a person misses: versions that
// disagree, counts that went stale, links to files that do not exist, a rule with no
// class, a core rule missing from one prompt form. Node only, no dependencies.
//
//   node scripts/check-kit.mjs            run every check, exit 1 on any failure
//   node --test scripts/check-kit.test.mjs  prove each check fails on a broken copy
//
// Rule 8 of the kit applies to this file too: every check here has a test in
// check-kit.test.mjs that breaks one thing and shows this check failing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const COMPACT_BUDGET = 1250; // characters; the short instruction boxes this prompt is for

// Skill folders and the name each must carry. The root folder is proofline-build.
export const SKILLS = {
  '.': 'proofline-build',
  'skills/proofline-plan': 'proofline-plan',
  'skills/proofline-audit': 'proofline-audit',
  'skills/proofline-runtime': 'proofline-runtime',
};
const OLD_NAMES = ['five-agent-build', 'workflow-orchestration', 'agent-team-audit', 'agent-runtime-design'];

// Rules every prompt form must state. A short form may word them differently, so each
// file has its own pattern. Add a row when a rule must never fall out of a prompt.
export const CORE = [
  { rule: 'unrun is NOT RUN', skill: /NOT RUN/, universal: /NOT RUN/, compact: /NOT RUN/ },
  { rule: 'no fresh QA is SELF-REVIEW', skill: /SELF-REVIEW/, universal: /SELF-REVIEW/, compact: /SELF-REVIEW/ },
  { rule: 'missing evidence abstains', skill: /abstain/i, universal: /abstain/i, compact: /abstain/i },
  { rule: 'two repairs per failed gate', skill: /two repairs/i, universal: /two repairs/i, compact: /two repairs/i },
  { rule: 'consequential actions need their own confirmation', skill: /separate, action-specific human confirmation/, universal: /separate confirmation/i, compact: /separate confirmation/i },
  { rule: 'contract approved before code', skill: /approved before implementation/, universal: /explicit approval/, compact: /wait for approval/i },
  { rule: 'a silent contract is not permission', skill: /silent contract is not permission/i, universal: /silent contract is not permission/i, compact: /do not guess/i },
  { rule: 'stop by impact', skill: /stop by impact/i, universal: /stop by impact/i, compact: /stop by impact/i },
  { rule: 'speak only when a person must act or can use a result', skill: /must act or can use a result/i, universal: /must act or can use a result/i, compact: /must act or can use/i },
  { rule: 'never ask for a secret in chat', skill: /never ask for a secret/i, universal: /never ask .*for a secret/i, compact: /no secrets in chat/i },
  // compact: null means the short form cannot carry this rule; the other two forms must still state it.
  { rule: 'the spec gate is under the repair cap', skill: /spec gate is a gate under the repair cap/i, universal: /spec gate is under the repair cap/i, compact: /two repairs per failed gate/i },
  { rule: 'later gate runs verify, they do not re-probe', skill: /every later run is a verification run/i, universal: /every run after the first is a verification run/i, compact: null },
  { rule: 'approval recorded outside the contract', skill: /build\/APPROVAL\.md/, universal: /build\/APPROVAL\.md/, compact: null },
];

const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');
const exists = (root, rel) => fs.existsSync(path.join(root, rel));
const chars = (s) => [...s].length;

function section(text, heading) {
  const start = text.indexOf(heading);
  if (start < 0) return '';
  const rest = text.slice(start + heading.length);
  const next = rest.search(/\n## /);
  return next < 0 ? rest : rest.slice(0, next);
}

function kitFiles(root) {
  const out = ['SKILL.md', 'README.md', 'UNIVERSAL-PROMPT.md', 'KIT-SELFTEST.md'];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const r = path.posix.join(rel, e.name);
      if (e.isDirectory()) { if (r !== 'templates/five-agent-build') walk(r); }
      else if (e.name.endsWith('.md')) out.push(r);
    }
  };
  for (const d of ['templates', 'library', 'skills']) if (exists(root, d)) walk(d);
  return out;
}

// ---- the checks. Each returns a list of problems; an empty list is a pass.

function versions(root) {
  const found = {
    'SKILL.md title': read(root, 'SKILL.md').match(/^# .*\((v[\d.]+) candidate\)/m)?.[1],
    'UNIVERSAL-PROMPT.md title': read(root, 'UNIVERSAL-PROMPT.md').match(/^# .*\((v[\d.]+) candidate\)/m)?.[1],
    'README.md skill table': read(root, 'README.md').match(/^\| `proofline-build`.*\| (v[\d.]+) candidate/m)?.[1],
    'README.md status': read(root, 'README.md').match(/Status, plainly\.\*\* (v[\d.]+) is a candidate/)?.[1],
  };
  // The README title may leave the version out; if it carries one, it must agree too.
  const readmeTitle = read(root, 'README.md').match(/^# .*\((v[\d.]+) candidate\)/m)?.[1];
  if (readmeTitle) found['README.md title'] = readmeTitle;
  const values = new Set(Object.values(found));
  if (values.size === 1 && !values.has(undefined)) return [];
  return [Object.entries(found).map(([k, v]) => `${k}: ${v ?? 'none'}`).join(' · ')];
}

function selftestCount(root) {
  const t = read(root, 'KIT-SELFTEST.md');
  const table = section(t, '## Pass/fail checks');
  const nums = [...table.matchAll(/^\| (\d+) \|/gm)].map((m) => Number(m[1]));
  const problems = [];
  nums.forEach((n, i) => { if (n !== i + 1) problems.push(`check numbers are not 1..N in order: found ${n} at position ${i + 1}`); });
  const n = nums.length;
  const readme = read(root, 'README.md');
  if (!readme.includes(`A ${n}-point test`)) problems.push(`README does not say "A ${n}-point test"`);
  if (!readme.includes(`all ${n} checks`)) problems.push(`README does not say "all ${n} checks"`);
  const gates = section(t, 'Mandatory gates:').split('\n- ')[0];
  for (const m of gates.matchAll(/^\|[^|\n]+\| ([\d, ]+) \|$/gm)) {
    for (const g of m[1].split(',').map((s) => Number(s.trim()))) if (g > n || g < 1) problems.push(`a mandatory gate names check ${g}, which does not exist`);
  }
  return problems;
}

function compactLength(root) {
  const len = chars(read(root, 'COMPACT-PROMPT.txt').trim());
  const problems = [];
  if (len > COMPACT_BUDGET) problems.push(`${len} characters, over the budget of ${COMPACT_BUDGET}`);
  const stated = read(root, 'README.md').match(/About ([\d,]+) characters/)?.[1];
  if (!stated) problems.push('README does not state the compact prompt length');
  else if (Math.abs(Number(stated.replace(/,/g, '')) - len) > 10) problems.push(`README says about ${stated} characters; it is ${len}`);
  return problems;
}

function paths(root) {
  const problems = [];
  const re = /`((?:templates|library|skills|scripts|selftest-run)\/[^`<>*\s]+?\.(?:md|mjs|txt|json))`/g;
  for (const f of kitFiles(root)) {
    for (const m of read(root, f).matchAll(re)) if (!exists(root, m[1])) problems.push(`${f} points at ${m[1]}, which does not exist`);
  }
  return problems;
}

function ruleClasses(root) {
  const t = read(root, 'SKILL.md');
  const rules = [...section(t, '## Rules that always hold').matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
  const ev = section(t, '## Evidence discipline');
  const seen = new Map();
  for (const kind of ['Safety requirement', 'Correctness invariant', 'Performance hypothesis']) {
    const list = ev.match(new RegExp(`\\*\\*${kind}\\*\\* \\(rules? ([\\d, ]+)`))?.[1];
    if (!list) return [`Evidence discipline has no rule list for "${kind}"`];
    for (const n of list.split(',').map((s) => Number(s.trim())).filter(Boolean)) seen.set(n, [...(seen.get(n) || []), kind]);
  }
  const problems = [];
  for (const r of rules) {
    const k = seen.get(r) || [];
    if (k.length === 0) problems.push(`rule ${r} has no kind (safety, correctness or performance)`);
    if (k.length > 1) problems.push(`rule ${r} is listed as ${k.join(' and ')}`);
  }
  for (const n of seen.keys()) if (!rules.includes(n)) problems.push(`Evidence discipline names rule ${n}, which does not exist`);
  return problems;
}

function frontmatter(root) {
  const problems = [];
  for (const [dir, name] of Object.entries(SKILLS)) {
    const rel = path.posix.join(dir, 'SKILL.md');
    if (!exists(root, rel)) { problems.push(`${rel} is missing`); continue; }
    const fm = read(root, rel).match(/^---\n([\s\S]*?)\n---\n/)?.[1];
    if (!fm) { problems.push(`${rel} has no front matter`); continue; }
    const got = fm.match(/^name:\s*(.+)$/m)?.[1]?.trim();
    if (got !== name) problems.push(`${rel} is named ${got}, expected ${name}`);
    const desc = fm.match(/^description:\s*(.+)$/m)?.[1] ?? '';
    if (chars(desc) < 80) problems.push(`${rel} description is missing or too thin`);
    if (chars(desc) > 1024) problems.push(`${rel} description is ${chars(desc)} characters, over 1024`);
  }
  return problems;
}

function oldNames(root) {
  const files = ['UNIVERSAL-PROMPT.md', 'COMPACT-PROMPT.txt', ...kitFiles(root).filter((f) => f.startsWith('templates/') || f.startsWith('skills/'))];
  const problems = [];
  for (const f of files) for (const n of OLD_NAMES) if (read(root, f).includes(n)) problems.push(`${f} still says ${n}`);
  return problems;
}

function coreRules(root) {
  const text = { skill: read(root, 'SKILL.md'), universal: read(root, 'UNIVERSAL-PROMPT.md'), compact: read(root, 'COMPACT-PROMPT.txt') };
  const problems = [];
  for (const c of CORE) for (const form of ['skill', 'universal', 'compact']) if (c[form] && !c[form].test(text[form])) problems.push(`${form} prompt does not state: ${c.rule}`);
  return problems;
}

function statuses(root) {
  const words = (line) => new Set([...(line || '').matchAll(/`([a-z]+)`/g)].map((m) => m[1]));
  const inSkill = words(read(root, 'SKILL.md').split('\n').find((l) => l.includes('**Status vocabulary**')));
  const inHandoff = words(read(root, 'templates/HANDOFF-TEMPLATE.md').split('\n').find((l) => l.startsWith('Status:')));
  if (inSkill.size === 0) return ['SKILL.md has no **Status vocabulary** line'];
  if (inHandoff.size === 0) return ['HANDOFF-TEMPLATE.md has no Status: line'];
  const a = [...inSkill].sort().join(' '), b = [...inHandoff].sort().join(' ');
  return a === b ? [] : [`SKILL.md says ${a}; the handoff template says ${b}`];
}

export const CHECKS = [
  ['K1', 'one version everywhere', versions],
  ['K2', 'self-test count agrees', selftestCount],
  ['K3', 'compact prompt fits and its length is stated right', compactLength],
  ['K4', 'every path the kit names exists', paths],
  ['K5', 'every rule has exactly one kind', ruleClasses],
  ['K6', 'skill names and descriptions', frontmatter],
  ['K7', 'no old names in prompts, templates or skills', oldNames],
  ['K8', 'core rules in every prompt form', coreRules],
  ['K9', 'one status vocabulary', statuses],
];

export function runChecks(root) {
  return CHECKS.map(([id, name, fn]) => {
    let problems;
    try { problems = fn(root); } catch (e) { problems = [`check crashed: ${e.message}`]; }
    return { id, name, ok: problems.length === 0, problems };
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const results = runChecks(root);
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id} ${r.name}`);
    for (const p of r.problems) console.log(`     - ${p}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} of ${results.length} checks pass`);
  process.exit(failed ? 1 : 0);
}
