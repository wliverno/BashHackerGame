# No Auto-Nav + goto + Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the game carry the player's cwd across level boundaries (no auto-teleporting), add a `goto N` command to jump levels, and persist progress in localStorage so page reloads don't lose your place.

**Architecture:** `loadLevel` in game-loop.js gets an optional `preservedCwd` param (null = use startDir for restart/init, string = carry over). The `ssh` command also returns `switchCwd` so SSH actually lands you in the new user's home. localStorage is managed entirely in main.js to keep game-loop.js testable in Node. `goto N` is handled in `runCommand` before pipeline execution, like `hint`.

**Tech Stack:** Vanilla JS ES6 modules, Jest with `--experimental-vm-modules`, browser localStorage (guarded in main.js only)

---

### Task 1: SSH returns switchCwd

**Files:**
- Modify: `js/engine/commands/network.js` (the `ssh` method)
- Test: `tests/commands.test.js` (the existing `ssh` describe block)

**Step 1: Update the existing ssh success test to assert switchCwd**

Find the test at ~line 631 that says `test('ssh user@host succeeds when .ssh/id_rsa exists', ...)`.

Add one assertion at the end:
```javascript
expect(result.switchCwd).toBe('/home/alice');
```

Run `npm test -- commands.test.js` — confirm it FAILS.

**Step 2: Add `switchCwd` to ssh return in network.js**

Find the `ssh` method. The current return is:
```javascript
return {
  stdout: `Welcome to ${host}!\nLogged in as ${user}.`,
  stderr: '',
  exitCode: 0,
  switchUser: user,
};
```

Change to:
```javascript
return {
  stdout: `Welcome to ${host}!\nLogged in as ${user}.`,
  stderr: '',
  exitCode: 0,
  switchUser: user,
  switchCwd: '/home/' + user,
};
```

**Step 3: Run test — confirm it passes**

```bash
npm test -- commands.test.js
```

Expected: all ssh and quit tests pass.

**Step 4: Run full suite**

```bash
npm test
```

Expected: all 196 tests pass.

**Step 5: Commit**

```bash
git add js/engine/commands/network.js tests/commands.test.js
git commit -m "feat: ssh also sets cwd to new user's home directory"
```

---

### Task 2: loadLevel accepts preservedCwd + level advance carries cwd

**Files:**
- Modify: `js/ui/game-loop.js` (lines 28–36 and 134–137)
- Test: `tests/game.test.js`

**Step 1: Write a failing test for cwd inheritance**

Add a new test in the `createGame` describe block in `tests/game.test.js`:

```javascript
test('carries cwd from previous level on advance', () => {
  const game = createGame();

  // Navigate to /home — not the normal substep location
  game.runCommand('cd ..');
  expect(game.fs.cwd).toBe('/home');

  // Complete level 1 (the game advances to level 2)
  game.runCommand('pwd');  // substep 0: already done above? No — we did cd .., pwd still needed
  // Actually: substep 0 requires pwd, but we cd'd first. Run in order:
  // Reset: create fresh game
  const game2 = createGame();
  game2.runCommand('pwd');           // advance substep 0
  game2.runCommand('ls');            // advance substep 1
  game2.runCommand('cd ..');         // navigate somewhere unusual (not a win condition)
  expect(game2.fs.cwd).toBe('/home');
  game2.runCommand('cat welcome.txt');  // advance substep 2 → level advances to level 2
  // After level advance, cwd should be inherited (/home), not reset to level2.startDir (/home/eve)
  expect(game2.fs.cwd).toBe('/home');
  expect(game2.currentLevel).toBe(1);
});
```

Run `npm test -- game.test.js` — confirm it FAILS (cwd resets to /home/eve on level advance).

**Step 2: Update loadLevel to accept preservedCwd**

In `js/ui/game-loop.js`, replace the `loadLevel` function (lines 28–36):

```javascript
const loadLevel = (levelIndex, preservedCwd = null) => {
  const level = levels[levelIndex];
  const fs = createFilesystem(level.filesystem);
  fs.cwd = preservedCwd ?? level.startDir;
  fs.restrictedDirs = level.restrictedDirs || {};
  fs.currentUser = currentUser;
  activeProtectedFiles = snapshotProtectedFiles(fs, level.protectedFiles);
  return fs;
};
```

**Step 3: Pass cwd on level advance**

In `runCommand`, find the level advance block (~line 134):

```javascript
} else if (currentLevel < levels.length - 1) {
  currentLevel++;
  currentSubStep = 0;
  fs = loadLevel(currentLevel);
```

Change `loadLevel(currentLevel)` to `loadLevel(currentLevel, fs.cwd)`:

```javascript
} else if (currentLevel < levels.length - 1) {
  const prevCwd = fs.cwd;
  currentLevel++;
  currentSubStep = 0;
  fs = loadLevel(currentLevel, prevCwd);
```

