# BashTreasureHunt MVP (Chapter 1) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a playable browser-based bash learning game with levels 1-3 teaching `ls`, `cd`, `pwd`.

**Architecture:** Virtual filesystem (JS object tree) + command parser (tokenizes pipes/redirects into AST) + command executor (pure functions) + game loop (wires jQuery Terminal, checks win conditions). All modules are ES Modules with no build step.

**Tech Stack:** Vanilla JS (ES Modules), jQuery Terminal (CDN), Jest + jsdom for testing.

---

## Prerequisites

### Step 1: Initialize npm and install Jest

Run:
```bash
npm init -y
npm install --save-dev jest jest-environment-jsdom
```

### Step 2: Configure Jest for ES Modules

Create `jest.config.js`:
```js
export default {
  testEnvironment: 'jsdom',
  transform: {},
  moduleFileExtensions: ['js'],
  testMatch: ['**/tests/**/*.test.js'],
};
```

### Step 3: Update package.json for ES Modules

Add to `package.json`:
```json
{
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch"
  }
}
```

### Step 4: Create directory structure

Run:
```bash
mkdir -p js tests
```

### Step 5: Commit setup

Run:
```bash
git init
git add .
git commit -m "chore: initialize project with Jest and ES Modules"
```

---

## Task 1: Virtual Filesystem - Core Structure

**Files:**
- Create: `js/filesystem.js`
- Create: `tests/filesystem.test.js`

### Step 1: Write failing test for filesystem creation

Create `tests/filesystem.test.js`:
```js
import { createFilesystem } from '../js/filesystem.js';

describe('createFilesystem', () => {
  test('creates filesystem with root directory', () => {
    const fs = createFilesystem();
    expect(fs.root).toBeDefined();
    expect(fs.root.type).toBe('dir');
    expect(fs.root.name).toBe('/');
  });

  test('starts with cwd at root', () => {
    const fs = createFilesystem();
    expect(fs.cwd).toBe('/');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/filesystem.test.js`
Expected: FAIL with "Cannot find module"

### Step 3: Write minimal implementation

Create `js/filesystem.js`:
```js
export function createFilesystem() {
  const root = {
    type: 'dir',
    name: '/',
    children: {},
  };

  return {
    root,
    cwd: '/',
  };
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/filesystem.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/filesystem.js tests/filesystem.test.js
git commit -m "feat(fs): add createFilesystem with root directory"
```

---

## Task 2: Filesystem - Initialize from Object Tree

**Files:**
- Modify: `js/filesystem.js`
- Modify: `tests/filesystem.test.js`

### Step 1: Write failing test for initialization from tree

Add to `tests/filesystem.test.js`:
```js
describe('createFilesystem with initial tree', () => {
  test('creates filesystem from nested object', () => {
    const tree = {
      home: {
        analyst: {
          'readme.txt': 'Welcome to the server',
          projects: {},
        },
      },
    };
    const fs = createFilesystem(tree);

    expect(fs.root.children.home).toBeDefined();
    expect(fs.root.children.home.type).toBe('dir');
    expect(fs.root.children.home.children.analyst.children['readme.txt'].type).toBe('file');
    expect(fs.root.children.home.children.analyst.children['readme.txt'].content).toBe('Welcome to the server');
  });

  test('empty object creates empty directory', () => {
    const tree = { emptydir: {} };
    const fs = createFilesystem(tree);

    expect(fs.root.children.emptydir.type).toBe('dir');
    expect(fs.root.children.emptydir.children).toEqual({});
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/filesystem.test.js`
Expected: FAIL - tree not being parsed

### Step 3: Write minimal implementation

Update `js/filesystem.js`:
```js
function buildNode(name, value) {
  if (typeof value === 'string') {
    return { type: 'file', name, content: value };
  }
  const children = {};
  for (const [childName, childValue] of Object.entries(value)) {
    children[childName] = buildNode(childName, childValue);
  }
  return { type: 'dir', name, children };
}

export function createFilesystem(tree = {}) {
  const root = {
    type: 'dir',
    name: '/',
    children: {},
  };

  for (const [name, value] of Object.entries(tree)) {
    root.children[name] = buildNode(name, value);
  }

  return {
    root,
    cwd: '/',
  };
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/filesystem.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/filesystem.js tests/filesystem.test.js
git commit -m "feat(fs): initialize filesystem from nested object tree"
```

---

## Task 3: Filesystem - Resolve Path

**Files:**
- Modify: `js/filesystem.js`
- Modify: `tests/filesystem.test.js`

### Step 1: Write failing tests for resolvePath

Add to `tests/filesystem.test.js`:
```js
describe('resolvePath', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'readme.txt': 'hello',
          projects: {
            'notes.txt': 'secret',
          },
        },
      },
      var: {
        log: {},
      },
    });
  });

  test('resolves absolute path to directory', () => {
    const node = fs.resolvePath('/home/analyst');
    expect(node.type).toBe('dir');
    expect(node.name).toBe('analyst');
  });

  test('resolves absolute path to file', () => {
    const node = fs.resolvePath('/home/analyst/readme.txt');
    expect(node.type).toBe('file');
    expect(node.content).toBe('hello');
  });

  test('resolves root path', () => {
    const node = fs.resolvePath('/');
    expect(node).toBe(fs.root);
  });

  test('resolves relative path from cwd', () => {
    fs.cwd = '/home/analyst';
    const node = fs.resolvePath('projects');
    expect(node.type).toBe('dir');
    expect(node.name).toBe('projects');
  });

  test('resolves .. to parent directory', () => {
    fs.cwd = '/home/analyst/projects';
    const node = fs.resolvePath('..');
    expect(node.name).toBe('analyst');
  });

  test('resolves . to current directory', () => {
    fs.cwd = '/home/analyst';
    const node = fs.resolvePath('.');
    expect(node.name).toBe('analyst');
  });

  test('resolves complex relative path', () => {
    fs.cwd = '/home/analyst';
    const node = fs.resolvePath('../analyst/projects/../readme.txt');
    expect(node.type).toBe('file');
    expect(node.content).toBe('hello');
  });

  test('returns null for non-existent path', () => {
    const node = fs.resolvePath('/does/not/exist');
    expect(node).toBeNull();
  });

  test('resolves ~ to home directory', () => {
    const node = fs.resolvePath('~');
    expect(node.name).toBe('analyst');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/filesystem.test.js`
Expected: FAIL - resolvePath is not a function

### Step 3: Write minimal implementation

