import { createGame } from './game.js';

const game = createGame();

function formatPrompt() {
  const path = game.fs.cwd === '/home/analyst'
    ? '~'
    : game.fs.cwd.replace('/home/analyst', '~');
  return `[[;#0f0;]analyst@nexus-srv-04:${path}$] `;
}

function printStory(term, story) {
  term.echo('');
  story.split('\n').forEach(line => {
    term.echo(`[[;#0ff;]${line}]`);
  });
  term.echo('');
}

function printObjective(term, objective) {
  term.echo(`[[;#ff0;]▶ Objective: ${objective}]`);
  term.echo('');
}

function printLevelHeader(term, levelIndex, title) {
  term.echo('');
  term.echo('[[;#f0f;]═══════════════════════════════════════]');
  term.echo(`[[;#f0f;]  LEVEL ${levelIndex + 1}: ${title.toUpperCase()}]`);
  term.echo('[[;#f0f;]═══════════════════════════════════════]');
}

function printWinScreen(term) {
  term.echo('');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('[[;#0f0;]      CHAPTER 1 COMPLETE!              ]');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('');
  term.echo("[[;#0ff;]You've mastered the basics of Linux navigation.]");
  term.echo('[[;#0ff;]The server is at your fingertips.]');
  term.echo('');
  term.echo('[[;#ff0;]More chapters coming soon...]');
  term.echo('');
}

const COMMANDS = ['cat', 'cd', 'clear', 'echo', 'help', 'hint', 'ls', 'pwd'];

function getCompletions(str) {
  const endsWithSpace = str.endsWith(' ');
  const parts = str.trim().split(/\s+/);

  // Typing the command name itself
  if (parts.length <= 1 && !endsWithSpace) {
    const partial = parts[0] || '';
    return COMMANDS.filter(c => c.startsWith(partial));
  }

  // After a command — complete file/dir names from cwd
  const cmd = parts[0];
  const partial = endsWithSpace ? '' : parts[parts.length - 1];
  const entries = game.fs.listDir('.') || [];

  if (cmd === 'cd') {
    const dirs = entries.filter(e => e.type === 'dir').map(e => e.name);
    return ['..', ...dirs].filter(n => n.startsWith(partial));
  }

  return entries.map(e => e.name).filter(n => n.startsWith(partial));
}

$(function() {
  const term = $('#terminal').terminal(function(command) {
    if (!command.trim()) return;

    const result = game.runCommand(command);

    if (result.clear) {
      this.clear();
      return;
    }

    if (result.output) {
      if (result.exitCode !== 0) {
        this.echo(`[[;#f44;]${result.output}]`);
      } else if (result.output.startsWith('Hint:')) {
        this.echo(`[[;#fa0;]${result.output}]`);
      } else {
        this.echo(result.output);
      }
    }

    if (result.advanced) {
      this.echo('[[;#0f0;]✓ Nice work!]');

      if (result.won) {
        printWinScreen(this);
        return;
      }

      if (result.newLevel) {
        printLevelHeader(this, game.currentLevel, result.levelTitle);
        printStory(this, result.story);
      }

      printObjective(this, result.newObjective);
    }
  }, {
    greetings: false,
    prompt: formatPrompt,
    completion: getCompletions,
    onInit: function() {
      printLevelHeader(this, game.currentLevel, game.getLevelTitle());
      printStory(this, game.getStory());
      printObjective(this, game.getObjective());
    },
  });
});
