// Shared helpers for the web tests. Not a test file.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES = path.resolve(here, '..', '..', 'contract', 'fixtures');
export const SERVER_PATH = path.resolve(here, '..', 'server.mjs');

export function fixture(name) {
  return path.join(FIXTURES, name);
}

/** A fresh temp dir, removed when the test ends. */
export function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasklet-web-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Write an object (or raw string) as a data file in a fresh temp dir. */
export function tempFile(t, content) {
  const file = path.join(tempDir(t), 'tasks.json');
  const text = typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`;
  fs.writeFileSync(file, text);
  return file;
}

/** Copy a golden fixture into a fresh temp dir and return the copy's path. */
export function copyFixture(t, name) {
  const file = path.join(tempDir(t), 'tasks.json');
  fs.copyFileSync(fixture(name), file);
  return file;
}

/** Start the real server on port 0; closed when the test ends. */
export async function start(t, file) {
  const server = createServer({ file });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve) => {
    server.closeAllConnections?.();
    server.close(resolve);
  }));
  return { server, port: server.address().port };
}

export function request(port, pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: pathname, method, agent: false },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

export function task(id, title, done = false) {
  return { id, title, done, created: '2026-11-13T09:00:00.000Z' };
}

/** The <li> elements of the page, as raw HTML strings. */
export function listItems(html) {
  return html.match(/<li[\s>][\s\S]*?<\/li>/g) || [];
}

/** Visible text of an HTML fragment: tags removed, entities decoded, spaces collapsed. */
export function textOf(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
