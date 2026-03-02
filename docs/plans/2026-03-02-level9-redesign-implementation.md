# Level 9 Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Level 9 so Eve steals Alice's measurement data with `mv`, logs out with `quit`, then covers tracks with `rm /home/alice/.bash_history`.

**Architecture:** Add a `quit` command to `network.js` returning `switchUser`+`switchCwd`, handle `switchCwd` in `game-loop.js`, update Level 9's filesystem/substeps in `levels.js`, and update both test files.

**Tech Stack:** Vanilla JS (ES6 modules), Jest with `--experimental-vm-modules`

---

### Task 1: Failing test for `quit` command

**Files:**
- Modify: `tests/commands.test.js` (append after the `ssh` describe block, ~line 674)

**Step 1: Write the failing test**

Add this block after the closing `});` of the `ssh` describe block:

```javascript
describe('quit command', () => {
  test('quit closes SSH session and returns to eve', () => {
    const fs = createFilesystem({ home: { alice: {}, eve: {} } });
    fs.cwd = '/home/alice';
    fs.currentUser = 'alice';
    fs.homePath = '/home/alice';

    const result = commands.quit([], '', fs);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('closed');
    expect(result.switchUser).toBe('eve');
    expect(result.switchCwd).toBe('/home/eve');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- commands.test.js
```

Expected: FAIL — `commands.quit is not a function`

---

### Task 2: Implement `quit` in `network.js`

**Files:**
- Modify: `js/engine/commands/network.js`

**Step 1: Add `quit` to the exported commands object**

Current file ends with:
```javascript
  },
};
```

Add `quit` inside the `commands` object, after the `ssh` method:

```javascript
  quit(args, stdin, fs) {
    return {
      stdout: 'Connection to megafirm-qlab closed.',
      stderr: '',
      exitCode: 0,
      switchUser: 'eve',
      switchCwd: '/home/eve',
    };
  },
```

**Step 2: Run test to verify it passes**

```bash
npm test -- commands.test.js
```

Expected: PASS (all ssh tests + new quit test)

---

### Task 3: Handle `switchCwd` in `game-loop.js`

**Files:**
- Modify: `js/ui/game-loop.js` (~line 102)

**Step 1: Find the switchUser handler**

It currently looks like:
```javascript
if (result.switchUser) {
  currentUser = result.switchUser;
  fs.currentUser = result.switchUser;
  fs.homePath = '/home/' + result.switchUser;
}
```

**Step 2: Add `switchCwd` handling immediately after**

```javascript
if (result.switchUser) {
  currentUser = result.switchUser;
  fs.currentUser = result.switchUser;
  fs.homePath = '/home/' + result.switchUser;
}
if (result.switchCwd) {
  fs.cwd = result.switchCwd;
}
```

**Step 3: Run all tests to verify nothing broke**

```bash
npm test
```

Expected: all existing tests still PASS

---

### Task 4: Update `levels.test.js` for Level 9

**Files:**
- Modify: `tests/levels.test.js` (~line 182)

**Step 1: Replace the existing Level 9 test**

Find and replace this block (lines ~182–195):

```javascript
test('level 9 win conditions check mv, rm, and cd', () => {
  const level = levels[8];

  const moved = { readFile: (p) => p === '/home/eve/evidence/temp_results.txt' ? 'data' : null };
  const notMoved = { readFile: (p) => p === 'temp_results.txt' ? 'data' : null };
  expect(level.subSteps[0].winCondition('mv temp_results.txt /home/eve/evidence/', '', moved)).toBe(true);
  expect(level.subSteps[0].winCondition('mv temp_results.txt /home/eve/evidence/', '', notMoved)).toBe(false);

  expect(level.subSteps[1].winCondition('rm -r old_logs', '', { listDir: () => null })).toBe(true);
  expect(level.subSteps[1].winCondition('rm -r old_logs', '', { listDir: () => [] })).toBe(false);

  expect(level.subSteps[2].winCondition('cd /home/mallory', '', { cwd: '/home/mallory' })).toBe(true);
  expect(level.subSteps[2].winCondition('cd /home/mallory', '', { cwd: '/home/eve' })).toBe(false);
});
```

Replace with:

```javascript
test('level 9 win conditions check mv, quit, and rm bash_history', () => {
  const level = levels[8];
  expect(level.subSteps.length).toBe(3);

  // substep 0: mv temp_results.txt to /home/eve/
  const moved = { readFile: (p) => p === '/home/eve/temp_results.txt' ? 'data' : null };
  const notMoved = { readFile: () => null };
  expect(level.subSteps[0].winCondition('mv temp_results.txt /home/eve/', '', moved)).toBe(true);
  expect(level.subSteps[0].winCondition('mv temp_results.txt /home/eve/', '', notMoved)).toBe(false);

  // substep 1: quit (currentUser back to eve)
  expect(level.subSteps[1].winCondition('quit', '', { currentUser: 'eve' })).toBe(true);
  expect(level.subSteps[1].winCondition('quit', '', { currentUser: 'alice' })).toBe(false);

  // substep 2: rm /home/alice/.bash_history
  const deleted = { readFile: () => null };
  const notDeleted = { readFile: (p) => p === '/home/alice/.bash_history' ? 'history' : null };
  expect(level.subSteps[2].winCondition('rm /home/alice/.bash_history', '', deleted)).toBe(true);
  expect(level.subSteps[2].winCondition('rm /home/alice/.bash_history', '', notDeleted)).toBe(false);
});
```

**Step 2: Run to verify it fails**

```bash
npm test -- levels.test.js
```

Expected: FAIL — win conditions don't match yet

---

### Task 5: Update Level 9 in `levels.js`

**Files:**
- Modify: `js/gameplay/levels.js` (~line 510)

**Step 1: Replace the Level 9 object**

Find the Level 9 object (starts at `id: 9`). Replace entirely with:

```javascript
{
  id: 9,
  chapter: 3,
  title: 'Covering Tracks',
  story: `Well, that was something. You just collapsed a quantum superposition.
Alice is going to be furious when she finds out.

Take what you want and get out clean. mv moves or renames files.
rm removes files permanently. No traces.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {
    home: {
      alice: {
        research: ALICE_RESEARCH_CONTENT,
        'temp_results.txt': 'Measurement results: entanglement verified\nBell inequality: violated (S = 2.73 > 2)\nQuantum state fidelity: 99.7%\nTimestamp: 2024-01-16T14:30:00',
        '.bash_history': 'ls\ncat research/README.txt\n./research/measure.sh\ncat research/alice.qubit\n',
      },
    },
  }),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/alice',
  restrictedDirs: {
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Take Alice\'s measurement results — move them to your home directory.',
      hints: [
        'mv moves a file from one place to another',
        'Syntax: mv source destination',
        'Try: mv temp_results.txt /home/eve/',
      ],
      winCondition: (cmd, output, fs) => {
        return fs.readFile('/home/eve/temp_results.txt') !== null &&
               fs.readFile('temp_results.txt') === null;
      },
    },
    {
      objective: 'Log out of Alice\'s account.',
      hints: [
        'Type: quit',
      ],
      winCondition: (cmd, output, fs) => fs.currentUser === 'eve',
    },
    {
      objective: 'Delete Alice\'s bash history to cover your tracks.',
      hints: [
        'bash_history records every command typed in a session',
        'rm removes a file permanently',
        'Try: rm /home/alice/.bash_history',
      ],
      winCondition: (cmd, output, fs) => fs.readFile('/home/alice/.bash_history') === null,
    },
  ],
},
```

**Step 2: Run levels test to verify it passes**

```bash
npm test -- levels.test.js
```

Expected: PASS

---

### Task 6: Update `game.test.js` Level 9 playthrough

**Files:**
- Modify: `tests/game.test.js` (~line 236)

**Step 1: Find the Level 9 section**

It currently reads:
```javascript
// Level 9 — Covering Tracks
expect(game.currentLevel).toBe(8);
game.runCommand('mv temp_results.txt /home/eve/evidence/');
game.runCommand('rm -r old_logs');
game.runCommand('cd /home/mallory');
```

**Step 2: Replace with new commands**

```javascript
// Level 9 — Covering Tracks
expect(game.currentLevel).toBe(8);
game.runCommand('mv temp_results.txt /home/eve/');
game.runCommand('quit');
game.runCommand('rm /home/alice/.bash_history');
```

**Step 3: Run all tests**

```bash
npm test
```

Expected: all tests PASS

---

### Task 7: Final verification and commit

**Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests PASS, count ≥ 194

**Step 2: Commit**

```bash
git add js/engine/commands/network.js js/ui/game-loop.js js/gameplay/levels.js tests/commands.test.js tests/levels.test.js tests/game.test.js docs/plans/2026-03-02-level9-redesign.md docs/plans/2026-03-02-level9-redesign-implementation.md
git commit -m "feat: redesign level 9 with quit command and bash_history cleanup"
```
