# Module Reorganization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize the codebase to separate gameplay content (levels, story, win conditions) from engine code (filesystem, commands, game loop) for easier editing and maintenance.

**Architecture:** Split the current flat `js/` directory into organized subdirectories: `js/engine/` for core systems, `js/gameplay/` for content, and `js/ui/` for presentation. Create a developer guide documenting the new structure.

**Tech Stack:** Vanilla JavaScript ES6 modules, jQuery Terminal, no build tools

---

## Current Structure Analysis

**Current layout:**
```
js/
├── commands.js      # ~260 lines - all bash command implementations
├── filesystem.js    # ~180 lines - virtual filesystem engine
├── game.js          # ~192 lines - game loop, win checking, completions
├── levels.js        # ~400 lines - all level definitions (GAMEPLAY CONTENT)
├── main.js          # ~108 lines - UI initialization and terminal setup
└── parser.js        # ~50 lines - command parsing
```

**Problems:**
- Gameplay content (levels, story, objectives) mixed with engine code
- Hard to find what to edit when creating new levels
- No clear separation between "what the game does" vs "what the game teaches"
- Command implementations in one giant file

**Target layout:**
```
js/
├── engine/
│   ├── filesystem.js    # Virtual FS - unchanged
│   ├── parser.js        # Command parsing - unchanged
│   ├── executor.js      # Pipeline execution (extracted from game.js)
│   └── commands/
│       ├── index.js     # Command registry
│       ├── navigation.js  # pwd, cd, ls
│       ├── files.js       # cat, echo, mkdir, cp, mv, rm
│       ├── permissions.js # chmod
│       └── meta.js        # help, hint, clear
├── gameplay/
│   ├── levels.js        # Level definitions - MAIN CONTENT FILE
│   ├── chapters.js      # Chapter metadata
│   └── win-conditions.js # Reusable win condition helpers
├── ui/
│   ├── terminal.js      # Terminal setup and formatting
│   └── game-loop.js     # Game state management (from game.js)
└── main.js              # Entry point - just wires everything together
```

---

## Task 1: Create Directory Structure

**Files:**
- Create: `js/engine/`
- Create: `js/engine/commands/`
- Create: `js/gameplay/`
- Create: `js/ui/`

**Step 1: Create directories**

```bash
mkdir -p js/engine/commands js/gameplay js/ui
```

**Step 2: Verify structure**

```bash
ls -la js/
```

Expected: See `engine/`, `gameplay/`, `ui/` directories

**Step 3: Commit**

```bash
git add js/
git commit -m "chore: create directory structure for module reorganization"
```

---

## Task 2: Split Commands into Logical Modules

**Files:**
- Create: `js/engine/commands/navigation.js`
- Create: `js/engine/commands/files.js`
- Create: `js/engine/commands/permissions.js`
- Create: `js/engine/commands/meta.js`
- Create: `js/engine/commands/index.js`

**Step 1: Create navigation commands module**

File: `js/engine/commands/navigation.js`

```javascript
export const navigationCommands = {
  pwd(args, stdin, fs) {
    return {
      stdout: fs.cwd,
      stderr: '',
      exitCode: 0,
    };
  },

  cd(args, stdin, fs) {
    if (args.length === 0) {
      fs.cwd = fs.homePath;
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    const newPath = args[0];
    const resolved = fs.resolvePath(newPath);

    if (!resolved) {
      return {
        stdout: '',
        stderr: `cd: ${newPath}: No such file or directory`,
        exitCode: 1,
      };
    }

    if (resolved.type !== 'dir') {
      return {
        stdout: '',
        stderr: `cd: ${newPath}: Not a directory`,
        exitCode: 1,
      };
    }

    fs.cwd = fs.getFullPath(resolved);
    return { stdout: '', stderr: '', exitCode: 0 };
  },

  ls(args, stdin, fs) {
    let showHidden = false;
    const paths = [];

    for (const arg of args) {
      if (arg === '-a' || arg === '-la' || arg === '-al') {
        showHidden = true;
      } else if (!arg.startsWith('-')) {
        paths.push(arg);
      }
    }

    if (paths.length === 0) {
      paths.push('.');
    }

    const outputs = [];

    for (const path of paths) {
      const node = fs.resolvePath(path);

      if (!node) {
        return {
          stdout: '',
          stderr: `ls: cannot access '${path}': No such file or directory`,
          exitCode: 1,
        };
      }

      if (node.type === 'file') {
        outputs.push(node.name);
        continue;
      }

      const entries = Object.values(node.children)
        .filter(entry => showHidden || !entry.name.startsWith('.'))
        .map(entry => entry.name)
        .sort();

      outputs.push(entries.join('\n'));
    }

    return {
      stdout: outputs.join('\n'),
      stderr: '',
      exitCode: 0,
    };
  },
};
```