Update `js/filesystem.js` - add resolvePath method to returned object:
```js
function buildNode(name, value) {
  if (typeof value === 'string') {
    return { type: 'file', name, content: value };
  }
  const children = {};
  for (const [childName, childValue] of Object.entries(value)) {
    children[childName] = buildNode(childName, childValue);
  }
  return { type: 'dir', name, children };
}

export function createFilesystem(tree = {}, homePath = '/home/analyst') {
  const root = {
    type: 'dir',
    name: '/',
    children: {},
  };

  for (const [name, value] of Object.entries(tree)) {
    root.children[name] = buildNode(name, value);
  }

  const fs = {
    root,
    cwd: '/',
    homePath,

    resolvePath(path) {
      if (path === '~') {
        path = this.homePath;
      } else if (path.startsWith('~/')) {
        path = this.homePath + path.slice(1);
      }

      let parts;
      if (path.startsWith('/')) {
        parts = path.split('/').filter(p => p !== '');
      } else {
        const cwdParts = this.cwd.split('/').filter(p => p !== '');
        const relParts = path.split('/').filter(p => p !== '');
        parts = [...cwdParts, ...relParts];
      }

      const resolved = [];
      for (const part of parts) {
        if (part === '..') {
          resolved.pop();
        } else if (part !== '.') {
          resolved.push(part);
        }
      }

      let node = this.root;
      for (const part of resolved) {
        if (node.type !== 'dir' || !node.children[part]) {
          return null;
        }
        node = node.children[part];
      }
      return node;
    },
  };

  return fs;
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/filesystem.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/filesystem.js tests/filesystem.test.js
git commit -m "feat(fs): add resolvePath with absolute, relative, .., ~"
```

---

## Task 4: Filesystem - Get Absolute Path

**Files:**
- Modify: `js/filesystem.js`
- Modify: `tests/filesystem.test.js`

### Step 1: Write failing tests for getAbsolutePath

Add to `tests/filesystem.test.js`:
```js
describe('getAbsolutePath', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: { analyst: { projects: {} } },
    });
  });

  test('returns absolute path unchanged', () => {
    expect(fs.getAbsolutePath('/home/analyst')).toBe('/home/analyst');
  });

  test('converts relative path to absolute', () => {
    fs.cwd = '/home';
    expect(fs.getAbsolutePath('analyst')).toBe('/home/analyst');
  });

  test('resolves .. in path', () => {
    fs.cwd = '/home/analyst/projects';
    expect(fs.getAbsolutePath('../..')).toBe('/home');
  });

  test('resolves ~ to home', () => {
    expect(fs.getAbsolutePath('~')).toBe('/home/analyst');
  });

  test('returns / for root', () => {
    expect(fs.getAbsolutePath('/')).toBe('/');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/filesystem.test.js`
Expected: FAIL - getAbsolutePath is not a function

### Step 3: Write minimal implementation

Add to the `fs` object in `createFilesystem`:
```js
    getAbsolutePath(path) {
      if (path === '~') {
        path = this.homePath;
      } else if (path.startsWith('~/')) {
        path = this.homePath + path.slice(1);
      }

      let parts;
      if (path.startsWith('/')) {
        parts = path.split('/').filter(p => p !== '');
      } else {
        const cwdParts = this.cwd.split('/').filter(p => p !== '');
        const relParts = path.split('/').filter(p => p !== '');
        parts = [...cwdParts, ...relParts];
      }

      const resolved = [];
      for (const part of parts) {
        if (part === '..') {
          resolved.pop();
        } else if (part !== '.') {
          resolved.push(part);
        }
      }

      return '/' + resolved.join('/');
    },
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/filesystem.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/filesystem.js tests/filesystem.test.js
git commit -m "feat(fs): add getAbsolutePath for path normalization"
```

---

## Task 5: Filesystem - List Directory

**Files:**
- Modify: `js/filesystem.js`
- Modify: `tests/filesystem.test.js`

### Step 1: Write failing tests for listDir

Add to `tests/filesystem.test.js`:
```js
describe('listDir', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          '.hidden': 'secret',
          'readme.txt': 'hello',
          projects: {},
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('lists visible entries in directory', () => {
    const entries = fs.listDir('.');
    const names = entries.map(e => e.name);
    expect(names).toContain('readme.txt');
    expect(names).toContain('projects');
    expect(names).not.toContain('.hidden');
  });

  test('lists hidden entries with showHidden flag', () => {
    const entries = fs.listDir('.', { showHidden: true });
    const names = entries.map(e => e.name);
    expect(names).toContain('.hidden');
  });

  test('returns entry type', () => {
    const entries = fs.listDir('.');
    const readme = entries.find(e => e.name === 'readme.txt');
    const projects = entries.find(e => e.name === 'projects');
    expect(readme.type).toBe('file');
    expect(projects.type).toBe('dir');
  });

  test('returns null for non-existent path', () => {
    const entries = fs.listDir('/does/not/exist');
    expect(entries).toBeNull();
  });

  test('returns null for file path', () => {
    const entries = fs.listDir('readme.txt');
    expect(entries).toBeNull();
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/filesystem.test.js`
Expected: FAIL - listDir is not a function

### Step 3: Write minimal implementation

Add to the `fs` object in `createFilesystem`:
```js
    listDir(path, options = {}) {
      const node = this.resolvePath(path);
      if (!node || node.type !== 'dir') {
        return null;
      }

      const entries = [];
      for (const [name, child] of Object.entries(node.children)) {
        if (!options.showHidden && name.startsWith('.')) {
          continue;
        }
        entries.push({ name, type: child.type });
      }
      return entries.sort((a, b) => a.name.localeCompare(b.name));
    },
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/filesystem.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/filesystem.js tests/filesystem.test.js
git commit -m "feat(fs): add listDir with hidden file filtering"
```

---

## Task 6: Filesystem - Read File

**Files:**
- Modify: `js/filesystem.js`
- Modify: `tests/filesystem.test.js`

### Step 1: Write failing tests for readFile

Add to `tests/filesystem.test.js`:
```js
describe('readFile', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'readme.txt': 'Hello, analyst!',
        },
      },
    });
  });

  test('reads file content', () => {
    const content = fs.readFile('/home/analyst/readme.txt');
    expect(content).toBe('Hello, analyst!');
  });

  test('returns null for non-existent file', () => {
    const content = fs.readFile('/does/not/exist.txt');
    expect(content).toBeNull();
  });

  test('returns null for directory', () => {
    const content = fs.readFile('/home/analyst');
    expect(content).toBeNull();
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/filesystem.test.js`
Expected: FAIL - readFile is not a function

### Step 3: Write minimal implementation

Add to the `fs` object in `createFilesystem`:
```js
    readFile(path) {
      const node = this.resolvePath(path);
      if (!node || node.type !== 'file') {
        return null;
      }
      return node.content;
    },
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/filesystem.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/filesystem.js tests/filesystem.test.js
git commit -m "feat(fs): add readFile to read file contents"
```

