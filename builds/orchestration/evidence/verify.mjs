// Hidden checker for the Tasklet orchestration self-test.
// Usage: node verify.mjs <build dir> [--web-file-other]  (the flag points the web server at a different file: the joined checks must then fail)
// Written before any build ran. Checks only what TASK.md pins.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = path.resolve(process.argv[2] || '.');
const webOther = process.argv.includes('--web-file-other');
const cliPath = path.join(dir, 'cli', 'todo.mjs');
const webPath = path.join(dir, 'web', 'server.mjs');
const fixDir = path.join(dir, 'contract', 'fixtures');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklet-verify-'));
const results = [];
const rec = (id, group, ok, note = '') => results.push({ id, group, ok: !!ok, note: ok ? '' : String(note).slice(0, 160) });

function cli(args, { input, file } = {}) {
  if (!fs.existsSync(cliPath)) return { code: -1, out: '', err: 'cli/todo.mjs missing' };
  const a = [cliPath, ...args];
  if (file) a.push('--file', file);
  const r = spawnSync(process.execPath, a, { input: input ?? '', encoding: 'utf8', timeout: 20000, cwd: tmp });
  return { code: r.status, out: (r.stdout || '').replace(/\r\n/g, '\n'), err: (r.stderr || '').replace(/\r\n/g, '\n') };
}
const fresh = (name) => path.join(tmp, name + '-' + Math.random().toString(36).slice(2) + '.json');
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
async function check(id, group, fn) {
  try { const r = await fn(); rec(id, group, r === true, r === true ? '' : r); }
  catch (e) { rec(id, group, false, e && e.message ? e.message : e); }
}

let createServer = null;
try { createServer = (await import(pathToFileURL(webPath).href)).createServer; } catch { createServer = null; }
async function withWeb(file, fn) {
  if (typeof createServer !== 'function') throw new Error('web/server.mjs has no createServer');
  const server = createServer({ file });
  await new Promise((res, rej) => { server.once('error', rej); server.listen(0, '127.0.0.1', res); });
  const base = 'http://127.0.0.1:' + server.address().port;
  try { return await fn(base); } finally { await new Promise((r) => { server.close(r); server.closeAllConnections?.(); }); }
}
const visible = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const get = async (url, opt) => { const r = await fetch(url, opt); const text = await r.text(); return { status: r.status, type: r.headers.get('content-type') || '', text, vis: visible(text) }; };