**Step 4: Run test — confirm it passes**

```bash
npm test -- game.test.js
```

Expected: the new test passes. All others still pass.

**Step 5: Run full suite**

```bash
npm test
```

Expected: all 196+ tests pass.

**Step 6: Commit**

```bash
git add js/ui/game-loop.js tests/game.test.js
git commit -m "feat: carry cwd across level boundaries instead of auto-resetting to startDir"
```

---

### Task 3: createGame accepts startLevel/startUser for persistence

**Files:**
- Modify: `js/ui/game-loop.js` (the `createGame` function signature and init)
- Test: `tests/game.test.js`

**Step 1: Write a failing test**

Add to game.test.js:
```javascript
test('createGame respects startLevel option', () => {
  const game = createGame({ startLevel: 4 });
  expect(game.currentLevel).toBe(4);
  expect(game.fs.cwd).toBe(levels[4].startDir);
});

test('createGame respects startUser option', () => {
  const game = createGame({ startUser: 'alice' });
  expect(game.currentUser).toBe('alice');
});
```

Run `npm test -- game.test.js` — confirm they FAIL.

**Step 2: Add options param to createGame**

Change the function signature and init in `js/ui/game-loop.js`:

```javascript
export function createGame({ startLevel = 0, startUser = 'eve' } = {}) {
  let currentLevel = startLevel;
  let currentSubStep = 0;
  let hintIndex = 0;
  let won = false;
  let currentUser = startUser;
  // ... rest unchanged
  let fs = loadLevel(startLevel);  // always uses startDir for fresh start
```

**Step 3: Verify tests pass**

```bash
npm test -- game.test.js
```

Expected: new tests pass.

**Step 4: Run full suite**

```bash
npm test
```

Expected: all tests pass. (Existing `createGame()` calls use the default `{}` so no breakage.)

**Step 5: Commit**

```bash
git add js/ui/game-loop.js tests/game.test.js
git commit -m "feat: createGame accepts startLevel and startUser options for persistence"
```

---

### Task 4: goto N command

**Files:**
- Modify: `js/ui/game-loop.js` (runCommand, before pipeline)
- Test: `tests/game.test.js`

**Step 1: Write failing tests**

Add to game.test.js:
```javascript
test('goto N jumps to level N using startDir', () => {
  const game = createGame();
  // Navigate somewhere unusual first
  game.runCommand('cd ..');
  expect(game.fs.cwd).toBe('/home');

  const result = game.runCommand('goto 5');
  expect(game.currentLevel).toBe(4);           // 0-indexed
  expect(game.currentSubStep).toBe(0);
  expect(game.fs.cwd).toBe(levels[4].startDir); // uses startDir, not inherited cwd
  expect(result.gotoLevel).toBe(true);
  expect(result.story).toBeDefined();
  expect(result.levelTitle).toBeDefined();
  expect(result.newObjective).toBeDefined();
});

test('goto with invalid level returns error', () => {
  const game = createGame();
  const result = game.runCommand('goto 0');
  expect(result.exitCode).toBe(1);
  expect(game.currentLevel).toBe(0); // unchanged
});

test('goto with out-of-range level returns error', () => {
  const game = createGame();
  const result = game.runCommand('goto 999');
  expect(result.exitCode).toBe(1);
});
```

Run `npm test -- game.test.js` — confirm they FAIL.

**Step 2: Implement goto in runCommand**

In `js/ui/game-loop.js`, add the `goto` handler after the `hint` handler and BEFORE `executePipeline`. The current structure is:

```javascript
runCommand(input) {
  if (input.trim() === 'hint') {
    // ...
  }

  const result = executePipeline(input, fs);
```

Insert between them:

```javascript
  const gotoMatch = input.trim().match(/^goto\s+(\d+)$/);
  if (gotoMatch) {
    const n = parseInt(gotoMatch[1]);
    if (isNaN(n) || n < 1 || n > levels.length) {
      return { output: `goto: valid levels are 1\u2013${levels.length}`, exitCode: 1 };
    }
    currentLevel = n - 1;
    currentSubStep = 0;
    hintIndex = 0;
    currentUser = 'eve';
    fs = loadLevel(currentLevel); // uses startDir, fresh state
    return {
      output: '',
      exitCode: 0,
      gotoLevel: true,
      story: this.getStory(),
      levelTitle: this.getLevelTitle(),
      newObjective: this.getObjective(),
    };
  }
```

**Step 3: Verify tests pass**

```bash
npm test -- game.test.js
```

Expected: all goto tests pass.

**Step 4: Handle goto result in main.js**

In `js/main.js`, after the `result.advanced` block, add:

```javascript
if (result.gotoLevel) {
  this.clear();
  printLevelHeader(this, game.currentLevel, result.levelTitle);
  printStory(this, result.story);
  printObjective(this, result.newObjective);
}
```

**Step 5: Run full suite**

```bash
npm test
```

Expected: all tests pass.

**Step 6: Commit**

```bash
git add js/ui/game-loop.js js/main.js tests/game.test.js
git commit -m "feat: add goto N command to jump directly to any level"
```

---

### Task 5: localStorage persistence

**Files:**
- Modify: `js/main.js` only (localStorage stays out of game-loop.js to keep it testable)

This task has no Jest tests (localStorage is a browser API). Verify manually by running `npx serve .` and checking that reloading the page lands on the correct level.

**Step 1: Load saved progress before creating game**

In `js/main.js`, replace:
```javascript
const game = createGame();
```

With:
```javascript
const savedLevel = parseInt(localStorage.getItem('savedLevel') || '0');
const savedUser = localStorage.getItem('savedUser') || 'eve';
const game = createGame({ startLevel: savedLevel, startUser: savedUser });
```

**Step 2: Save progress on level advance**

In the `result.advanced` + `result.newLevel` block:
```javascript
if (result.newLevel) {
  localStorage.setItem('savedLevel', game.currentLevel);
  localStorage.setItem('savedUser', game.currentUser);
  printLevelHeader(this, game.currentLevel, result.levelTitle);
  printStory(this, result.story);
}
```

**Step 3: Save progress on goto**

In the `result.gotoLevel` block:
```javascript
if (result.gotoLevel) {
  localStorage.setItem('savedLevel', game.currentLevel);
  localStorage.setItem('savedUser', 'eve'); // goto always resets to eve
  this.clear();
  printLevelHeader(this, game.currentLevel, result.levelTitle);
  printStory(this, result.story);
  printObjective(this, result.newObjective);
}
```

**Step 4: Run test suite to confirm no regressions**

```bash
npm test
```

Expected: all tests pass (localStorage not exercised in Node tests).

**Step 5: Commit**

```bash
git add js/main.js
git commit -m "feat: persist level progress in localStorage across page reloads"
```

---

### Task 6: Level 9 — move temp_results.txt into alice/research

**Files:**
- Modify: `js/gameplay/levels.js` (Level 9 filesystem)
- Test: `tests/levels.test.js` (Level 9 win condition mock)
- Test: `tests/game.test.js` (playthrough — mv command)

**Rationale:** With cwd inheritance, Level 9 starts in `/home/alice/research` (inherited from Level 8 ending in research). `temp_results.txt` must be there for `mv temp_results.txt /home/eve/` to work.

**Step 1: Write failing test**

In `tests/levels.test.js`, the Level 9 substep 0 win condition mock currently uses:
```javascript
const moved = {
  readFile: (p) => p === '/home/eve/temp_results.txt' ? 'data' : null
};
```

The source check uses `/home/alice/temp_results.txt`. Update both the mock comment and the win condition check location (the win condition in levels.js already uses the absolute path `/home/alice/temp_results.txt`).

What changes: in `levels.js` Level 9 filesystem, move `temp_results.txt` from `alice:` to `alice.research:`:

**Step 2: Update levels.js Level 9 filesystem**

Find Level 9's filesystem definition. Change:
```javascript
filesystem: mergeFilesystem(BASE_FILESYSTEM, {
  home: {
    alice: {
      research: ALICE_RESEARCH_CONTENT,
      'temp_results.txt': 'Measurement results: entanglement verified\n...',
      '.bash_history': '...',
    },
  },
}),
```

To (move `temp_results.txt` inside `research`):
```javascript
filesystem: mergeFilesystem(BASE_FILESYSTEM, {
  home: {
    alice: {
      research: {
        ...ALICE_RESEARCH_CONTENT,
        'temp_results.txt': 'Measurement results: entanglement verified\nBell inequality: violated (S = 2.73 > 2)\nQuantum state fidelity: 99.7%\nTimestamp: 2024-01-16T14:30:00',
      },
      '.bash_history': 'ls\ncat research/README.txt\n./research/measure.sh\ncat research/alice.qubit\n',
    },
  },
}),
```

**Step 3: Update win condition in levels.js Level 9 substep 0**

The source file path in the win condition needs to change from `/home/alice/temp_results.txt` to `/home/alice/research/temp_results.txt`:

```javascript
winCondition: (cmd, output, fs) => {
  return fs.readFile('/home/eve/temp_results.txt') !== null &&
         fs.readFile('/home/alice/research/temp_results.txt') === null;
},
```

**Step 4: Update levels.test.js Level 9 mock**

Update the mock comment to reflect the new source path:
```javascript
// source at /home/alice/research/temp_results.txt is gone (null), destination at /home/eve/ exists
const moved = { readFile: (p) => p === '/home/eve/temp_results.txt' ? 'data' : null };
```

