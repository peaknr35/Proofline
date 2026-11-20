// Rule 8: a check is trusted only after it has been seen to fail on a known-bad sample.
// Builds one small research folder that passes, then breaks it one way at a time.
// The first four breaks are the real faults found in the researcher's first live test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkResearch } from './check-research.mjs';

const SOURCE_1 = `<html><head><style>p{}</style></head><body><p>We find that single agents
consistently match or outperform multi-agent systems when reasoning tokens are held constant.
Many reported advantages of multi-agent systems are better explained by unaccounted computation
and context effects rather than inherent architectural benefits.</p></body></html>`;
const SOURCE_2 = `Whether a team is worth it depends on the model, task, and budget: a team can boost
performance, but higher reasoning effort is an alternative worth weighing. Teams cost 1.8x to 5.1x
as much. Independent agents amplify errors 17.2 &times; through unchecked propagation.`;

const RESEARCH = `# Research: Do agent teams beat one agent at equal cost?
Date: 2026-11-19 · Mode: Product · Depth: deep · Stopped because: saturation
Citation audit: 3 claims - 2 verified, 1 fixed, 0 dropped

## Answer
Usually not. Single agents "consistently match or outperform multi-agent systems" at equal tokens [1].

## Key findings
1. Teams cost 1.8x to 5.1x as much [2]. In the authors' words, "Whether a team is worth it depends on the model, task, and budget: a team can boost performance..." [2] - Confidence: Medium - MEASURED
2. A scaling study found:
   - "Independent agents amplify errors 17.2×"

## Sources
[1] Tran & Kiela, "Single agents under equal budgets", 2 Apr 2026. https://example.org/1 - Grade A - read: raw text. "Many reported advantages of multi-agent systems are better explained by unaccounted computation and context effects rather than inherent architectural benefits."
[2] Vals AI, "Do Agent Teams Pay Off?", 9 Oct 2026. https://example.org/2 - Grade A - read: raw text.
[3] Some blog, "A take on teams", undated. https://example.org/3 - Grade C - read: fetch summary only.

## Citation audit
| Claim | Source | Result | Note |
|---|---|---|---|

## Method log
- searched "agent teams vs single agent cost"
`;
const PRD = `# PRD: Team switch
Status: PROPOSED
| ID | Requirement | Priority | Why (evidence) | Confidence | Label |
|---|---|---|---|---|---|
| R1 | Default to one agent | MUST | [1][2] | High | MEASURED |
| R2 | Offer a team for parallel work | SHOULD | ASSUMPTION | Low | PLANNED |
`;

function folder(edit = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proofline-research-'));
  fs.mkdirSync(path.join(dir, 'sources'));
  const files = { 'research.md': RESEARCH, 'PRD.md': PRD, 'sources/1.html': SOURCE_1, 'sources/2.txt': SOURCE_2, ...edit };
  for (const [rel, text] of Object.entries(files)) if (text !== null) fs.writeFileSync(path.join(dir, rel), text);
  return dir;
}

function problems(edit) {
  const dir = folder(edit);
  try { return checkResearch(dir).problems; } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('a clean research folder passes', () => {
  assert.deepEqual(problems(), []);
});

const BREAKS = [
  ['a paraphrase inside quotation marks', /quote not found .*source \[1\]/,
    { 'research.md': RESEARCH.replace('unaccounted computation and context effects rather than inherent architectural benefits', 'compute and context effects than by inherent architectural superiority') }],
  ['a quote that ends with a period where the source has a colon', /quote not found .*source \[2\]/,
    { 'research.md': RESEARCH.replace('budget: a team can boost performance..."', 'budget."') }],
  ['a quote cut without "..."', /quote not found .*source \[2\]/,
    { 'research.md': RESEARCH.replace('a team can boost performance..."', 'higher reasoning effort is an alternative worth weighing"') }],
  ['a word added inside a quote', /quote not found .*source \[1\]/,
    { 'research.md': RESEARCH.replace('consistently match or outperform multi-agent', 'consistently match or clearly outperform multi-agent') }],
  ['a changed number inside a quote', /quote not found .*source \[2\]/,
    { 'research.md': RESEARCH.replace('amplify errors 17.2×', 'amplify errors 17.5×') }],
  ['a citation to a source that is not listed', /cites \[4\], which is not in Sources/,
    { 'research.md': RESEARCH.replace('as much [2]', 'as much [4]') }],
  ['a cited source with no saved raw text', /source \[2\] has no saved raw text/,
    { 'sources/2.txt': null }],
  ['a quote from a source read only as a fetch summary', /cites only sources with no raw text \[3\]/,
    { 'research.md': RESEARCH.replace('at equal tokens [1]', 'at equal tokens [3]') }],
  ['a source with no grade', /source \[2\] has no grade/,
    { 'research.md': RESEARCH.replace('https://example.org/2 - Grade A', 'https://example.org/2') }],
  ['audit counts that do not add up', /counts do not add up/,
    { 'research.md': RESEARCH.replace('2 verified, 1 fixed', '2 verified, 2 fixed') }],
  ['a MUST requirement resting on an assumption alone', /MUST requirement R1 cites no research finding/,
    { 'PRD.md': PRD.replace('| MUST | [1][2] |', '| MUST | ASSUMPTION |') }],
  ['a PRD citing a source research.md does not list', /PRD\.md:5: cites \[9\]/,
    { 'PRD.md': PRD.replace('[1][2]', '[1][9]') }],
  ['a PRD with no PROPOSED status', /no "Status: PROPOSED"/,
    { 'PRD.md': PRD.replace('Status: PROPOSED', 'Status: final') }],
];

for (const [what, expect, edit] of BREAKS) {
  test(`fails on ${what}`, () => {
    const got = problems(edit);
    assert.ok(got.some((p) => expect.test(p)), `expected a problem matching ${expect}, got:\n${got.join('\n') || '(none)'}`);
  });
}

test('a cut marked with "..." passes, and whitespace or typographic quotes from extraction do not matter', () => {
  const r = RESEARCH.replace('"Independent agents amplify errors 17.2×"', '“Independent agents amplify errors 17.2 × ... unchecked propagation”');
  assert.deepEqual(problems({ 'research.md': r }), []);
});