// ---- CLI alone
await check('C01', 'cli', () => { const f = fresh('a'); const r = cli(['add', 'Buy milk'], { file: f }); if (r.code !== 0 || r.out.trim() !== 'Added #1: Buy milk') return `code ${r.code} out ${r.out}`; const d = readJson(f); return (d.version === 1 && d.nextId === 2 && d.tasks.length === 1 && d.tasks[0].id === 1 && d.tasks[0].done === false && d.tasks[0].title === 'Buy milk' && typeof d.tasks[0].created === 'string') || 'file shape wrong'; });
await check('C02', 'cli', () => { const f = fresh('a'); const r = cli(['list'], { file: f }); return (r.code === 0 && r.out.trim() === 'No tasks.') || `code ${r.code} out ${r.out}`; });
await check('C03', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); cli(['add', 'Call Sam'], { file: f }); cli(['done', '2'], { file: f }); const r = cli(['list'], { file: f }); return (r.code === 0 && r.out.trim() === '[ ] #1 Buy milk\n[x] #2 Call Sam') || r.out; });
await check('C04', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); const r = cli(['list', '--json'], { file: f }); const a = JSON.parse(r.out); return (Array.isArray(a) && a.length === 1 && a[0].title === 'Buy milk') || 'not the tasks array'; });
await check('C05', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); const r = cli(['done', '1'], { file: f }); return (r.code === 0 && r.out.trim() === 'Done #1' && readJson(f).tasks[0].done === true) || `code ${r.code} out ${r.out}`; });
await check('C06', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); const r = cli(['done', '9'], { file: f }); return (r.code === 2 && /No task #9/.test(r.err)) || `code ${r.code} err ${r.err}`; });
await check('C07', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); cli(['done', '1'], { file: f }); const r = cli(['done', '1'], { file: f }); return (r.code === 0 && r.out.trim() === 'Already done #1') || `code ${r.code} out ${r.out}`; });
await check('C08', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); const before = fs.readFileSync(f); const r = cli(['remove', '1'], { file: f, input: 'no\n' }); return (r.code === 0 && /Cancelled/.test(r.out) && Buffer.compare(before, fs.readFileSync(f)) === 0) || `code ${r.code} out ${r.out}`; });
await check('C09', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); const before = fs.readFileSync(f); const r = cli(['remove', '1'], { file: f, input: '' }); return (r.code === 0 && /Cancelled/.test(r.out) && Buffer.compare(before, fs.readFileSync(f)) === 0) || `code ${r.code} out ${r.out}`; });
await check('C10', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); const r = cli(['remove', '1'], { file: f, input: 'yes\n' }); return (r.code === 0 && readJson(f).tasks.length === 0) || `code ${r.code}`; });
await check('C11', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); cli(['remove', '1', '--yes'], { file: f }); const r = cli(['add', 'Next'], { file: f }); const d = readJson(f); return (r.out.trim() === 'Added #2: Next' && d.nextId === 3 && d.tasks[0].id === 2) || `id reused: ${r.out}`; });
await check('C12', 'cli', () => { const f = fresh('a'); const r = cli(['add', 'x'.repeat(201)], { file: f }); return (r.code === 1 && !fs.existsSync(f)) || `code ${r.code}`; });
await check('C13', 'cli', () => { const f = fresh('a'); const r = cli(['add', 'x'.repeat(200)], { file: f }); return r.code === 0 || `code ${r.code}`; });
await check('C14', 'cli', () => { const f = fresh('a'); const r = cli(['add', '   '], { file: f }); return r.code === 1 || `code ${r.code}`; });
await check('C15', 'cli', () => { const f = fresh('a'); const r = cli(['add', '  Buy milk  '], { file: f }); return (r.code === 0 && readJson(f).tasks[0].title === 'Buy milk') || 'not trimmed'; });
await check('C16', 'cli', () => { const f = fresh('a'); const r1 = cli(['frobnicate'], { file: f }); const r2 = cli(['done', 'abc'], { file: f }); const r3 = cli(['done'], { file: f }); return (r1.code === 1 && r2.code === 1 && r3.code === 1) || `codes ${r1.code} ${r2.code} ${r3.code}`; });
await check('C17', 'cli', () => { const f = fresh('a'); fs.writeFileSync(f, '{not json'); const before = fs.readFileSync(f); const r = cli(['add', 'Buy milk'], { file: f }); return (r.code === 3 && r.err.startsWith('Cannot read ') && Buffer.compare(before, fs.readFileSync(f)) === 0) || `code ${r.code} err ${r.err}`; });
await check('C18', 'cli', () => { const f = fresh('a'); cli(['add', 'Buy milk'], { file: f }); const t = fs.readFileSync(f, 'utf8'); return (t.endsWith('}\n') && t.includes('\n  "version": 1')) || 'not two-space JSON with trailing newline'; });
await check('C19', 'cli', () => { const f = fresh('a'); fs.copyFileSync(path.join(fixDir, 'valid-unknown-fields.json'), f); const r = cli(['add', 'Another'], { file: f }); if (r.code !== 0) return `code ${r.code}`; const d = readJson(f); const allowedTop = ['version', 'nextId', 'tasks']; const allowedTask = ['id', 'title', 'done', 'created']; return (Object.keys(d).every((k) => allowedTop.includes(k)) && d.tasks.every((t) => Object.keys(t).every((k) => allowedTask.includes(k)))) || 'unknown fields kept on write'; });
await check('C20', 'cli', () => { const f = fresh('a'); const r = spawnSync(process.execPath, [cliPath, 'add', 'Env task'], { encoding: 'utf8', cwd: tmp, env: { ...process.env, TODO_FILE: f } }); return (r.status === 0 && fs.existsSync(f)) || 'TODO_FILE ignored'; });
await check('C21', 'cli', () => { const f = fresh('a'); if (cli(['add', 'Buy milk'], { file: f }).code !== 0) return 'add failed'; const left = fs.readdirSync(tmp).filter((n) => !n.endsWith('.json')); return left.length === 0 || `left behind: ${left.join(',')}`; });

// ---- Fixtures through each reader
const expected = fs.existsSync(path.join(fixDir, 'expected.json')) ? readJson(path.join(fixDir, 'expected.json')) : {};
for (const [name, verdict] of Object.entries(expected)) {
  await check('F-cli-' + name, 'fixture-cli', () => { const r = cli(['list'], { file: path.join(fixDir, name) }); return (verdict === 'valid' ? r.code === 0 : r.code === 3) || `code ${r.code}`; });
  await check('F-web-' + name, 'fixture-web', () => withWeb(path.join(fixDir, name), async (b) => { const r = await get(b + '/api/tasks'); return (verdict === 'valid' ? r.status === 200 : r.status === 500) || `status ${r.status}`; }));
}

