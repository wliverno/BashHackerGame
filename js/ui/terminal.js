import { COMMAND_NAMES } from '../engine/commands/index.js';

export function formatPrompt(fs) {
  const path = fs.cwd === '/home/analyst'
    ? '~'
    : fs.cwd.replace('/home/analyst', '~');
  return `[[;#0f0;]analyst@ucorp-srv-04:${path}$] `;
}

export function printStory(term, story) {
  term.echo('');
  story.split('\n').forEach(line => {
    term.echo(`[[;#0ff;]${line}]`);
  });
  term.echo('');
}

export function printObjective(term, objective) {
  term.echo(`[[;#ff0;]▶ Objective: ${objective}]`);
  term.echo('');
}

export function printLevelHeader(term, levelIndex, title) {
  term.echo('');
  term.echo('[[;#f0f;]═══════════════════════════════════════]');
  term.echo(`[[;#f0f;]  LEVEL ${levelIndex + 1}: ${title.toUpperCase()}]`);
  term.echo('[[;#f0f;]═══════════════════════════════════════]');
}

export function printWinScreen(term) {
  term.echo('');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('[[;#0f0;]      CHAPTER 3 COMPLETE!              ]');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('');
  term.echo("[[;#0ff;]You can navigate, read, write, and manipulate files.]");
  term.echo('[[;#0ff;]The server bends to your will.]');
  term.echo('');
  term.echo('[[;#ff0;]More chapters coming soon...]');
  term.echo('');
}

export function printChapterComplete(term, chapter) {
  term.echo('');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo(`[[;#0f0;]  CHAPTER ${chapter} COMPLETE!                ]`);
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('');
  term.echo(`[[;#0ff;]Chapter ${chapter} done. The next chapter awaits...]`);
  term.echo('');
}

export function getCompletions(str, fs) {
  const endsWithSpace = str.endsWith(' ');
  const parts = str.trim().split(/\s+/);

  // Typing the command name itself
  if (parts.length <= 1 && !endsWithSpace) {
    const partial = parts[0] || '';
    return COMMAND_NAMES.filter(c => c.startsWith(partial));
  }

  // After a command — complete file/dir names
  const cmd = parts[0];
  const partial = endsWithSpace ? '' : parts[parts.length - 1];
  const prefix = endsWithSpace ? str : parts.slice(0, -1).join(' ') + ' ';

  // Parse the partial to extract directory path and filename prefix
  const lastSlash = partial.lastIndexOf('/');
  let dir = '.';
  let filePrefix = partial;
  let pathPrefix = '';

  if (lastSlash !== -1) {
    pathPrefix = partial.substring(0, lastSlash + 1);
    filePrefix = partial.substring(lastSlash + 1);
    dir = pathPrefix || '/';
  }

  const entries = fs.listDir(dir) || [];

  if (cmd === 'cd') {
    const dirs = entries.filter(e => e.type === 'dir').map(e => e.name);
    const completions = ['..', ...dirs]
      .filter(n => n.startsWith(filePrefix));

    return completions.map(n => prefix + pathPrefix + n);
  }

  return entries.map(e => e.name)
    .filter(n => n.startsWith(filePrefix))
    .map(n => prefix + pathPrefix + n);
}
