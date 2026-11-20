// The page (SPEC 8.2). Pure: store in, HTML string out. Every title goes through escapeHtml.
import { escapeHtml } from './text.mjs';

const STYLE = 'body{font-family:system-ui,sans-serif;line-height:1.5;margin:0 auto;max-width:40em;padding:0 1em}'
  + 'ul{padding-left:1.5em}li{overflow-wrap:anywhere}.empty{color:#555}';

function byId(a, b) {
  return a.id - b.id;
}

function section(id, label, tasks) {
  const body = tasks.length === 0
    ? '<p class="empty">None.</p>'
    : '<ul>\n' + tasks.map((t) => `<li data-id="${t.id}">${escapeHtml(t.title)}</li>\n`).join('') + '</ul>';
  return `<section id="${id}">\n<h2>${label} (${tasks.length})</h2>\n${body}\n</section>\n`;
}

export function renderPage(store) {
  const open = store.tasks.filter((t) => !t.done).sort(byId);
  const done = store.tasks.filter((t) => t.done).sort(byId);
  return '<!doctype html>\n'
    + '<html lang="en">\n'
    + '<head>\n'
    + '<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>To-do</title>\n'
    + `<style>${STYLE}</style>\n`
    + '</head>\n'
    + '<body>\n'
    + '<h1>To-do</h1>\n'
    + section('open', 'Open', open)
    + section('done', 'Done', done)
    + '</body>\n'
    + '</html>\n';
}