// ---- Web alone
await check('W01', 'web', () => withWeb(path.join(fixDir, 'valid-two.json'), async (b) => { const r = await get(b + '/'); return (r.status === 200 && /Tasklet/.test(r.text) && /1 open, 1 done/.test(r.vis) && /#1 Buy milk/.test(r.vis) && /class="[^"]*\bdone\b/.test(r.text) && /Done/.test(r.text) && /<ol/.test(r.text) && /lang=/.test(r.text)) || 'page content wrong'; }));
await check('W02', 'web', () => withWeb(path.join(fixDir, 'valid-empty.json'), async (b) => { const r = await get(b + '/'); return (r.status === 200 && /No tasks yet\./.test(r.text)) || 'no empty state'; }));
await check('W03', 'web', () => withWeb(path.join(fixDir, 'valid-markup-title.json'), async (b) => { const r = await get(b + '/'); return (r.status === 200 && !/<script>alert/.test(r.text) && /&lt;script&gt;alert/.test(r.text)) || 'title not escaped'; }));
await check('W04', 'web', () => withWeb(path.join(fixDir, 'invalid-not-json.json'), async (b) => { const p = await get(b + '/'); const a = await get(b + '/api/tasks'); let j = {}; try { j = JSON.parse(a.text); } catch {} return (p.status === 500 && /Cannot read tasks file/.test(p.text) && !/\bat .*:\d+:\d+/.test(p.text) && a.status === 500 && j.error === 'Cannot read tasks file') || `page ${p.status} api ${a.status}`; }));
await check('W05', 'web', () => withWeb(path.join(fixDir, 'valid-two.json'), async (b) => { const a = await get(b + '/api/tasks'); const j = JSON.parse(a.text); return (a.status === 200 && /application\/json/.test(a.type) && Array.isArray(j.tasks) && j.tasks.length === 2 && j.tasks[1].done === true) || 'api shape wrong'; }));
await check('W06', 'web', () => withWeb(path.join(fixDir, 'valid-two.json'), async (b) => { const n = await get(b + '/nope'); const m = await get(b + '/', { method: 'POST' }); return (n.status === 404 && m.status === 405) || `404→${n.status} 405→${m.status}`; }));
await check('W07', 'web', () => { const f = fresh('missing'); return withWeb(f, async (b) => { const r = await get(b + '/'); return (r.status === 200 && /No tasks yet\./.test(r.text) && !fs.existsSync(f)) || `status ${r.status}`; }); });
await check('W08', 'web', () => { const src = fs.readFileSync(webPath, 'utf8'); return !/from\s+['"][^'"]*cli\//.test(src) || 'web imports from cli/'; });

// ---- JOINED: only the two real parts on the same file can pass these
const shared = fresh('joined');
const webFile = webOther ? fresh('other') : shared;
await check('J01', 'joined', () => { const r = cli(['add', 'Joined task'], { file: shared }); if (r.code !== 0) return `cli add failed ${r.code}`; return withWeb(webFile, async (b) => { const a = await get(b + '/api/tasks'); const j = JSON.parse(a.text); return (a.status === 200 && j.tasks.some((t) => t.title === 'Joined task' && t.done === false)) || 'task added by CLI not in /api/tasks'; }); });
await check('J02', 'joined', () => withWeb(webFile, async (b) => { const p = await get(b + '/'); return (p.status === 200 && /#1 Joined task/.test(p.vis) && /1 open, 0 done/.test(p.vis)) || 'task added by CLI not on the page'; }));
await check('J03', 'joined', () => { const r = cli(['done', '1'], { file: shared }); if (r.code !== 0) return `cli done failed ${r.code}`; return withWeb(webFile, async (b) => { const a = await get(b + '/api/tasks'); const p = await get(b + '/'); const j = JSON.parse(a.text); return (j.tasks[0] && j.tasks[0].done === true && /0 open, 1 done/.test(p.vis)) || 'done by CLI not shown done by web'; }); });
await check('J04', 'joined', async () => { for (const name of Object.keys(expected).filter((n) => expected[n] === 'valid')) { const f = fresh('rw'); fs.copyFileSync(path.join(fixDir, name), f); const d = readJson(f); if (!d.tasks.length) { if (cli(['add', 'seed'], { file: f }).code !== 0) return `add failed on ${name}`; } else { if (cli(['done', String(d.tasks[0].id)], { file: f }).code !== 0) return `done failed on ${name}`; } const ok = await withWeb(webOther ? webFile : f, async (b) => { const a = await get(b + '/api/tasks'); if (a.status !== 200) return false; const j = JSON.parse(a.text); return j.tasks.length >= 1 && j.tasks.length === readJson(f).tasks.length; }); if (!ok) return `web refuses or misreads CLI rewrite of ${name}`; } return true; });

fs.rmSync(tmp, { recursive: true, force: true });
const groups = {};
for (const r of results) { (groups[r.group] ||= { pass: 0, total: 0 }); groups[r.group].total++; if (r.ok) groups[r.group].pass++; }
const pass = results.filter((r) => r.ok).length;
const joinedAll = groups.joined.pass === groups.joined.total;
console.log(JSON.stringify({ dir, webOther, pass, total: results.length, score: Math.round((1000 * pass) / results.length) / 10, resolved: pass === results.length, joinedAll, groups, failed: results.filter((r) => !r.ok).map((r) => `${r.id}: ${r.note}`) }, null, 2));
process.exit(pass === results.length ? 0 : 1);