---

## Task 7: Filesystem - Write File

**Files:**
- Modify: `js/filesystem.js`
- Modify: `tests/filesystem.test.js`

### Step 1: Write failing tests for writeFile

Add to `tests/filesystem.test.js`:
```js
describe('writeFile', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'existing.txt': 'old content',
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('creates new file', () => {
    const result = fs.writeFile('new.txt', 'new content');
    expect(result).toBe(true);
    expect(fs.readFile('new.txt')).toBe('new content');
  });

  test('overwrites existing file', () => {
    fs.writeFile('existing.txt', 'new content');
    expect(fs.readFile('existing.txt')).toBe('new content');
  });

  test('appends to file with append flag', () => {
    fs.writeFile('existing.txt', ' appended', { append: true });
    expect(fs.readFile('existing.txt')).toBe('old content appended');
  });

  test('creates file in nested path', () => {
    fs.writeFile('/home/analyst/new.txt', 'content');
    expect(fs.readFile('/home/analyst/new.txt')).toBe('content');
  });

  test('returns false for non-existent parent directory', () => {
    const result = fs.writeFile('/does/not/exist/file.txt', 'content');
    expect(result).toBe(false);
  });

  test('returns false when trying to write to directory', () => {
    const result = fs.writeFile('/home/analyst', 'content');
    expect(result).toBe(false);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/filesystem.test.js`
Expected: FAIL - writeFile is not a function

### Step 3: Write minimal implementation

Add to the `fs` object in `createFilesystem`:
```js
    writeFile(path, content, options = {}) {
      const absPath = this.getAbsolutePath(path);
      const parts = absPath.split('/').filter(p => p !== '');
      const fileName = parts.pop();

      if (!fileName) return false;

      const parentPath = '/' + parts.join('/');
      const parent = this.resolvePath(parentPath || '/');

      if (!parent || parent.type !== 'dir') {
        return false;
      }

      const existing = parent.children[fileName];
      if (existing && existing.type === 'dir') {
        return false;
      }

      if (options.append && existing) {
        existing.content += content;
      } else {
        parent.children[fileName] = {
          type: 'file',
          name: fileName,
          content,
        };
      }
      return true;
    },
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/filesystem.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/filesystem.js tests/filesystem.test.js
git commit -m "feat(fs): add writeFile with append support"
```

---

## Task 8: Filesystem - Change Directory

**Files:**
- Modify: `js/filesystem.js`
- Modify: `tests/filesystem.test.js`

### Step 1: Write failing tests for changeDir

Add to `tests/filesystem.test.js`:
```js
describe('changeDir', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          projects: {},
        },
      },
    });
  });

  test('changes to absolute path', () => {
    const result = fs.changeDir('/home/analyst');
    expect(result).toBe(true);
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('changes to relative path', () => {
    fs.cwd = '/home';
    fs.changeDir('analyst');
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('changes to parent with ..', () => {
    fs.cwd = '/home/analyst';
    fs.changeDir('..');
    expect(fs.cwd).toBe('/home');
  });

  test('changes to home with ~', () => {
    fs.changeDir('~');
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('returns false for non-existent directory', () => {
    const result = fs.changeDir('/does/not/exist');
    expect(result).toBe(false);
  });

  test('returns false for file path', () => {
    fs = createFilesystem({ home: { analyst: { 'file.txt': 'content' } } });
    const result = fs.changeDir('/home/analyst/file.txt');
    expect(result).toBe(false);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/filesystem.test.js`
Expected: FAIL - changeDir is not a function

### Step 3: Write minimal implementation

Add to the `fs` object in `createFilesystem`:
```js
    changeDir(path) {
      const absPath = this.getAbsolutePath(path);
      const node = this.resolvePath(path);

      if (!node || node.type !== 'dir') {
        return false;
      }

      this.cwd = absPath;
      return true;
    },
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/filesystem.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/filesystem.js tests/filesystem.test.js
git commit -m "feat(fs): add changeDir to change current working directory"
```

---

## Task 9: Parser - Tokenizer

**Files:**
- Create: `js/parser.js`
- Create: `tests/parser.test.js`

### Step 1: Write failing tests for tokenize

Create `tests/parser.test.js`:
```js
import { tokenize } from '../js/parser.js';

describe('tokenize', () => {
  test('tokenizes simple command', () => {
    const tokens = tokenize('ls');
    expect(tokens).toEqual(['ls']);
  });

  test('tokenizes command with arguments', () => {
    const tokens = tokenize('ls -la /home');
    expect(tokens).toEqual(['ls', '-la', '/home']);
  });

  test('tokenizes pipe operator', () => {
    const tokens = tokenize('cat file | grep pattern');
    expect(tokens).toEqual(['cat', 'file', '|', 'grep', 'pattern']);
  });

  test('tokenizes redirect operators', () => {
    const tokens = tokenize('echo hello > file.txt');
    expect(tokens).toEqual(['echo', 'hello', '>', 'file.txt']);
  });

  test('tokenizes append operator', () => {
    const tokens = tokenize('echo hello >> file.txt');
    expect(tokens).toEqual(['echo', 'hello', '>>', 'file.txt']);
  });

  test('handles double-quoted strings', () => {
    const tokens = tokenize('echo "hello world"');
    expect(tokens).toEqual(['echo', 'hello world']);
  });

  test('handles single-quoted strings', () => {
    const tokens = tokenize("echo 'hello world'");
    expect(tokens).toEqual(['echo', 'hello world']);
  });

  test('handles adjacent operators', () => {
    const tokens = tokenize('cat file|grep x');
    expect(tokens).toEqual(['cat', 'file', '|', 'grep', 'x']);
  });

  test('handles multiple pipes', () => {
    const tokens = tokenize('cat file | sort | head');
    expect(tokens).toEqual(['cat', 'file', '|', 'sort', '|', 'head']);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/parser.test.js`
Expected: FAIL - Cannot find module

### Step 3: Write minimal implementation

Create `js/parser.js`:
```js
export function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    // Skip whitespace
    if (input[i] === ' ' || input[i] === '\t') {
      i++;
      continue;
    }

    // Handle >> operator
    if (input[i] === '>' && input[i + 1] === '>') {
      tokens.push('>>');
      i += 2;
      continue;
    }

    // Handle single-char operators
    if (input[i] === '|' || input[i] === '>') {
      tokens.push(input[i]);
      i++;
      continue;
    }

    // Handle quoted strings
    if (input[i] === '"' || input[i] === "'") {
      const quote = input[i];
      i++;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        str += input[i];
        i++;
      }
      i++; // skip closing quote
      tokens.push(str);
      continue;
    }

    // Handle regular word
    let word = '';
    while (i < input.length &&
           input[i] !== ' ' &&
           input[i] !== '\t' &&
           input[i] !== '|' &&
           input[i] !== '>' &&
           input[i] !== '"' &&
           input[i] !== "'") {
      word += input[i];
      i++;
    }
    if (word) {
      tokens.push(word);
    }
  }

  return tokens;
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/parser.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/parser.js tests/parser.test.js
git commit -m "feat(parser): add tokenizer for command strings"
```

