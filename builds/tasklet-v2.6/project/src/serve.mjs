// The web view server (SPEC 7.2). Read-only: loads the file fresh on every request, never saves.
import http from 'node:http';
import { loadStore } from './store.mjs';
import { renderPage } from './page.mjs';
import { makeError, webBody } from './errors.mjs';

const COMMON = {
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
  'x-content-type-options': 'nosniff',
  'cache-control': 'no-store',
};
const TEXT = 'text/plain; charset=utf-8';
const HTML = 'text/html; charset=utf-8';

function send(req, res, status, type, body, extra = {}) {
  res.writeHead(status, { ...COMMON, 'content-type': type, 'content-length': Buffer.byteLength(body), ...extra });
  res.end(req.method === 'HEAD' ? undefined : body);
}

function handler(file, render, getPort) {
  return (req, res) => {
    try {
      const port = getPort();
      const host = String(req.headers.host ?? '').toLowerCase();
      if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
        send(req, res, 403, TEXT, 'Forbidden\n');
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        send(req, res, 405, TEXT, 'Method not allowed\n', { allow: 'GET, HEAD' });
        return;
      }
      const target = req.url;
      if (target !== '/' && !target.startsWith('/?')) {
        send(req, res, 404, TEXT, 'Not found\n');
        return;
      }
      let html;
      try {
        html = render(loadStore(file));
      } catch (err) {
        send(req, res, 500, TEXT, webBody(err));
        return;
      }
      send(req, res, 200, HTML, html);
    } catch {
      // E_WEB_INTERNAL: nothing about the error is sent or printed (SPEC 6.5, AC-22).
      if (!res.headersSent) send(req, res, 500, TEXT, webBody(undefined));
      else res.destroy();
    }
  };
}

export function startServer({ file, port, render = renderPage }) {
  return new Promise((resolve, reject) => {
    let actualPort = port;
    const server = http.createServer(handler(file, render, () => actualPort));
    const onError = (err) => {
      // AC-19: EADDRINUSE -> E_PORT_IN_USE; every other listen error -> E_SERVE_FAILED.
      if (err && err.code === 'EADDRINUSE') reject(makeError('E_PORT_IN_USE', { n: port }));
      else reject(makeError('E_SERVE_FAILED'));
    };
    server.once('error', onError);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', onError);
      actualPort = server.address().port;
      resolve({ server, url: `http://127.0.0.1:${actualPort}/` });
    });
  });
}
