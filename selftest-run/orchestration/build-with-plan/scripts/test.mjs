// `npm test`: runs the whole suite with the Node test runner.
// `node --test` at the root also picks this file up by its name; in that case do nothing,
// so the suite is not started a second time from inside itself.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.env.NODE_TEST_CONTEXT) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const r = spawnSync(
    process.execPath,
    ['--test', 'cli/tests/cli.test.mjs', 'web/tests/web.test.mjs', 'tests/joined.test.mjs'],
    { cwd: root, stdio: 'inherit' },
  );
  process.exitCode = r.status ?? 1;
}
