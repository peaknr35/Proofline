// Error names, exit codes and exact messages (SPEC 6.5). The only module that holds message text.
// params values are inserted as given: callers pass `file` already through safeText (store.mjs does).

const TABLE = {
  E_USAGE_UNKNOWN_COMMAND: [2, () => 'unknown command. Run "todo help" for usage.'],
  E_USAGE_MISSING_TITLE: [2, () => 'add needs a task title. Example: todo add buy milk'],
  E_USAGE_MISSING_ID: [2, (p) => `${p.cmd} needs a task number. Example: todo ${p.cmd} 3`],
  E_USAGE_EXTRA_ARGS: [2, (p) => `too many arguments for ${p.cmd}. Run "todo help" for usage.`],
  E_USAGE_BAD_PORT: [2, () => '--port needs a whole number from 1 to 65535.'],
  E_USAGE_UNKNOWN_OPTION: [2, () => 'unknown option for serve. Run "todo help" for usage.'],
  E_TITLE_EMPTY: [2, () => 'the task title is empty.'],
  E_TITLE_TOO_LONG: [2, (p) => `the task title is longer than 200 characters (it has ${p.n}).`],
  E_TITLE_CONTROL: [2, () => 'the task title contains a character that is not allowed (a control, direction or broken character, such as a line break or tab).'],
  E_ID_INVALID: [2, () => 'a task number must be a whole number from 1 up.'],
  E_NOT_FOUND: [4, (p) => `there is no task ${p.id}.`],
  E_FILE_UNREADABLE: [3, (p) => `cannot read the task file ${p.file}.`],
  E_FILE_DAMAGED: [3, (p) => `the task file ${p.file} is damaged and was not changed. Fix or move it, then try again.`],
  E_FILE_VERSION: [3, (p) => `the task file ${p.file} was written by a different version of todo (file version ${p.v}). It was not changed.`],
  E_ID_LIMIT: [3, (p) => `the task file ${p.file} has run out of task numbers. Nothing was changed.`],
  E_FILE_WRITE: [3, (p) => `could not save the task file ${p.file}. Nothing was changed.`],
  E_PORT_IN_USE: [5, (p) => `port ${p.n} is already in use. Try another one with --port.`],
  E_SERVE_FAILED: [5, () => 'could not start the web view.'],
  E_INTERNAL: [1, () => 'internal error.'],
};

export class TodoError extends Error {
  constructor(name, exitCode, message) {
    super(message);
    this.name = name;
    this.exitCode = exitCode;
  }
}

export function makeError(name, params = {}) {
  const entry = TABLE[name];
  if (!entry) throw new Error(`unknown error name: ${name}`);
  const [exitCode, text] = entry;
  return new TodoError(name, exitCode, text(params));
}

const WEB_FILE_ERRORS = new Set(['E_FILE_UNREADABLE', 'E_FILE_DAMAGED', 'E_FILE_VERSION']);

// Body of a web 500 (SPEC 6.5): the three file errors show their message, first letter
// upper-cased; any other value is E_WEB_INTERNAL and shows nothing about the error.
export function webBody(err) {
  if (err instanceof TodoError && WEB_FILE_ERRORS.has(err.name)) {
    return err.message.charAt(0).toUpperCase() + err.message.slice(1) + '\n';
  }
  return 'Internal error\n';
}
