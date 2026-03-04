import { COMMAND_NAMES } from '../engine/commands/index.js';

export function formatPrompt(fs) {
  const user = fs.currentUser || 'eve';
  const homePath = fs.homePath || '/home/eve';
  const path = fs.cwd === homePath
    ? '~'
    : fs.cwd.startsWith(homePath)
      ? fs.cwd.replace(homePath, '~')
      : fs.cwd;
  return `[[;#0f0;]${user}@megafirm-qlab:${path}$] `;
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
  term.echo('[[;#0f0;]      INVESTIGATION COMPLETE!           ]');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('');
  term.echo("[[;#0ff;]You came here to snoop. You stayed to save the lab.]");
  term.echo("[[;#0ff;]Mallory's sabotage is fully documented — the speed-of-light anomalies, the tampered readings, all of it.]");
  term.echo('');
  term.echo('[[;#ff0;]Not bad for an intern who was just supposed to refill the liquid nitrogen.]');
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

// word      = the current word being completed (from wordAutocomplete: true)
// fullCmd   = the full command line (from term.get_command())
export function getCompletions(word, fullCmd, fs) {
  const parts = fullCmd.trim().split(/\s+/);
  const isFirstWord = parts.length <= 1 && !fullCmd.includes(' ');

  // Completing the command name itself
  if (isFirstWord) {
    return COMMAND_NAMES.filter(c => c.startsWith(word));
  }

  // After a command — complete file/dir names
  const cmd = parts[0];

  // Parse the word to extract directory path and filename prefix
  const lastSlash = word.lastIndexOf('/');
  let dir = '.';
  let filePrefix = word;
  let pathPrefix = '';

  if (lastSlash !== -1) {
    pathPrefix = word.substring(0, lastSlash + 1);
    filePrefix = word.substring(lastSlash + 1);
    dir = pathPrefix || '/';
  }

  const entries = fs.listDir(dir) || [];

  if (cmd === 'cd') {
    return entries
      .filter(e => e.type === 'dir' && e.name.startsWith(filePrefix))
      .map(e => pathPrefix + e.name + '/');
  }

  return entries
    .filter(e => e.name.startsWith(filePrefix))
    .map(e => pathPrefix + e.name + (e.type === 'dir' ? '/' : ''));
}