**Step 2: Create file commands module**

File: `js/engine/commands/files.js`

```javascript
function copyTree(fs, srcPath, destPath) {
  const content = fs.readFile(srcPath);
  if (content !== null) {
    return fs.writeFile(destPath, content);
  }
  const entries = fs.listDir(srcPath);
  if (!entries) return false;
  if (!fs.createDir(destPath)) return false;
  for (const entry of entries) {
    if (!copyTree(fs, srcPath + '/' + entry.name, destPath + '/' + entry.name)) return false;
  }
  return true;
}

export const fileCommands = {
  cat(args, stdin, fs) {
    if (args.length === 0) {
      return { stdout: stdin, stderr: '', exitCode: 0 };
    }

    const outputs = [];
    for (const path of args) {
      const content = fs.readFile(path);
      if (content === null) {
        return {
          stdout: '',
          stderr: `cat: ${path}: No such file or directory`,
          exitCode: 1,
        };
      }
      outputs.push(content);
    }

    return {
      stdout: outputs.join('\n'),
      stderr: '',
      exitCode: 0,
    };
  },

  echo(args, stdin, fs) {
    const text = args.join(' ');
    return {
      stdout: text,
      stderr: '',
      exitCode: 0,
    };
  },

  mkdir(args, stdin, fs) {
    const paths = args.filter(a => !a.startsWith('-'));
    if (paths.length === 0) {
      return {
        stdout: '',
        stderr: 'mkdir: missing operand',
        exitCode: 1,
      };
    }
    for (const path of paths) {
      if (!fs.createDir(path)) {
        return {
          stdout: '',
          stderr: `mkdir: cannot create directory '${path}': File exists`,
          exitCode: 1,
        };
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },

  cp(args, stdin, fs) {
    const paths = args.filter(a => !a.startsWith('-'));
    if (paths.length < 2) {
      return {
        stdout: '',
        stderr: 'cp: missing file operand',
        exitCode: 1,
      };
    }
    const srcPath = paths[0];
    const destPath = paths[1];
    if (!copyTree(fs, srcPath, destPath)) {
      return {
        stdout: '',
        stderr: `cp: cannot copy '${srcPath}' to '${destPath}'`,
        exitCode: 1,
      };
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },

  mv(args, stdin, fs) {
    const paths = args.filter(a => !a.startsWith('-'));
    if (paths.length < 2) {
      return {
        stdout: '',
        stderr: 'mv: missing file operand',
        exitCode: 1,
      };
    }
    const srcPath = paths[0];
    const destPath = paths[1];
    const content = fs.readFile(srcPath);
    if (content !== null) {
      if (!fs.writeFile(destPath, content)) {
        return {
          stdout: '',
          stderr: `mv: cannot move '${srcPath}' to '${destPath}'`,
          exitCode: 1,
        };
      }
      const perms = fs.getPermissions(srcPath);
      fs.setPermissions(destPath, perms);
      if (!fs.deleteEntry(srcPath)) {
        return {
          stdout: '',
          stderr: `mv: cannot remove '${srcPath}'`,
          exitCode: 1,
        };
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }
    const entries = fs.listDir(srcPath);
    if (!entries) {
      return {
        stdout: '',
        stderr: `mv: cannot stat '${srcPath}': No such file or directory`,
        exitCode: 1,
      };
    }
    if (!fs.createDir(destPath)) {
      return {
        stdout: '',
        stderr: `mv: cannot move '${srcPath}' to '${destPath}': File exists`,
        exitCode: 1,
      };
    }
    for (const entry of entries) {
      if (!copyTree(fs, srcPath + '/' + entry.name, destPath + '/' + entry.name)) {
        return {
          stdout: '',
          stderr: `mv: cannot move '${srcPath}' to '${destPath}'`,
          exitCode: 1,
        };
      }
    }
    if (!fs.deleteEntry(srcPath)) {
      return {
        stdout: '',
        stderr: `mv: cannot remove '${srcPath}'`,
        exitCode: 1,
      };
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },

  rm(args, stdin, fs) {
    const paths = args.filter(a => !a.startsWith('-'));
    if (paths.length === 0) {
      return {
        stdout: '',
        stderr: 'rm: missing operand',
        exitCode: 1,
      };
    }
    for (const path of paths) {
      if (!fs.deleteEntry(path)) {
        return {
          stdout: '',
          stderr: `rm: cannot remove '${path}': No such file or directory`,
          exitCode: 1,
        };
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },
};
```

**Step 3: Create permissions commands module**

File: `js/engine/commands/permissions.js`