---

## Task 10: Parser - Parse to AST

**Files:**
- Modify: `js/parser.js`
- Modify: `tests/parser.test.js`

### Step 1: Write failing tests for parse

Add to `tests/parser.test.js`:
```js
import { tokenize, parse } from '../js/parser.js';

describe('parse', () => {
  test('parses simple command', () => {
    const ast = parse('ls -la');
    expect(ast).toEqual({
      pipeline: [{ cmd: 'ls', args: ['-la'] }],
      redirect: null,
    });
  });

  test('parses pipe chain', () => {
    const ast = parse('cat file | grep pattern | sort');
    expect(ast).toEqual({
      pipeline: [
        { cmd: 'cat', args: ['file'] },
        { cmd: 'grep', args: ['pattern'] },
        { cmd: 'sort', args: [] },
      ],
      redirect: null,
    });
  });

  test('parses output redirect', () => {
    const ast = parse('echo hello > out.txt');
    expect(ast).toEqual({
      pipeline: [{ cmd: 'echo', args: ['hello'] }],
      redirect: { type: 'write', file: 'out.txt' },
    });
  });

  test('parses append redirect', () => {
    const ast = parse('echo hello >> out.txt');
    expect(ast).toEqual({
      pipeline: [{ cmd: 'echo', args: ['hello'] }],
      redirect: { type: 'append', file: 'out.txt' },
    });
  });

  test('parses pipe with redirect', () => {
    const ast = parse('cat file | sort > sorted.txt');
    expect(ast).toEqual({
      pipeline: [
        { cmd: 'cat', args: ['file'] },
        { cmd: 'sort', args: [] },
      ],
      redirect: { type: 'write', file: 'sorted.txt' },
    });
  });

  test('parses command with no args', () => {
    const ast = parse('pwd');
    expect(ast).toEqual({
      pipeline: [{ cmd: 'pwd', args: [] }],
      redirect: null,
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/parser.test.js`
Expected: FAIL - parse is not exported

### Step 3: Write minimal implementation

Add to `js/parser.js`:
```js
export function parse(input) {
  const tokens = tokenize(input);
  const pipeline = [];
  let redirect = null;

  let i = 0;
  while (i < tokens.length) {
    // Check for redirect at end
    if (tokens[i] === '>' || tokens[i] === '>>') {
      redirect = {
        type: tokens[i] === '>>' ? 'append' : 'write',
        file: tokens[i + 1],
      };
      break;
    }

    // Check for pipe
    if (tokens[i] === '|') {
      i++;
      continue;
    }

    // Parse command
    const cmd = tokens[i];
    const args = [];
    i++;

    while (i < tokens.length && tokens[i] !== '|' && tokens[i] !== '>' && tokens[i] !== '>>') {
      args.push(tokens[i]);
      i++;
    }

    pipeline.push({ cmd, args });
  }

  return { pipeline, redirect };
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/parser.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/parser.js tests/parser.test.js
git commit -m "feat(parser): add parse function to build pipeline AST"
```

---

## Task 11: Commands - pwd

**Files:**
- Create: `js/commands.js`
- Create: `tests/commands.test.js`

### Step 1: Write failing test for pwd

Create `tests/commands.test.js`:
```js
import { commands } from '../js/commands.js';
import { createFilesystem } from '../js/filesystem.js';

describe('pwd', () => {
  test('returns current working directory', () => {
    const fs = createFilesystem({ home: { analyst: {} } });
    fs.cwd = '/home/analyst';

    const result = commands.pwd([], '', fs);

    expect(result.stdout).toBe('/home/analyst');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
  });

  test('returns root when at root', () => {
    const fs = createFilesystem({});
    fs.cwd = '/';

    const result = commands.pwd([], '', fs);

    expect(result.stdout).toBe('/');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/commands.test.js`
Expected: FAIL - Cannot find module

### Step 3: Write minimal implementation

Create `js/commands.js`:
```js
export const commands = {
  pwd(args, stdin, fs) {
    return {
      stdout: fs.cwd,
      stderr: '',
      exitCode: 0,
    };
  },
};
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/commands.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/commands.js tests/commands.test.js
git commit -m "feat(cmd): add pwd command"
```

---

## Task 12: Commands - ls (basic)

**Files:**
- Modify: `js/commands.js`
- Modify: `tests/commands.test.js`

### Step 1: Write failing tests for ls

Add to `tests/commands.test.js`:
```js
describe('ls', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          '.hidden': 'secret',
          'readme.txt': 'hello',
          projects: {},
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('lists current directory', () => {
    const result = commands.ls([], '', fs);
    expect(result.stdout).toContain('readme.txt');
    expect(result.stdout).toContain('projects');
    expect(result.stdout).not.toContain('.hidden');
    expect(result.exitCode).toBe(0);
  });

  test('lists specified directory', () => {
    fs.cwd = '/';
    const result = commands.ls(['/home/analyst'], '', fs);
    expect(result.stdout).toContain('readme.txt');
  });

  test('shows hidden files with -a flag', () => {
    const result = commands.ls(['-a'], '', fs);
    expect(result.stdout).toContain('.hidden');
  });

  test('returns error for non-existent path', () => {
    const result = commands.ls(['/does/not/exist'], '', fs);
    expect(result.stderr).toContain('No such file or directory');
    expect(result.exitCode).toBe(1);
  });

  test('shows file info for file argument', () => {
    const result = commands.ls(['readme.txt'], '', fs);
    expect(result.stdout).toBe('readme.txt');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/commands.test.js`
Expected: FAIL - commands.ls is not a function

### Step 3: Write minimal implementation

Add to `commands` object in `js/commands.js`:
```js
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
      } else {
        const entries = fs.listDir(path, { showHidden });
        outputs.push(entries.map(e => e.name).join('  '));
      }
    }

    return {
      stdout: outputs.join('\n'),
      stderr: '',
      exitCode: 0,
    };
  },
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/commands.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/commands.js tests/commands.test.js
git commit -m "feat(cmd): add ls command with -a flag"
```

---

## Task 13: Commands - cd

**Files:**
- Modify: `js/commands.js`
- Modify: `tests/commands.test.js`

### Step 1: Write failing tests for cd

