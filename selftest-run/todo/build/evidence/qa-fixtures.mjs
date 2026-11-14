// QA: every golden fixture against expected.json, for BOTH readers, independently of the builders' tests.
// CLI reader = real `node cli/todo.mjs list` process. Web reader = real HTTP server (createServer) on port 0.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from '../../web/server.mjs';
const dir = 'contract/fixtures';
const expected = JSON.parse(readFileSync(`${dir}/expected.json`, 'utf8'));
const files = readdirSync(dir).filter((f) => f !== 'expected.json').sort();
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 12);
let bad = 0;
console.log(`fixtures on disk: ${files.length}, verdicts in expected.json: ${Object.keys(expected).length}`);
for (const f of files) {
  const p = `${dir}/${f}`;
  const before = sha(p);
  const cli = spawnSync(process.execPath, ['cli/todo.mjs', 'list', '--file', p], { encoding: 'utf8' });
  const server = createServer({ file: p });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  const api = await fetch(`${base}/api/tasks`); const apiBody = await api.text();
  const page = await fetch(`${base}/`); await page.text();
  await new Promise((ok) => server.close(ok));
  const cliVerdict = cli.status === 0 ? 'valid' : cli.status === 3 ? 'invalid' : `exit${cli.status}`;
  const webVerdict = api.status === 200 && page.status === 200 ? 'valid' : api.status === 500 && page.status === 500 ? 'invalid' : `http${api.status}/${page.status}`;
  const ok = cliVerdict === expected[f] && webVerdict === expected[f] && sha(p) === before;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'BAD '} ${f.padEnd(32)} expected=${expected[f]} cli=${cliVerdict}(exit ${cli.status}) web=${webVerdict}(api ${api.status}, page ${page.status}) unchanged=${sha(p) === before}${cli.status ? ' | ' + cli.stderr.trim() : ''}${api.status !== 200 ? ' | ' + apiBody : ''}`);
}
console.log(`mismatches: ${bad}`);
process.exit(bad ? 1 : 0);