```javascript
export const permissionCommands = {
  chmod(args, stdin, fs) {
    if (args.length < 2) {
      return {
        stdout: '',
        stderr: 'chmod: missing operand',
        exitCode: 1,
      };
    }
    const mode = args[0];
    const path = args[1];
    if (!fs.resolvePath(path)) {
      return {
        stdout: '',
        stderr: `chmod: cannot access '${path}': No such file or directory`,
        exitCode: 1,
      };
    }
    const perms = fs.getPermissions(path);
    if (mode === '+x') {
      perms.add('x');
    } else if (mode === '-x') {
      perms.delete('x');
    } else if (mode === '+r') {
      perms.add('r');
    } else if (mode === '-r') {
      perms.delete('r');
    } else if (mode === '+w') {
      perms.add('w');
    } else if (mode === '-w') {
      perms.delete('w');
    }
    fs.setPermissions(path, perms);
    return { stdout: '', stderr: '', exitCode: 0 };
  },
};
```

**Step 4: Create meta commands module**

File: `js/engine/commands/meta.js`

```javascript
export const metaCommands = {
  help(args, stdin, fs) {
    return {
      stdout: `Available commands:
  Navigation: pwd, cd, ls
  Files: cat, echo, mkdir, cp, mv, rm
  Permissions: chmod
  Meta: help, hint, clear

Type 'hint' for help with the current objective.`,
      stderr: '',
      exitCode: 0,
    };
  },

  clear(args, stdin, fs) {
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
      clear: true,
    };
  },
};
```

**Step 5: Create command registry index**

File: `js/engine/commands/index.js`

```javascript
import { navigationCommands } from './navigation.js';
import { fileCommands } from './files.js';
import { permissionCommands } from './permissions.js';
import { metaCommands } from './meta.js';

export const commands = {
  ...navigationCommands,
  ...fileCommands,
  ...permissionCommands,
  ...metaCommands,
};

export const COMMAND_NAMES = Object.keys(commands).sort();
```

**Step 6: Run tests to verify nothing broke**

```bash
npm test -- commands.test.js
```

Expected: All tests should still pass (they import from old location, so they'll fail - we'll fix in next task)

**Step 7: Commit**

```bash
git add js/engine/commands/
git commit -m "refactor: split commands into logical modules (navigation, files, permissions, meta)"
```

---

## Task 3: Move Core Engine Files

**Files:**
- Move: `js/filesystem.js` → `js/engine/filesystem.js`
- Move: `js/parser.js` → `js/engine/parser.js`
- Create: `js/engine/executor.js`

**Step 1: Move filesystem to engine**

```bash
git mv js/filesystem.js js/engine/filesystem.js
```

**Step 2: Move parser to engine**

```bash
git mv js/parser.js js/engine/parser.js
```

**Step 3: Create executor module (extracted from game.js)**

File: `js/engine/executor.js`

```javascript
import { parse } from './parser.js';
import { commands } from './commands/index.js';

export function executePipeline(input, fs) {
  const ast = parse(input);

  if (ast.pipeline.length === 0) {
    return { output: '', exitCode: 0 };
  }

  // Script execution: ./path (single-command only; args and redirects are intentionally not forwarded)
  if (ast.pipeline.length === 1 && ast.pipeline[0].cmd.startsWith('./')) {
    const scriptPath = ast.pipeline[0].cmd;
    const content = fs.readFile(scriptPath);
    if (content === null) {
      return { output: `${scriptPath}: No such file or directory`, exitCode: 127 };
    }
    if (!fs.getPermissions(scriptPath).has('x')) {
      return { output: `${scriptPath}: Permission denied`, exitCode: 126 };
    }
    return { output: content, exitCode: 0 };
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
```

**Step 4: Commit**

```bash
git add js/engine/
git commit -m "refactor: move filesystem, parser to engine/ and extract executor from game.js"
```

---

## Task 4: Move Gameplay Content

**Files:**
- Move: `js/levels.js` → `js/gameplay/levels.js`
- Create: `js/gameplay/chapters.js`
- Create: `js/gameplay/win-conditions.js`

**Step 1: Move levels to gameplay**

```bash
git mv js/levels.js js/gameplay/levels.js
```

**Step 2: Create chapters metadata file**

File: `js/gameplay/chapters.js`

```javascript
export const chapters = [
  {
    id: 1,
    title: 'Getting In',
    description: 'You\'re in. The server is quiet. Figure out where you are and what\'s here.',
    commands: ['ls', 'cd', 'pwd'],
  },
  {
    id: 2,
    title: 'Reading the Server',
    description: 'Data is everywhere on this thing. You need to read it — and sometimes write to it.',
    commands: ['cat', 'echo', '>', '>>'],
  },
  {
    id: 3,
    title: 'Moving Pieces',
    description: 'You need to organize what you\'ve found — and cover your tracks.',
    commands: ['mkdir', 'cp', 'mv', 'rm', 'chmod'],
  },
  {
    id: 4,
    title: 'The Data Pipeline',
    description: 'The server is full of noise. You need to filter signal from static.',
    commands: ['|', 'wc', 'sort'],
  },
  // Chapters 5-7 to be implemented
];

export function getChapter(chapterId) {
  return chapters.find(ch => ch.id === chapterId);
}

export function getChapterForLevel(levelId) {
  // Levels 1-3 = Chapter 1, 4-6 = Chapter 2, etc.
  const chapterNum = Math.ceil(levelId / 3);
  return getChapter(chapterNum);
}
```

