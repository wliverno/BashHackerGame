import { parse } from './parser.js';
import { commands } from './commands.js';
import { levels } from './levels.js';
import { createFilesystem } from './filesystem.js';

export function executePipeline(input, fs) {
  const ast = parse(input);

  if (ast.pipeline.length === 0) {
    return { output: '', exitCode: 0 };
  }

  let stdin = '';
  let lastResult = { stdout: '', stderr: '', exitCode: 0 };

  for (const { cmd, args } of ast.pipeline) {
    if (!commands[cmd]) {
      return {
        output: `${cmd}: command not found`,
        exitCode: 127,
      };
    }

    lastResult = commands[cmd](args, stdin, fs);
    stdin = lastResult.stdout;

    if (lastResult.exitCode !== 0) {
      break;
    }
  }

  if (ast.redirect && lastResult.exitCode === 0) {
    const writeResult = fs.writeFile(
      ast.redirect.file,
      lastResult.stdout,
      { append: ast.redirect.type === 'append' }
    );

    if (!writeResult) {
      return {
        output: `Cannot write to ${ast.redirect.file}`,
        exitCode: 1,
      };
    }

    return { output: '', exitCode: 0 };
  }

  const output = lastResult.stderr || lastResult.stdout;
  return {
    output,
    exitCode: lastResult.exitCode,
    clear: lastResult.clear,
  };
}

export function createGame() {
  let currentLevel = 0;
  let currentSubStep = 0;
  let hintIndex = 0;
  let won = false;

  const loadLevel = (levelIndex) => {
    const level = levels[levelIndex];
    const fs = createFilesystem(level.filesystem);
    fs.cwd = level.startDir;
    return fs;
  };

  let fs = loadLevel(0);

  const game = {
    get currentLevel() { return currentLevel; },
    get currentSubStep() { return currentSubStep; },
    get fs() { return fs; },
    get won() { return won; },

    getObjective() {
      return levels[currentLevel].subSteps[currentSubStep].objective;
    },

    getHint(index) {
      const hints = levels[currentLevel].subSteps[currentSubStep].hints;
      if (index < hints.length) {
        return hints[index];
      }
      return hints[hints.length - 1];
    },

    getNextHint() {
      const hint = this.getHint(hintIndex);
      hintIndex++;
      return hint;
    },

    getStory() {
      return levels[currentLevel].story;
    },

    getLevelTitle() {
      return levels[currentLevel].title;
    },

    runCommand(input) {
      if (input.trim() === 'hint') {
        const hint = this.getNextHint();
        return {
          output: `Hint: ${hint}`,
          exitCode: 0,
        };
      }

      const result = executePipeline(input, fs);

      const level = levels[currentLevel];
      const step = level.subSteps[currentSubStep];

      if (step.winCondition(input, result.output, fs)) {
        result.advanced = true;
        hintIndex = 0;

        if (currentSubStep < level.subSteps.length - 1) {
          currentSubStep++;
          result.newObjective = this.getObjective();
        } else if (currentLevel < levels.length - 1) {
          currentLevel++;
          currentSubStep = 0;
          fs = loadLevel(currentLevel);
          result.newLevel = true;
          result.newObjective = this.getObjective();
          result.story = this.getStory();
          result.levelTitle = this.getLevelTitle();
        } else {
          won = true;
          result.won = true;
        }
      }

      return result;
    },
  };

  return game;
}

const COMMANDS = ['cat', 'cd', 'clear', 'echo', 'help', 'hint', 'ls', 'pwd'];

export function getCompletions(str, fs) {
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
  const prefix = endsWithSpace ? str : parts.slice(0, -1).join(' ') + ' ';
  const entries = fs.listDir('.') || [];

  if (cmd === 'cd') {
    const dirs = entries.filter(e => e.type === 'dir').map(e => e.name);
    return ['..', ...dirs]
      .filter(n => n.startsWith(partial))
      .map(n => prefix + n);
  }

  return entries.map(e => e.name)
    .filter(n => n.startsWith(partial))
    .map(n => prefix + n);
}