Add to `tests/commands.test.js`:
```js
describe('cd', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          projects: {},
          'file.txt': 'content',
        },
      },
    });
    fs.cwd = '/';
  });

  test('changes to specified directory', () => {
    const result = commands.cd(['/home/analyst'], '', fs);
    expect(fs.cwd).toBe('/home/analyst');
    expect(result.stdout).toBe('');
    expect(result.exitCode).toBe(0);
  });

  test('changes to relative directory', () => {
    fs.cwd = '/home';
    commands.cd(['analyst'], '', fs);
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('changes to parent with ..', () => {
    fs.cwd = '/home/analyst';
    commands.cd(['..'], '', fs);
    expect(fs.cwd).toBe('/home');
  });

  test('changes to home with no args', () => {
    fs.cwd = '/';
    commands.cd([], '', fs);
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('changes to home with ~', () => {
    fs.cwd = '/';
    commands.cd(['~'], '', fs);
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('returns error for non-existent directory', () => {
    const result = commands.cd(['/does/not/exist'], '', fs);
    expect(result.stderr).toContain('No such file or directory');
    expect(result.exitCode).toBe(1);
  });

  test('returns error for file path', () => {
    const result = commands.cd(['/home/analyst/file.txt'], '', fs);
    expect(result.stderr).toContain('Not a directory');
    expect(result.exitCode).toBe(1);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/commands.test.js`
Expected: FAIL - commands.cd is not a function

### Step 3: Write minimal implementation

Add to `commands` object in `js/commands.js`:
```js
  cd(args, stdin, fs) {
    const target = args[0] || '~';

    const node = fs.resolvePath(target);
    if (!node) {
      return {
        stdout: '',
        stderr: `cd: ${target}: No such file or directory`,
        exitCode: 1,
      };
    }

    if (node.type !== 'dir') {
      return {
        stdout: '',
        stderr: `cd: ${target}: Not a directory`,
        exitCode: 1,
      };
    }

    fs.changeDir(target);
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
    };
  },
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/commands.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/commands.js tests/commands.test.js
git commit -m "feat(cmd): add cd command"
```

---

## Task 14: Commands - cat

**Files:**
- Modify: `js/commands.js`
- Modify: `tests/commands.test.js`

### Step 1: Write failing tests for cat

Add to `tests/commands.test.js`:
```js
describe('cat', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'file1.txt': 'Hello',
          'file2.txt': 'World',
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('reads single file', () => {
    const result = commands.cat(['file1.txt'], '', fs);
    expect(result.stdout).toBe('Hello');
    expect(result.exitCode).toBe(0);
  });

  test('reads multiple files', () => {
    const result = commands.cat(['file1.txt', 'file2.txt'], '', fs);
    expect(result.stdout).toBe('Hello\nWorld');
  });

  test('returns error for non-existent file', () => {
    const result = commands.cat(['missing.txt'], '', fs);
    expect(result.stderr).toContain('No such file or directory');
    expect(result.exitCode).toBe(1);
  });

  test('returns error for directory', () => {
    const result = commands.cat(['/home'], '', fs);
    expect(result.stderr).toContain('Is a directory');
    expect(result.exitCode).toBe(1);
  });

  test('passes through stdin when no args', () => {
    const result = commands.cat([], 'piped input', fs);
    expect(result.stdout).toBe('piped input');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/commands.test.js`
Expected: FAIL - commands.cat is not a function

### Step 3: Write minimal implementation

Add to `commands` object in `js/commands.js`:
```js
  cat(args, stdin, fs) {
    if (args.length === 0) {
      return { stdout: stdin, stderr: '', exitCode: 0 };
    }

    const outputs = [];

    for (const path of args) {
      const node = fs.resolvePath(path);

      if (!node) {
        return {
          stdout: '',
          stderr: `cat: ${path}: No such file or directory`,
          exitCode: 1,
        };
      }

      if (node.type === 'dir') {
        return {
          stdout: '',
          stderr: `cat: ${path}: Is a directory`,
          exitCode: 1,
        };
      }

      outputs.push(node.content);
    }

    return {
      stdout: outputs.join('\n'),
      stderr: '',
      exitCode: 0,
    };
  },
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/commands.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/commands.js tests/commands.test.js
git commit -m "feat(cmd): add cat command with stdin passthrough"
```

---

## Task 15: Commands - echo

**Files:**
- Modify: `js/commands.js`
- Modify: `tests/commands.test.js`

### Step 1: Write failing tests for echo

Add to `tests/commands.test.js`:
```js
describe('echo', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({});
  });

  test('outputs arguments joined by space', () => {
    const result = commands.echo(['hello', 'world'], '', fs);
    expect(result.stdout).toBe('hello world');
    expect(result.exitCode).toBe(0);
  });

  test('outputs empty string for no args', () => {
    const result = commands.echo([], '', fs);
    expect(result.stdout).toBe('');
  });

  test('preserves quotes in argument', () => {
    const result = commands.echo(['hello world'], '', fs);
    expect(result.stdout).toBe('hello world');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/commands.test.js`
Expected: FAIL - commands.echo is not a function

### Step 3: Write minimal implementation

Add to `commands` object in `js/commands.js`:
```js
  echo(args, stdin, fs) {
    return {
      stdout: args.join(' '),
      stderr: '',
      exitCode: 0,
    };
  },
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/commands.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/commands.js tests/commands.test.js
git commit -m "feat(cmd): add echo command"
```

---

## Task 16: Commands - help and clear

**Files:**
- Modify: `js/commands.js`
- Modify: `tests/commands.test.js`

### Step 1: Write failing tests for help and clear

Add to `tests/commands.test.js`:
```js
describe('help', () => {
  test('lists available commands', () => {
    const fs = createFilesystem({});
    const result = commands.help([], '', fs);
    expect(result.stdout).toContain('ls');
    expect(result.stdout).toContain('cd');
    expect(result.stdout).toContain('pwd');
    expect(result.stdout).toContain('cat');
    expect(result.exitCode).toBe(0);
  });
});

describe('clear', () => {
  test('returns special clear signal', () => {
    const fs = createFilesystem({});
    const result = commands.clear([], '', fs);
    expect(result.clear).toBe(true);
    expect(result.exitCode).toBe(0);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/commands.test.js`
Expected: FAIL - commands.help is not a function

### Step 3: Write minimal implementation

Add to `commands` object in `js/commands.js`:
```js
  help(args, stdin, fs) {
    const helpText = `Available commands:
  ls [path]      - List directory contents (-a for hidden files)
  cd [path]      - Change directory (~ for home, .. for parent)
  pwd            - Print working directory
  cat <file>     - Display file contents
  echo <text>    - Print text
  clear          - Clear the terminal
  help           - Show this help message
  hint           - Get a hint for the current objective