**Step 3: Create reusable win condition helpers**

File: `js/gameplay/win-conditions.js`

```javascript
/**
 * Reusable win condition helpers for common patterns
 */

export const winConditions = {
  /**
   * Check if command matches exactly
   */
  exactCommand: (expectedCmd) => (cmd, output, fs) => {
    return cmd.trim() === expectedCmd;
  },

  /**
   * Check if command starts with given string
   */
  commandStartsWith: (prefix) => (cmd, output, fs) => {
    return cmd.trim().startsWith(prefix);
  },

  /**
   * Check if command includes specific substrings
   */
  commandIncludes: (...parts) => (cmd, output, fs) => {
    return parts.every(part => cmd.includes(part));
  },

  /**
   * Check if current directory changed to expected path
   */
  changedToDir: (expectedPath) => (cmd, output, fs) => {
    return fs.cwd === expectedPath;
  },

  /**
   * Check if file exists at path
   */
  fileExists: (path) => (cmd, output, fs) => {
    return fs.readFile(path) !== null;
  },

  /**
   * Check if file contains expected content
   */
  fileContains: (path, expectedContent) => (cmd, output, fs) => {
    const content = fs.readFile(path);
    return content !== null && content.includes(expectedContent);
  },

  /**
   * Check if file content matches exactly
   */
  fileMatches: (path, expectedContent) => (cmd, output, fs) => {
    return fs.readFile(path) === expectedContent;
  },

  /**
   * Check if directory exists
   */
  dirExists: (path) => (cmd, output, fs) => {
    const node = fs.resolvePath(path);
    return node !== null && node.type === 'dir';
  },

  /**
   * Check if file has specific permission
   */
  hasPermission: (path, permission) => (cmd, output, fs) => {
    const perms = fs.getPermissions(path);
    return perms.has(permission);
  },

  /**
   * Combine multiple conditions with AND logic
   */
  all: (...conditions) => (cmd, output, fs) => {
    return conditions.every(condition => condition(cmd, output, fs));
  },

  /**
   * Combine multiple conditions with OR logic
   */
  any: (...conditions) => (cmd, output, fs) => {
    return conditions.some(condition => condition(cmd, output, fs));
  },
};
```

**Step 4: Commit**

```bash
git add js/gameplay/
git commit -m "refactor: move levels to gameplay/ and add chapter metadata + win condition helpers"
```

---

## Task 5: Reorganize UI Layer

**Files:**
- Create: `js/ui/game-loop.js`
- Create: `js/ui/terminal.js`
- Modify: `js/main.js`

**Step 1: Create game loop module (extracted from game.js)**

File: `js/ui/game-loop.js`

```javascript
import { levels } from '../gameplay/levels.js';
import { createFilesystem } from '../engine/filesystem.js';
import { executePipeline } from '../engine/executor.js';

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
          if (levels[currentLevel].chapter !== levels[currentLevel - 1].chapter) {
            result.chapterComplete = true;
            result.completedChapter = levels[currentLevel - 1].chapter;
          }
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
```

**Step 2: Create terminal UI module (extracted from main.js)**

File: `js/ui/terminal.js`

