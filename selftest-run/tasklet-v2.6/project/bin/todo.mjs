#!/usr/bin/env node
// Entry point (SPEC 7.1): calls main() with the real process values and sets the exit code.
// Stream and uncaught errors follow SPEC 6.5 (E_INTERNAL, READER_GONE).
import os from 'node:os';
import { main } from '../src/cli.mjs';
import { makeError } from '../src/errors.mjs';

function internal() {
  try {
    process.stderr.write(`todo: ${makeError('E_INTERNAL').message}\n`);
  } catch {
    // stderr itself is broken: print nothing
  }
  process.exit(1);
}

process.stdout.on('error', (err) => {
  if (err && (err.code === 'EPIPE' || err.code === 'EOF')) process.exit(0); // the reader went away
  internal();
});
process.stderr.on('error', () => process.exit(1));
process.on('uncaughtException', internal);
process.on('unhandledRejection', internal);

const io = {
  env: process.env,
  cwd: process.cwd(),
  homedir: os.homedir(),
  stdout: process.stdout,
  stderr: process.stderr,
};
main(process.argv.slice(2), io).then((code) => {
  process.exitCode = code;
}, internal);
