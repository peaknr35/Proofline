// Machine check for proofline-researcher output. It enforces by code what the researcher's
// rules otherwise only ask for: every quote is found word for word in the saved raw text of
// the source it cites, every citation points at a listed source, the audit counts add up,
// and (Product mode) every MUST requirement rests on cited evidence.
//
//   node check-research.mjs <research-folder>
//
// The folder holds research.md, optionally PRD.md, and sources/<n>.txt (or .html): the raw
// text of source [n] as downloaded. HTML is stripped here, so a raw curl download is fine.
//
// What it cannot check: whether a paraphrase is fair, whether scope words were dropped from
// a sentence (only from a quote), or whether the source itself is right. Those stay with the
// citation audit and the Lead's independent spot-check. Standard library only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIN_QUOTE_WORDS = 4; // shorter quoted strings are usually names or terms, not quotations

// ---------- text normalisation ----------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', hellip: '...', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', minus: '-', times: '×' };

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function stripHtml(s) {
  return s
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

// Folds only differences that raw-text extraction introduces (typographic quotes and dashes,
// ligatures, whitespace, soft hyphens). Wording, case, digits and punctuation must still match.
export function norm(s) {
  return s
    .normalize('NFKC')
    .replace(/­/g, '')
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

// PDF and HTML line breaks can split a hyphenated word: "multi-\nagent" or "coordi-\nnation".
function sourceForms(raw) {
  const n = norm(decodeEntities(/<[a-z!][^>]*>/i.test(raw) ? stripHtml(raw) : raw));
  return [n, n.replace(/(\w)- (\w)/g, '$1-$2'), n.replace(/(\w)- (\w)/g, '$1$2')];
}

// A quote may be cut with "..." (or "…", "[...]"); each piece must appear, in order.
export function quoteFound(quote, forms) {
  const pieces = norm(quote).split(/\s*(?:\[\s*(?:\.\.\.|…)\s*\]|\.\.\.|…)\s*/).map((p) => p.trim()).filter((p) => p.length > 0);
  if (pieces.length === 0) return true;
  const tight = (s) => s.replace(/\s+/g, '');
  const all = [...forms, ...forms.map(tight)]; // last resort: rendered maths ("17.2 ×") differs only in spacing
  return all.some((src, k) => {
    const ps = k < forms.length ? pieces : pieces.map(tight);
    let at = 0;
    for (const p of ps) {
      const j = src.indexOf(p, at);
      if (j < 0) return false;
      at = j + p.length;
    }
    return true;
  });
}

// ---------- parsing research.md ----------

const CITE = /\[(\d+(?:\s*[,–-]\s*\d+)*)\]/g;

function citesIn(s) {
  const out = [];
  for (const m of s.matchAll(CITE)) {
    for (const part of m[1].split(/\s*,\s*/)) {
      const r = part.split(/\s*[–-]\s*/).map(Number);
      if (r.length === 2 && r[1] >= r[0] && r[1] - r[0] < 50) for (let k = r[0]; k <= r[1]; k++) out.push(k);
      else out.push(r[0]);
    }
  }
  return out;
}

function quotesIn(line) {
  const out = [];
  for (const m of line.matchAll(/"([^"\n]+)"|“([^”\n]+)”/g)) {
    const q = m[1] ?? m[2];
    if (q.trim().split(/\s+/).length >= MIN_QUOTE_WORDS) out.push({ q, start: m.index, end: m.index + m[0].length });
  }
  return out;
}

function sections(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const heads = [];
  lines.forEach((l, i) => { const m = l.match(/^##\s+(.+?)\s*$/); if (m) heads.push({ name: m[1].toLowerCase(), i }); });
  const span = (name) => {
    const h = heads.find((x) => x.name.startsWith(name));
    if (!h) return null;
    const next = heads.find((x) => x.i > h.i);
    return [h.i + 1, next ? next.i : lines.length];
  };
  return { lines, span };
}

function parseSources(lines, span) {
  const map = new Map();
  if (!span) return map;
  for (let i = span[0]; i < span[1]; i++) {
    const m = lines[i].match(/^\s*\[(\d+)\]\s+(.*)$/);
    if (m) map.set(Number(m[1]), { line: i + 1, text: m[2] });
  }
  return map;
}

// ---------- the checks ----------

export function checkResearch(dir) {
  const problems = [];
  const stats = { quotes: 0, found: 0, sources: 0, rawSaved: 0, cites: 0 };
  const rp = path.join(dir, 'research.md');
  if (!fs.existsSync(rp)) return { problems: ['research.md is missing'], stats };
  const text = fs.readFileSync(rp, 'utf8');
  const { lines, span } = sections(text);
  const srcSpan = span('sources');
  if (!srcSpan) problems.push('research.md has no "## Sources" section');
  const sources = parseSources(lines, srcSpan);
  stats.sources = sources.size;

  // Raw text per source.
  const rawDir = path.join(dir, 'sources');
  const raw = new Map();
  for (const [n, s] of sources) {
    const file = ['txt', 'html', 'htm', 'md'].map((e) => path.join(rawDir, `${n}.${e}`)).find((f) => fs.existsSync(f));
    const summaryOnly = /fetch summary only|\[via fetch summary\]/i.test(s.text);
    if (file) { raw.set(n, sourceForms(fs.readFileSync(file, 'utf8'))); stats.rawSaved++; }
    else if (!summaryOnly) problems.push(`research.md:${s.line}: source [${n}] has no saved raw text (sources/${n}.txt) and is not marked "fetch summary only"`);
    if (!/https?:\/\/\S+/.test(s.text) && !/\b(doi|isbn|arxiv)\b/i.test(s.text)) problems.push(`research.md:${s.line}: source [${n}] has no URL or identifier`);
    if (!/\bGrade [ABCD]\b/.test(s.text)) problems.push(`research.md:${s.line}: source [${n}] has no grade (Grade A-D)`);
  }

  const inSources = (i) => srcSpan && i >= srcSpan[0] && i < srcSpan[1];
  const auditSpan = span('citation audit');
  const logSpan = span('method log'); // search queries and titles of failed loads, not claims
  const inAudit = (i) => [auditSpan, logSpan].some((s) => s && i >= s[0] && i < s[1]);

  const checkQuote = (q, ns, where) => {
    stats.quotes++;
    const withRaw = ns.filter((n) => raw.has(n));
    if (ns.length === 0) { problems.push(`${where}: quote has no citation: "${q}"`); return; }
    const missing = ns.filter((n) => !sources.has(n));
    if (missing.length === ns.length) return; // reported as a dangling citation
    if (withRaw.length === 0) { problems.push(`${where}: quote cites only sources with no raw text [${ns.join('][')}], so it cannot be checked: "${q}"`); return; }
    if (withRaw.some((n) => quoteFound(q, raw.get(n)))) { stats.found++; return; }
    problems.push(`${where}: quote not found word for word in source [${withRaw.join('][')}]: "${q}" (fix the quote from the raw text, mark cuts with "...", or, if these are your own words, remove the quotation marks)`);
  };

  let blockCites = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '' || /^#/.test(line)) blockCites = [];
    if (inAudit(i)) continue;
    const where = `research.md:${i + 1}`;

    if (inSources(i)) {
      const m = line.match(/^\s*\[(\d+)\]/);
      // The quoted title comes before the URL; quotations from the source come after it.
      const url = line.search(/https?:\/\//);
      if (m) for (const { q, start } of quotesIn(line)) if (url >= 0 && start > url) checkQuote(q, [Number(m[1])], where);
      continue;
    }

    for (const n of citesIn(line)) {
      stats.cites++;
      if (!sources.has(n)) problems.push(`${where}: cites [${n}], which is not in Sources`);
    }
    // A quote belongs to the citation that follows it on the line, else the nearest one
    // before it on the line, else the last citation earlier in the same block.
    for (const { q, start, end } of quotesIn(line)) {
      const group = line.slice(end).match(/^(?:[^\[]|\[(?!\d))*((?:\[\d+(?:\s*[,–-]\s*\d+)*\])+)/); // first run of [n][m] after it
      const after = group ? citesIn(group[1]) : [];
      const before = citesIn(line.slice(0, start));
      const ns = after.length ? after : before.length ? [before[before.length - 1]] : blockCites.length ? [blockCites[blockCites.length - 1]] : [];
      checkQuote(q, ns, where);
    }
    const c = citesIn(line);
    if (c.length) blockCites = c;
  }

  // The audit summary must add up.
  const head = text.match(/^Citation audit:\s*(\d+)\s*claims?\D+?(\d+)\s*verified\D+?(\d+)\s*fixed\D+?(\d+)\s*dropped/im);
  if (!head) problems.push('research.md has no "Citation audit: <n> claims - <v> verified, <f> fixed, <d> dropped" line');
  else {
    const [n, v, f, d] = head.slice(1).map(Number);
    if (v + f + d !== n) problems.push(`citation audit counts do not add up: ${v} + ${f} + ${d} is not ${n}`);
  }
  if (!auditSpan) problems.push('research.md has no "## Citation audit" table');

  // Product mode.
  const pp = path.join(dir, 'PRD.md');
  if (fs.existsSync(pp)) {
    const prd = fs.readFileSync(pp, 'utf8').replace(/\r\n/g, '\n').split('\n');
    if (!prd.some((l) => /^Status:\s*PROPOSED\b/.test(l) || /^Status:\s*APPROVED\b/.test(l))) problems.push('PRD.md has no "Status: PROPOSED" line');
    prd.forEach((l, i) => {
      for (const n of citesIn(l)) if (!sources.has(n)) problems.push(`PRD.md:${i + 1}: cites [${n}], which is not in research.md Sources`);
      if (/^\|/.test(l) && /\|\s*MUST\s*\|/.test(l)) {
        const cells = l.split('|').map((c) => c.trim());
        const id = cells[1] || '?';
        if (citesIn(l).length === 0) problems.push(`PRD.md:${i + 1}: MUST requirement ${id} cites no research finding (a MUST never rests on an ASSUMPTION alone)`);
        if (/\[background, unverified\]/.test(l) && citesIn(l).length === 0) problems.push(`PRD.md:${i + 1}: MUST requirement ${id} rests on background knowledge`);
      }
    });
    for (const q of prd.flatMap((l, i) => quotesIn(l).map((x) => ({ ...x, l, i })))) {
      const ns = citesIn(q.l.slice(q.end));
      checkQuote(q.q, ns.length ? [ns[0]] : citesIn(q.l), `PRD.md:${q.i + 1}`);
    }
  }
  return { problems, stats };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: node check-research.mjs <research-folder>'); process.exit(2); }
  const { problems, stats } = checkResearch(path.resolve(dir));
  for (const p of problems) console.log(`FAIL ${p}`);
  console.log(`\n${stats.sources} sources (${stats.rawSaved} with raw text) · ${stats.cites} citations · ${stats.found} of ${stats.quotes} quotes found word for word`);
  console.log(problems.length ? `${problems.length} problem(s): research check FAILED` : 'research check PASSED');
  process.exit(problems.length ? 1 : 0);
}