The existing mocks still work correctly since they return null for everything except the destination.

**Step 5: Update game.test.js playthrough**

Level 9 now starts in `/home/alice/research` (inherited). The `mv` command works from there:
- `mv temp_results.txt /home/eve/` — no path change needed (file is in cwd)

However, Level 7 now starts in `/home/mallory` (inherited from Level 6). It needs the player to navigate home first. And Level 10 starts in `/home/eve` (inherited after quit). Level 12 starts in `/var/data` (inherited from Level 11).

Make these changes to the playthrough test:

```javascript
// Level 7 — Copying the Keys (player is in /home/mallory from level 6)
expect(game.currentLevel).toBe(6);
game.runCommand('cd /home/eve');   // navigate home first — no substep for this
game.runCommand('mkdir evidence');
game.runCommand('mkdir .ssh');
game.runCommand('cp /home/alice/.ssh/* .ssh/');
game.runCommand('ssh alice@megafirm-qlab');

// Level 8 — Quantum Measurement (starts in /home/alice via ssh switchCwd)
expect(game.currentLevel).toBe(7);
game.runCommand('cd research');
game.runCommand('cat README.txt');
game.runCommand('chmod +rw alice.qubit bob.qubit');
game.runCommand('chmod +x measure.sh');
game.runCommand('./measure.sh');

// Level 9 — Covering Tracks (starts in /home/alice/research, temp_results.txt is here)
expect(game.currentLevel).toBe(8);
game.runCommand('mv temp_results.txt /home/eve/');
game.runCommand('quit');
game.runCommand('rm /home/alice/.bash_history');
expect(game.currentLevel).toBe(9);

// Level 10 — Counting the Damage (starts in /home/eve after quit)
expect(game.currentLevel).toBe(9);
game.runCommand('cd /var/data');   // navigate to data — no substep for this
game.runCommand('cat sensor_readings.csv | wc');
game.runCommand('cat sensor_readings.csv | sort');
game.runCommand('cat /var/log/access.log | grep mallory');

// Level 11 — Narrowing the Search (starts in /var/data inherited from level 10)
expect(game.currentLevel).toBe(10);
game.runCommand('cat sensor_readings.csv | grep "2.99E" | wc');
game.runCommand('cat /var/log/access.log | sort | head -n 5');
game.runCommand('cat sensor_readings.csv | grep "2.99E" | sort -n | tail -n 3');

// Level 12 — The Evidence Dossier (starts in /var/data inherited from level 11)
expect(game.currentLevel).toBe(11);
game.runCommand('cd /home/eve');   // navigate home — evidence folder is here
game.runCommand('grep mallory /var/log/access.log > evidence/access_proof.txt');
game.runCommand('grep "2.99E" /var/data/sensor_readings.csv > evidence/speed_anomalies.txt');

expect(game.won).toBe(true);
```

Also update the `chapterComplete` test's fast-forward section similarly (it also goes through levels 6→7).

**Step 6: Run full suite**

```bash
npm test
```

Expected: all tests pass.

**Step 7: Commit**

```bash
git add js/gameplay/levels.js tests/levels.test.js tests/game.test.js
git commit -m "feat: move temp_results.txt to alice/research, update playthrough for cwd inheritance"
```

---

### Task 7: Level 3 tab-complete tip + Level 12 navigation nudge

**Files:**
- Modify: `js/gameplay/levels.js` (Level 3 story and Level 12 story)

**No tests needed** — story text changes don't affect any win conditions.

**Step 1: Level 3 story — add tab-complete tip**

Find Level 3's story (id: 3). It currently ends with:
```
You can also use cd with full paths, like cd /home/eve, to jump
directly to a location.
```

Append:
```
Tip: press Tab to autocomplete file and directory names — great for long paths.
```

**Step 2: Level 12 story — add navigation nudge**

Find Level 12's story (id: 12). Add to the end of the story:
```
Your evidence folder is back home. You know how to get there.
```

**Step 3: Run full suite**

```bash
npm test
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add js/gameplay/levels.js
git commit -m "feat: add tab-complete tip to level 3, navigation nudge to level 12"
```

---

### Task 8: Final verification

**Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests pass, count ≥ 199 (196 + 3 new tests from tasks 2–4).

**Step 2: Check the chapterComplete fast-forward test**

The test at ~line 263 in game.test.js also runs through levels 6→7. Make sure it also includes `game.runCommand('cd /home/eve')` before the Level 7 mkdir commands.

**Step 3: Commit design doc**

```bash
git add docs/plans/2026-03-02-no-auto-nav-design.md docs/plans/2026-03-02-no-auto-nav-implementation.md
git commit -m "docs: add no-auto-nav + goto + persistence design and implementation plan"
```