```javascript
import { COMMAND_NAMES } from '../engine/commands/index.js';

export function formatPrompt(fs) {
  const path = fs.cwd === '/home/analyst'
    ? '~'
    : fs.cwd.replace('/home/analyst', '~');
  return `[[;#0f0;]analyst@nexus-srv-04:${path}$] `;
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
```

**Step 3: Update main.js to wire everything together**

File: `js/main.js` (replace entire file)

```javascript
import { createGame } from './ui/game-loop.js';
import {
  formatPrompt,
  printStory,
  printObjective,
  printLevelHeader,
  printWinScreen,
  printChapterComplete,
  getCompletions,
} from './ui/terminal.js';

const game = createGame();

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

      if (result.chapterComplete) {
        printChapterComplete(this, result.completedChapter);
      }

      if (result.newLevel) {
        printLevelHeader(this, game.currentLevel, result.levelTitle);
        printStory(this, result.story);
      }

      printObjective(this, result.newObjective);
    }
  }, {
    greetings: false,
    prompt: () => formatPrompt(game.fs),
    completion: (str) => getCompletions(str, game.fs),
    wordAutocomplete: false,
    completionEscape: false,
    onInit: function() {
      printLevelHeader(this, game.currentLevel, game.getLevelTitle());
      printStory(this, game.getStory());
      printObjective(this, game.getObjective());
    },
  });
});
```

**Step 4: Delete old game.js (now split into game-loop.js and executor.js)**

```bash
git rm js/game.js
```

**Step 5: Commit**

```bash
git add js/ui/ js/main.js
git commit -m "refactor: reorganize UI layer into game-loop and terminal modules, update main.js"
```

---

## Task 6: Update All Import Paths

**Files:**
- Modify: `js/ui/game-loop.js`
- Modify: `js/ui/terminal.js`
- Modify: `js/engine/executor.js`
- Modify: `js/main.js`
- Modify: All test files

**Step 1: Update test imports - filesystem.test.js**

```bash
sed -i "s|from '../js/filesystem.js'|from '../js/engine/filesystem.js'|g" tests/filesystem.test.js
```

**Step 2: Update test imports - parser.test.js**

```bash
sed -i "s|from '../js/parser.js'|from '../js/engine/parser.js'|g" tests/parser.test.js
```

**Step 3: Update test imports - commands.test.js**

```bash
sed -i "s|from '../js/commands.js'|from '../js/engine/commands/index.js'|g" tests/commands.test.js
sed -i "s|from '../js/filesystem.js'|from '../js/engine/filesystem.js'|g" tests/commands.test.js
```

**Step 4: Update test imports - game.test.js**

```bash
sed -i "s|from '../js/game.js'|from '../js/ui/game-loop.js'|g" tests/game.test.js
sed -i "s|from '../js/filesystem.js'|from '../js/engine/filesystem.js'|g" tests/game.test.js
```

**Step 5: Update test imports - levels.test.js**

```bash
sed -i "s|from '../js/levels.js'|from '../js/gameplay/levels.js'|g" tests/levels.test.js
sed -i "s|from '../js/game.js'|from '../js/ui/game-loop.js'|g" tests/levels.test.js
```

**Step 6: Run all tests to verify**

```bash
npm test
```

Expected: All tests pass

**Step 7: Commit**

```bash
git add tests/
git commit -m "refactor: update test imports to match new module structure"
```

---

## Task 7: Update index.html Script Paths

**Files:**
- Modify: `index.html`

**Step 1: Read current index.html to understand script loading**

```bash
cat index.html
```

**Step 2: Update script tag to point to new main.js location**

The main.js is still at `js/main.js` so no change needed, but verify it's importing from correct paths.

**Step 3: Test in browser**

Open `index.html` in browser and verify game loads and works correctly.

**Step 4: Commit if any changes**

```bash
git add index.html
git commit -m "refactor: verify index.html script paths after reorganization"
```

---

## Task 8: Create Developer Documentation

**Files:**
- Create: `docs/MODULE_ORGANIZATION.md`
- Create: `docs/ADDING_LEVELS.md`

**Step 1: Create module organization guide**

File: `docs/MODULE_ORGANIZATION.md`

````markdown
# Module Organization Guide

## Directory Structure

```
js/
├── engine/          # Core game engine (rarely edited)
│   ├── filesystem.js       # Virtual filesystem implementation
│   ├── parser.js           # Command parsing (pipes, redirects)
│   ├── executor.js         # Pipeline execution
│   └── commands/           # All bash command implementations
│       ├── index.js        # Command registry
│       ├── navigation.js   # pwd, cd, ls
│       ├── files.js        # cat, echo, mkdir, cp, mv, rm
│       ├── permissions.js  # chmod
│       └── meta.js         # help, hint, clear
│
├── gameplay/        # Game content (edit this to change levels!)
│   ├── levels.js           # ⭐ MAIN CONTENT FILE - all level definitions
│   ├── chapters.js         # Chapter metadata
│   └── win-conditions.js   # Reusable win condition helpers
│
├── ui/              # Presentation layer
│   ├── game-loop.js        # Game state management
│   └── terminal.js         # Terminal formatting and display
│
└── main.js          # Entry point - wires everything together
```

## What to Edit When...

### Adding a New Level
**Edit:** `js/gameplay/levels.js`

See `docs/ADDING_LEVELS.md` for detailed guide.

### Adding a New Command
**Edit:** `js/engine/commands/files.js` (or appropriate module)

1. Add function to relevant command module
2. Function signature: `(args, stdin, fs) => { stdout, stderr, exitCode }`
3. Update `js/engine/commands/index.js` if creating new module
4. Add to `COMMAND_NAMES` array in `js/ui/terminal.js` for tab completion
5. Write tests in `tests/commands.test.js`

### Changing Win Conditions
**Edit:** `js/gameplay/levels.js` or `js/gameplay/win-conditions.js`

Win conditions are functions: `(cmd, output, fs) => boolean`

Use helpers from `win-conditions.js` for common patterns:
- `winConditions.exactCommand('pwd')`
- `winConditions.fileExists('/path/to/file')`
- `winConditions.changedToDir('/home/analyst/internal')`

### Changing Story/Objectives
**Edit:** `js/gameplay/levels.js`

Each level has:
- `story`: Intro text shown at level start
- `subSteps[].objective`: Task description shown to player
- `subSteps[].hints`: Array of escalating hints

### Changing Terminal Colors/Formatting
**Edit:** `js/ui/terminal.js` or `style.css`

Terminal uses jQuery Terminal color codes: `[[;#color;]text]`

### Modifying Filesystem Behavior
**Edit:** `js/engine/filesystem.js`

Handles path resolution, file reading/writing, permissions.

### Modifying Command Parsing
**Edit:** `js/engine/parser.js`

Parses `cmd1 | cmd2 > file` into AST.

## Module Dependencies

```
main.js
  ├─→ ui/game-loop.js
  │     ├─→ gameplay/levels.js
  │     ├─→ engine/filesystem.js
  │     └─→ engine/executor.js
  │           ├─→ engine/parser.js
  │           └─→ engine/commands/index.js
  │                 ├─→ engine/commands/navigation.js
  │                 ├─→ engine/commands/files.js
  │                 ├─→ engine/commands/permissions.js
  │                 └─→ engine/commands/meta.js
  └─→ ui/terminal.js
        └─→ engine/commands/index.js (for COMMAND_NAMES)
```

## Design Principles

### Separation of Concerns
- **Engine** = HOW the game works (filesystem, parsing, execution)
- **Gameplay** = WHAT the game teaches (levels, story, win conditions)
- **UI** = HOW the game looks (terminal formatting, prompts, colors)

### Content vs Code
- Adding levels should not require understanding the engine
- `levels.js` is pure data - anyone can edit it
- Win condition helpers make content creation easier

### No Framework Bloat
- No build step, no transpilation
- ES6 modules via `<script type="module">`
- Dependency graph is simple and explicit

## Testing

Tests mirror the module structure:

```
tests/
├── filesystem.test.js   # Tests js/engine/filesystem.js
├── parser.test.js       # Tests js/engine/parser.js
├── commands.test.js     # Tests js/engine/commands/
├── game.test.js         # Tests js/ui/game-loop.js
└── levels.test.js       # Tests js/gameplay/levels.js
```

Run tests: `npm test`
````

**Step 2: Create level-adding guide**

File: `docs/ADDING_LEVELS.md`

````markdown
# Adding Levels Guide

## Quick Start

1. Open `js/gameplay/levels.js`
2. Copy an existing level object as a template
3. Modify the fields (see structure below)
4. Test in browser
5. Done!

## Level Object Structure

```javascript
{
  id: 10,                    // Unique sequential number
  chapter: 4,                // Which chapter (1-7)
  title: 'Basic Pipes',      // Short title shown in level header
  story: `Multi-line story text here...`, // Intro narrative
  filesystem: {              // Starting filesystem for this level
    home: {
      analyst: {
        'data.txt': 'file contents here',
        subfolder: {
          'another.txt': 'more content',
        },
      },
    },
  },
  startDir: '/home/analyst', // Where player starts
  subSteps: [                // Array of 3-4 sub-objectives
    {
      objective: 'Task description shown to player',
      hints: [
        'First hint (gentle nudge)',
        'Second hint (more specific)',
        'Final hint (almost the answer)',
      ],
      winCondition: (cmd, output, fs) => {
        // Return true when player succeeds
        return cmd.trim() === 'pwd';
      },
    },
    // ... more substeps
  ],
}
```

## Win Condition Patterns

### Using Helpers (Recommended)

```javascript
import { winConditions } from './win-conditions.js';

// Check exact command
winCondition: winConditions.exactCommand('pwd')

// Check command starts with
winCondition: winConditions.commandStartsWith('ls')

// Check command includes multiple parts
winCondition: winConditions.commandIncludes('cat', 'welcome.txt')

// Check directory changed
winCondition: winConditions.changedToDir('/home/analyst/internal')

// Check file exists
winCondition: winConditions.fileExists('/tmp/output.txt')

// Check file content
winCondition: winConditions.fileContains('/tmp/note.txt', 'secret message')
winCondition: winConditions.fileMatches('/tmp/note.txt', 'exact content')

// Check permissions
winCondition: winConditions.hasPermission('./script.sh', 'x')

// Combine multiple conditions
winCondition: winConditions.all(
  winConditions.fileExists('/tmp/output.txt'),
  winConditions.commandIncludes('echo', '>')
)
```

### Custom Win Conditions

```javascript
winCondition: (cmd, output, fs) => {
  // cmd = the command string player typed
  // output = the output from running the command
  // fs = filesystem object (check state with fs.readFile(), fs.cwd, etc)

  // Example: Check if user created specific directory structure
  const hasDir = fs.resolvePath('/home/analyst/evidence');
  const hasFile = fs.readFile('/home/analyst/evidence/data.txt');
  return hasDir && hasDir.type === 'dir' && hasFile !== null;
}
```

## Filesystem Structure

Filesystem is a nested object where:
- Strings = file contents
- Objects = directories containing more files/directories

```javascript
filesystem: {
  home: {
    analyst: {
      'simple-file.txt': 'This is a file',
      'another.txt': 'More content',
      documents: {
        'nested-file.txt': 'Inside documents folder',
        'report.txt': 'Multi-line\ncontent\nworks too',
      },
    },
  },
  var: {
    log: {
      'system.log': 'Log entry 1\nLog entry 2',
    },
  },
}
```

## Best Practices

### Story Writing
- Keep it concise (3-5 lines max)
- Make it feel realistic (you're on a Linux server)
- Hint at what the player should do, but don't give it away
- Use the hacker/sysadmin theme

### Objectives
- Start with a verb: "Use `pwd` to...", "Navigate to...", "Create a file..."
- Be specific about what to type when teaching new commands
- Reference actual files/directories in the level's filesystem
- One clear goal per substep

### Hints
- First hint: conceptual reminder ("pwd shows your current location")
- Second hint: command name or approach ("Try the pwd command")
- Third hint: nearly the exact answer ("Type: pwd")
- Always provide 2-3 hints per substep

### SubSteps
- 3 substeps is ideal (more = level feels long)
- 4 substeps for complex multi-step procedures
- Each substep should take 30-120 seconds to complete
- First substep teaches the concept
- Second substep reinforces it
- Third substep tests understanding

### Win Conditions
- Prefer using helpers from `win-conditions.js` over custom functions
- Test both positive and negative cases (should pass when right, fail when wrong)
- Don't check for specific output text when command itself is sufficient
- For file creation, check `fs.readFile()` result, not output

## Testing Your Level

### In Browser
1. Save `levels.js`
2. Refresh browser
3. Play through to your new level
4. Try to "break" it - type wrong commands, edge cases
5. Verify hints make sense in sequence

### Writing Automated Tests

Add to `tests/levels.test.js`:

```javascript
test('Level 10: Basic Pipes - substep 1', () => {
  const game = createGame();
  // ... advance to level 10 ...

  const result = game.runCommand('cat data.txt');
  expect(result.advanced).toBe(true);
  expect(result.newObjective).toContain('next task');
});
```

## Example: Complete Level

```javascript
{
  id: 10,
  chapter: 4,
  title: 'Basic Pipes',
  story: `The server generates thousands of log entries every hour.

Reading raw logs is like drinking from a firehose. You need to filter them.

Time to learn the power of pipes: feeding one command's output into another.`,
  filesystem: {
    home: {
      analyst: {
        'users.txt': 'alice\nbob\ncharlie\nadmin\nroot\nguest',
        logs: {
          'access.log': '192.168.1.1 GET /\n10.0.0.5 POST /api\n192.168.1.1 GET /login',
        },
      },
    },
  },
  startDir: '/home/analyst',
  subSteps: [
    {
      objective: 'Use `cat users.txt` to display the user list.',
      hints: [
        'cat shows file contents',
        'Type: cat users.txt',
      ],
      winCondition: winConditions.commandIncludes('cat', 'users.txt'),
    },
    {
      objective: 'Now pipe that list through `grep admin` to find the admin user: `cat users.txt | grep admin`',
      hints: [
        'The pipe symbol | sends output from left command to right command',
        'Format: cat file.txt | grep pattern',
        'Type: cat users.txt | grep admin',
      ],
      winCondition: winConditions.all(
        winConditions.commandIncludes('cat', 'users.txt'),
        winConditions.commandIncludes('|'),
        winConditions.commandIncludes('grep', 'admin')
      ),
    },
    {
      objective: 'Save the result to a file: `cat users.txt | grep admin > admin_users.txt`',
      hints: [
        'Add > filename to save output',
        'Combine pipe and redirect: cmd1 | cmd2 > file',
        'Type: cat users.txt | grep admin > admin_users.txt',
      ],
      winCondition: winConditions.fileContains('admin_users.txt', 'admin'),
    },
  ],
}
```

## Common Mistakes

❌ **Too much story**: Keep it under 5 lines
✅ **Brief and focused**: 2-3 lines setting the scene

❌ **Vague objectives**: "Explore the filesystem"
✅ **Specific objectives**: "Navigate to the internal directory with `cd internal`"

❌ **Hints too cryptic**: "Think about navigation"
✅ **Hints escalate**: "pwd shows location" → "Use pwd" → "Type: pwd"

❌ **Complex win conditions**: Checking 5 different things
✅ **Simple win conditions**: Use helpers, check one thing well

❌ **Empty filesystem**: Just one or two files
✅ **Realistic filesystem**: Red herrings, nested dirs, hidden files

## Need Help?

- Check existing levels in `levels.js` for patterns
- Use win condition helpers from `win-conditions.js`
- Test thoroughly in browser before committing
- Read `MODULE_ORGANIZATION.md` for architecture overview
````

**Step 3: Commit documentation**

```bash
git add docs/
git commit -m "docs: add module organization and level-adding guides"
```

---

## Task 9: Update README

**Files:**
- Modify: `README.md` (if exists) or Create it

**Step 1: Create or update README.md**

File: `README.md`

```markdown
# BashTreasureHunt

A browser-based bash learning game. No installation required - just open and play!

## For Players

Open `index.html` in your browser and start learning bash commands through interactive missions.

## For Developers

### Project Structure

```
BashTreasureHunt/
├── js/
│   ├── engine/       # Core game engine (filesystem, parser, commands)
│   ├── gameplay/     # Level content (edit this to add levels!)
│   ├── ui/           # Terminal display and game loop
│   └── main.js       # Entry point
├── tests/            # Jest tests
├── docs/             # Documentation
│   ├── MODULE_ORGANIZATION.md  # Architecture overview
│   ├── ADDING_LEVELS.md        # How to create levels
│   └── plans/                  # Implementation plans
├── index.html        # Game entry point
└── style.css         # Terminal styling
```

### Quick Start (Development)

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run specific test file
npm test -- filesystem.test.js

# Open game in browser
open index.html
```

### Adding Content

**Want to add a new level?**
1. Open `js/gameplay/levels.js`
2. Copy an existing level as template
3. Modify story, objectives, filesystem
4. See `docs/ADDING_LEVELS.md` for detailed guide

**Want to add a new command?**
1. Edit appropriate file in `js/engine/commands/`
2. Add tests in `tests/commands.test.js`
3. See `docs/MODULE_ORGANIZATION.md` for details

### Documentation

- **[Module Organization](docs/MODULE_ORGANIZATION.md)** - How the code is structured
- **[Adding Levels](docs/ADDING_LEVELS.md)** - Step-by-step guide to creating content
- **[Design Document](DESIGN.md)** - Original vision and curriculum plan

### Tech Stack

- Vanilla JavaScript (ES6 modules)
- jQuery Terminal (terminal emulation)
- Jest (testing)
- No build step - pure static files

### Current Progress

- ✅ Chapter 1: Navigation (ls, cd, pwd)
- ✅ Chapter 2: File I/O (cat, echo, redirects)
- ✅ Chapter 3: File Operations (mkdir, cp, mv, rm, chmod)
- 🔜 Chapter 4: Pipes (|, wc, sort)
- 📋 Chapters 5-7: grep, find, sed

## License

[Your license here]
```

**Step 2: Commit README**

```bash
git add README.md
git commit -m "docs: add comprehensive README with project overview"
```

---

## Task 10: Final Testing & Verification

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass

**Step 2: Test in browser**

Open `index.html` and verify:
- Game loads without errors
- Level 1 starts correctly
- Commands work (pwd, ls, cd, cat, etc)
- Can progress through levels
- Tab completion works
- Hints work

**Step 3: Check all imports are correct**

```bash
grep -r "from '\.\./js/" js/
```

Expected: No results (all imports should use new paths)

**Step 4: Verify no old files remain**

```bash
ls js/*.js
```

Expected: Only `main.js` should be at root of `js/`

**Step 5: Final commit**

```bash
git add .
git commit -m "refactor: complete module reorganization - engine/gameplay/ui separation"
```

---

## Summary

After completing this plan, the codebase will have:

### Clear Separation
- **`js/engine/`** - Core systems (rarely touched)
- **`js/gameplay/`** - Content that changes frequently
- **`js/ui/`** - Presentation layer

### Better Developer Experience
- Want to add levels? Edit `js/gameplay/levels.js`
- Want to change win logic? Use helpers in `js/gameplay/win-conditions.js`
- Want to add commands? Edit specific file in `js/engine/commands/`
- Everything has its place

### Documentation
- `docs/MODULE_ORGANIZATION.md` - Architecture guide
- `docs/ADDING_LEVELS.md` - Content creation guide
- `README.md` - Project overview
- Clear import paths reflecting structure

### No Breaking Changes
- All tests still pass
- Game functionality unchanged
- Just better organized

---

## Next Steps After This Refactor

With clean module organization in place:

1. **Add Chapter 4 levels** (pipes, wc, sort) in `js/gameplay/levels.js`
2. **Implement wc command** in `js/engine/commands/files.js`
3. **Implement sort command** in `js/engine/commands/files.js`
4. **Implement grep command** (prep for Chapter 5) in new `js/engine/commands/filters.js`

The refactoring makes all future work easier!