Type 'hint' if you're stuck!`;

    return {
      stdout: helpText,
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
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/commands.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/commands.js tests/commands.test.js
git commit -m "feat(cmd): add help and clear commands"
```

---

## Task 17: Game Engine - Execute Pipeline

**Files:**
- Create: `js/game.js`
- Create: `tests/game.test.js`

### Step 1: Write failing tests for executePipeline

Create `tests/game.test.js`:
```js
import { executePipeline } from '../js/game.js';
import { createFilesystem } from '../js/filesystem.js';

describe('executePipeline', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'file.txt': 'hello world',
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('executes single command', () => {
    const result = executePipeline('pwd', fs);
    expect(result.output).toBe('/home/analyst');
  });

  test('executes pipe chain', () => {
    const result = executePipeline('cat file.txt | cat', fs);
    expect(result.output).toBe('hello world');
  });

  test('handles redirect write', () => {
    executePipeline('echo "new content" > out.txt', fs);
    expect(fs.readFile('out.txt')).toBe('new content');
  });

  test('handles redirect append', () => {
    fs.writeFile('out.txt', 'line1');
    executePipeline('echo "line2" >> out.txt', fs);
    expect(fs.readFile('out.txt')).toBe('line1line2');
  });

  test('returns error output', () => {
    const result = executePipeline('cat nonexistent.txt', fs);
    expect(result.output).toContain('No such file or directory');
    expect(result.exitCode).toBe(1);
  });

  test('returns error for unknown command', () => {
    const result = executePipeline('foobar', fs);
    expect(result.output).toContain('command not found');
    expect(result.exitCode).toBe(127);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/game.test.js`
Expected: FAIL - Cannot find module

### Step 3: Write minimal implementation

Create `js/game.js`:
```js
import { parse } from './parser.js';
import { commands } from './commands.js';

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

  // Handle redirect
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

### Step 4: Run test to verify it passes

Run: `npm test -- tests/game.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/game.js tests/game.test.js
git commit -m "feat(game): add executePipeline to run parsed commands"
```

---

## Task 18: Levels Data - Chapter 1

**Files:**
- Create: `js/levels.js`
- Create: `tests/levels.test.js`

### Step 1: Write failing tests for level structure

Create `tests/levels.test.js`:
```js
import { levels } from '../js/levels.js';

describe('levels', () => {
  test('has at least 3 levels', () => {
    expect(levels.length).toBeGreaterThanOrEqual(3);
  });

  test('each level has required properties', () => {
    for (const level of levels) {
      expect(level.id).toBeDefined();
      expect(level.title).toBeDefined();
      expect(level.story).toBeDefined();
      expect(level.filesystem).toBeDefined();
      expect(level.startDir).toBeDefined();
      expect(level.subSteps).toBeDefined();
      expect(level.subSteps.length).toBeGreaterThan(0);
    }
  });

  test('each substep has objective, hints, and winCondition', () => {
    for (const level of levels) {
      for (const step of level.subSteps) {
        expect(step.objective).toBeDefined();
        expect(step.hints).toBeDefined();
        expect(Array.isArray(step.hints)).toBe(true);
        expect(step.winCondition).toBeDefined();
        expect(typeof step.winCondition).toBe('function');
      }
    }
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/levels.test.js`
Expected: FAIL - Cannot find module

### Step 3: Write minimal implementation

Create `js/levels.js`:
```js
export const levels = [
  // Level 1: ls, pwd
  {
    id: 1,
    title: 'First Contact',
    story: `You're in. The SSH connection is live.

The server is quiet. You're in someone's home directory — probably an analyst account they forgot to disable.

First things first: figure out where you are and what's around you.`,
    filesystem: {
      home: {
        analyst: {
          '.bash_history': 'cd /var/log\ncat access.log\nexit',
          'welcome.txt': 'Welcome to NexusCorp Internal Server.\nAll activity is monitored.\nReport suspicious behavior to security@nexuscorp.internal',
          documents: {
            'memo.txt': 'Team - remember to update your passwords this quarter. -Admin',
            'schedule.txt': 'Monday: Team standup\nTuesday: Server maintenance\nWednesday: Security audit',
          },
          internal: {
            'contacts.txt': 'IT Support: ext 4357\nSecurity: ext 9111\nHR: ext 2200',
            projects: {},
          },
        },
      },
      var: {
        messages: 'System Notice: Scheduled maintenance on Saturday.\nSystem Notice: New security policies in effect.\nSystem Notice: Report any suspicious activity.',
      },
    },
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Use `pwd` to see where you are on the server.',
        hints: [
          'pwd stands for "print working directory"',
          'Just type: pwd',
        ],
        winCondition: (cmd, output, fs) => cmd.trim() === 'pwd',
      },
      {
        objective: 'Use `ls` to see what files and folders are here.',
        hints: [
          'ls lists the contents of a directory',
          'Just type: ls',
        ],
        winCondition: (cmd, output, fs) => cmd.trim().startsWith('ls'),
      },
      {
        objective: 'There\'s a file called `welcome.txt`. Read it with `cat welcome.txt`.',
        hints: [
          'cat displays the contents of a file',
          'Type: cat welcome.txt',
        ],
        winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('welcome.txt'),
      },
    ],
  },

  // Level 2: cd, ls
  {
    id: 2,
    title: 'Going Deeper',
    story: `Good. You've got your bearings.

The welcome message mentioned "internal" resources. You noticed a folder called "internal" in the directory listing.

Time to explore. You need to learn to move around this filesystem.`,
    filesystem: {
      home: {
        analyst: {
          '.bash_history': 'ls\ncd internal\nls\nexit',
          'welcome.txt': 'Welcome to NexusCorp Internal Server.',
          documents: {
            'memo.txt': 'Team - remember to update your passwords.',
          },
          internal: {
            'readme.txt': 'Internal Resources Directory\n\nProjects are stored in /home/analyst/internal/projects\nReports go in /home/analyst/internal/reports',
            projects: {
              'project_alpha.txt': 'Project Alpha: Status ACTIVE\nLead: jsmith\nBudget: $2.4M',
              'project_beta.txt': 'Project Beta: Status PENDING\nLead: mwilson\nBudget: TBD',
            },
            reports: {
              'q1_summary.txt': 'Q1 was strong. Revenue up 12%.',
            },
          },
        },
      },
    },
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Change into the `internal` directory using `cd internal`.',
        hints: [
          'cd stands for "change directory"',
          'Type: cd internal',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/analyst/internal',
      },
      {
        objective: 'List the contents of this directory with `ls`.',
        hints: [
          'You know this one!',
          'Type: ls',
        ],
        winCondition: (cmd, output, fs) => cmd.trim().startsWith('ls') && fs.cwd === '/home/analyst/internal',
      },
      {
        objective: 'There\'s a `projects` folder. Go into it with `cd projects`.',
        hints: [
          'Same as before - use cd to change directory',
          'Type: cd projects',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/analyst/internal/projects',
      },
    ],
  },

  // Level 3: cd .., relative paths
  {
    id: 3,
    title: 'Finding Your Way Back',
    story: `You've gone deep into the directory structure. But sometimes you need to go back up.

In Linux, \`.\` means "current directory" and \`..\` means "parent directory".

You're currently in /home/analyst/internal/projects. Time to learn to navigate back.`,
    filesystem: {
      home: {
        analyst: {
          '.bash_history': 'cd ..\nls\npwd',
          'welcome.txt': 'Welcome to NexusCorp Internal Server.',
          documents: {
            'important.txt': 'You found the important file!',
          },
          internal: {
            'readme.txt': 'Internal directory',
            projects: {
              'project_alpha.txt': 'Project Alpha details',
            },
            reports: {
              'findings.txt': 'Security findings: None reported.',
            },
          },
        },
      },
    },
    startDir: '/home/analyst/internal/projects',
    subSteps: [
      {
        objective: 'Go up one directory using `cd ..`',
        hints: [
          '.. means "parent directory"',
          'Type: cd ..',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/analyst/internal',
      },
      {
        objective: 'Good! Now go up one more level with `cd ..`',
        hints: [
          'Same command again',
          'Type: cd ..',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/analyst',
      },
      {
        objective: 'There\'s a `documents` folder. Navigate into it and read `important.txt`.',
        hints: [
          'First cd into documents, then use cat',
          'Type: cd documents',
          'Then: cat important.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('cat') && cmd.includes('important.txt') && output.includes('You found');
        },
      },
    ],
  },
];
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/levels.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/levels.js tests/levels.test.js
git commit -m "feat(levels): add Chapter 1 levels (1-3)"
```

---

## Task 19: Game Engine - Level Management

**Files:**
- Modify: `js/game.js`
- Modify: `tests/game.test.js`

### Step 1: Write failing tests for createGame

Add to `tests/game.test.js`:
```js
import { executePipeline, createGame } from '../js/game.js';
import { createFilesystem } from '../js/filesystem.js';
import { levels } from '../js/levels.js';

describe('createGame', () => {
  test('initializes at level 1, substep 0', () => {
    const game = createGame();
    expect(game.currentLevel).toBe(0);
    expect(game.currentSubStep).toBe(0);
  });

  test('loads filesystem from level', () => {
    const game = createGame();
    expect(game.fs.cwd).toBe(levels[0].startDir);
  });

  test('getObjective returns current substep objective', () => {
    const game = createGame();
    const objective = game.getObjective();
    expect(objective).toBe(levels[0].subSteps[0].objective);
  });

  test('getHint returns hints for current substep', () => {
    const game = createGame();
    const hint = game.getHint(0);
    expect(hint).toBe(levels[0].subSteps[0].hints[0]);
  });

  test('getStory returns current level story', () => {
    const game = createGame();
    const story = game.getStory();
    expect(story).toBe(levels[0].story);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/game.test.js`
Expected: FAIL - createGame is not exported

### Step 3: Write minimal implementation

Add to `js/game.js`:
```js
import { levels } from './levels.js';
import { createFilesystem } from './filesystem.js';

export function createGame() {
  let currentLevel = 0;
  let currentSubStep = 0;
  let hintIndex = 0;

  const loadLevel = (levelIndex) => {
    const level = levels[levelIndex];
    const fs = createFilesystem(level.filesystem);
    fs.cwd = level.startDir;
    return fs;
  };

  let fs = loadLevel(0);

  return {
    get currentLevel() { return currentLevel; },
    get currentSubStep() { return currentSubStep; },
    get fs() { return fs; },

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
  };
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/game.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/game.js tests/game.test.js
git commit -m "feat(game): add createGame with level management"
```

---

## Task 20: Game Engine - Command Execution and Win Checking

**Files:**
- Modify: `js/game.js`
- Modify: `tests/game.test.js`

### Step 1: Write failing tests for runCommand

Add to `tests/game.test.js`:
```js
describe('game.runCommand', () => {
  test('executes command and returns output', () => {
    const game = createGame();
    const result = game.runCommand('pwd');
    expect(result.output).toBe('/home/analyst');
  });

  test('advances substep when win condition met', () => {
    const game = createGame();
    expect(game.currentSubStep).toBe(0);

    game.runCommand('pwd');
    expect(game.currentSubStep).toBe(1);
  });

  test('does not advance when win condition not met', () => {
    const game = createGame();
    game.runCommand('echo hello');
    expect(game.currentSubStep).toBe(0);
  });

  test('advances to next level when all substeps complete', () => {
    const game = createGame();

    // Complete level 1 substeps
    game.runCommand('pwd');
    expect(game.currentSubStep).toBe(1);

    game.runCommand('ls');
    expect(game.currentSubStep).toBe(2);

    game.runCommand('cat welcome.txt');
    expect(game.currentLevel).toBe(1);
    expect(game.currentSubStep).toBe(0);
  });

  test('sets won flag when all levels complete', () => {
    const game = createGame();

    // Level 1
    game.runCommand('pwd');
    game.runCommand('ls');
    game.runCommand('cat welcome.txt');

    // Level 2
    game.runCommand('cd internal');
    game.runCommand('ls');
    game.runCommand('cd projects');

    // Level 3
    game.runCommand('cd ..');
    game.runCommand('cd ..');
    game.runCommand('cd documents');
    const finalResult = game.runCommand('cat important.txt');

    expect(game.won).toBe(true);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/game.test.js`
Expected: FAIL - game.runCommand is not a function

### Step 3: Write minimal implementation

Update the `createGame` function in `js/game.js`:
```js
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
      const result = executePipeline(input, fs);

      // Check win condition
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
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/game.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/game.js tests/game.test.js
git commit -m "feat(game): add runCommand with win condition checking and level progression"
```

---

## Task 21: Game Engine - Hint Command

**Files:**
- Modify: `js/commands.js`
- Modify: `js/game.js`
- Modify: `tests/game.test.js`

### Step 1: Write failing test for hint command

Add to `tests/game.test.js`:
```js
describe('hint command', () => {
  test('returns current hint', () => {
    const game = createGame();
    const result = game.runCommand('hint');
    expect(result.output).toContain('pwd');
  });

  test('escalates hints on repeated calls', () => {
    const game = createGame();
    const hint1 = game.runCommand('hint');
    const hint2 = game.runCommand('hint');

    // Second hint should be different (more specific)
    expect(hint2.output).not.toBe(hint1.output);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/game.test.js`
Expected: FAIL - hint returns "command not found"

### Step 3: Write minimal implementation

Update `js/game.js` to handle hint specially in `runCommand`:
```js
    runCommand(input) {
      // Special handling for hint command
      if (input.trim() === 'hint') {
        const hint = this.getNextHint();
        return {
          output: `💡 Hint: ${hint}`,
          exitCode: 0,
        };
      }

      const result = executePipeline(input, fs);

      // ... rest of win condition checking
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/game.test.js`
Expected: PASS

### Step 5: Commit

Run:
```bash
git add js/game.js tests/game.test.js
git commit -m "feat(game): add hint command with escalating hints"
```

---

## Task 22: HTML Entry Point

**Files:**
- Create: `index.html`

### Step 1: Create the HTML file

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BashTreasureHunt - NexusCorp Server</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jquery.terminal@2.37.1/css/jquery.terminal.min.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="terminal"></div>

  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jquery.terminal@2.37.1/dist/jquery.terminal.min.js"></script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

### Step 2: Commit

Run:
```bash
git add index.html
git commit -m "feat: add HTML entry point with jQuery Terminal"
```

---

## Task 23: CSS Styling

**Files:**
- Create: `style.css`

### Step 1: Create the CSS file

Create `style.css`:
```css
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #0a0a0a;
}

#terminal {
  height: 100%;
  --font: 'Consolas', 'Monaco', 'Courier New', monospace;
  --size: 1.1;
  --color: #0f0;
  --background: #0a0a0a;
}

/* Prompt styling */
.terminal .terminal-output .format {
  color: #0f0;
}

/* Error messages */
.terminal .error {
  color: #f44;
}

/* Story/narrative text */
.terminal .story {
  color: #0ff;
  font-style: italic;
}

/* Objective text */
.terminal .objective {
  color: #ff0;
}

/* Success messages */
.terminal .success {
  color: #0f0;
  font-weight: bold;
}

/* Hint text */
.terminal .hint {
  color: #fa0;
}

/* Level title */
.terminal .level-title {
  color: #f0f;
  font-size: 1.2em;
  font-weight: bold;
}

/* Make command line input stand out */
.terminal .cmd .cursor {
  background-color: #0f0;
  color: #000;
}

/* Blinking cursor animation */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.terminal .cmd .cursor.blink {
  animation: blink 1s infinite;
}
```

### Step 2: Commit

Run:
```bash
git add style.css
git commit -m "feat: add retro terminal CSS styling"
```

---

## Task 24: Main Entry Point - Wire Everything Together

**Files:**
- Create: `js/main.js`

### Step 1: Create main.js to wire jQuery Terminal to game engine

Create `js/main.js`:
```js
import { createGame } from './game.js';

const game = createGame();

function formatPrompt() {
  const path = game.fs.cwd === '/home/analyst' ? '~' : game.fs.cwd.replace('/home/analyst', '~');
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

function printLevelHeader(term, title) {
  term.echo('');
  term.echo('[[;#f0f;]═══════════════════════════════════════]');
  term.echo(`[[;#f0f;]  LEVEL ${game.currentLevel + 1}: ${title.toUpperCase()}]`);
  term.echo('[[;#f0f;]═══════════════════════════════════════]');
}

function printSuccess(term, message) {
  term.echo(`[[;#0f0;]✓ ${message}]`);
}

function printWinScreen(term) {
  term.echo('');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('[[;#0f0;]      CHAPTER 1 COMPLETE!              ]');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('');
  term.echo('[[;#0ff;]You\'ve mastered the basics of Linux navigation.]');
  term.echo('[[;#0ff;]The server is at your fingertips.]');
  term.echo('');
  term.echo('[[;#ff0;]More chapters coming soon...]');
  term.echo('');
}

$(function() {
  const term = $('#terminal').terminal(function(command) {
    if (!command.trim()) return;

    const result = game.runCommand(command);

    // Handle clear command
    if (result.clear) {
      this.clear();
      return;
    }

    // Print command output
    if (result.output) {
      if (result.exitCode !== 0) {
        this.echo(`[[;#f44;]${result.output}]`);
      } else if (result.output.startsWith('💡')) {
        this.echo(`[[;#fa0;]${result.output}]`);
      } else {
        this.echo(result.output);
      }
    }

    // Handle level/substep advancement
    if (result.advanced) {
      printSuccess(this, 'Nice work!');

      if (result.won) {
        printWinScreen(this);
        return;
      }

      if (result.newLevel) {
        printLevelHeader(this, result.levelTitle);
        printStory(this, result.story);
      }

      printObjective(this, result.newObjective);
    }
  }, {
    greetings: false,
    prompt: formatPrompt,
    onInit: function() {
      // Print initial level header and story
      printLevelHeader(this, game.getLevelTitle());
      printStory(this, game.getStory());
      printObjective(this, game.getObjective());
    },
  });

  // Update prompt after each command (in case cwd changed)
  term.on('terminal:command', function() {
    term.set_prompt(formatPrompt());
  });
});
```

### Step 2: Commit

Run:
```bash
git add js/main.js
git commit -m "feat: add main.js to wire jQuery Terminal to game engine"
```

---

## Task 25: Manual Browser Testing

### Step 1: Start a local server

Run:
```bash
npx serve .
```

### Step 2: Test in browser

Open `http://localhost:3000` and verify:
1. Terminal loads with green text on black background
2. Level 1 story and objective display
3. `pwd` command works and advances to next objective
4. `ls` command works and shows files
5. `cat welcome.txt` works and advances to level 2
6. `cd` commands work correctly
7. `hint` command shows hints
8. `help` command shows help
9. `clear` command clears screen
10. Completing all 3 levels shows win screen

### Step 3: Commit any fixes

If any bugs are found, fix and commit them individually.

---

## Task 26: Final Cleanup and README

### Step 1: Run all tests

Run:
```bash
npm test
```
Expected: All tests pass

### Step 2: Final commit

Run:
```bash
git add -A
git commit -m "chore: MVP Chapter 1 complete"
```

---

## Summary

After completing all tasks, you will have:

- **Virtual Filesystem** (`js/filesystem.js`) - Full in-memory filesystem with path resolution, file I/O
- **Parser** (`js/parser.js`) - Tokenizer and AST parser supporting pipes and redirects
- **Commands** (`js/commands.js`) - `ls`, `cd`, `pwd`, `cat`, `echo`, `help`, `clear`
- **Levels** (`js/levels.js`) - 3 levels teaching navigation basics
- **Game Engine** (`js/game.js`) - Pipeline execution, level management, win conditions
- **UI** (`index.html`, `style.css`, `js/main.js`) - Retro terminal interface

Total: ~26 tasks, each 2-5 minutes, following strict TDD with frequent commits.
