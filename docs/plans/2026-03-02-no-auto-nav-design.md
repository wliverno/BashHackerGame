# No Auto-Navigation + goto + Persistence Design

**Date:** 2026-03-02

## Problem

Currently `loadLevel` always sets `fs.cwd = level.startDir`, causing silent auto-teleports between levels (e.g. Level 7 starts at `/home/eve` even though the player just finished Level 6 in `/home/mallory`). The game should never move the player without them typing a command.

## Design

### 1. CWD Inheritance (game-loop.js)

`loadLevel` accepts an optional `preservedCwd` parameter:

```javascript
const loadLevel = (levelIndex, preservedCwd = null) => {
  const level = levels[levelIndex];
  const fs = createFilesystem(level.filesystem);
  fs.cwd = preservedCwd ?? level.startDir;
  // ...
};
```

| Scenario | preservedCwd | Result |
|---|---|---|
| Initial game start | null | uses `level.startDir` |
| Level advance | `fs.cwd` (previous level's last dir) | inherited |
| Restart level | null | uses `level.startDir` (clean state) |
| `goto N` | null | uses `level.startDir` (clean state) |

`level.startDir` is now the **restart anchor only** — not a teleporter.

### 2. SSH Also Sets CWD (network.js)

Currently `ssh` returns `switchUser` but not `switchCwd`. After SSH, the player's cwd stays at wherever they were (e.g. `/home/eve`) even though they're now logged in as alice. Fix: add `switchCwd: '/home/' + user` to the ssh return so the player lands in the new user's home directory.

### 3. Level 9 Filesystem Tweak (levels.js)

Level 8 ends in `/home/alice/research` (after `./measure.sh`). With cwd inheritance, Level 9 starts there. But `temp_results.txt` is currently in `alice/` — move it to `alice/research/` so `mv temp_results.txt /home/eve/` works naturally.

### 4. Tab-Complete Tip (levels.js — Level 3 story)

Level 3 introduces full-path navigation. Add to story:

> "Tip: press Tab to autocomplete file and directory names — great for long paths."

### 5. Level 12 Navigation Nudge (levels.js — Level 12 story)

Level 12 starts in `/var/data` (inherited from Level 11). The `evidence/` folder is relative to `/home/eve`. The story should hint at this without giving the command:

> "Your evidence folder is back in your home directory."

### 6. `goto N` Command (game-loop.js)

Handled like `hint` — intercepted before pipeline execution:

```javascript
if (input.trim().startsWith('goto ')) {
  const n = parseInt(input.trim().slice(5));
  if (isNaN(n) || n < 1 || n > levels.length) {
    return { output: `goto: valid levels are 1–${levels.length}`, exitCode: 1 };
  }
  // load level with startDir (clean state)
  // save to localStorage
  // return story + objective for new level
}
```

Displays the new level's story and first objective after jumping.

### 7. localStorage Persistence (terminal.js or game-loop.js)

Save on each level advance and `goto`:
```javascript
localStorage.setItem('savedLevel', currentLevel);      // 0-based index
localStorage.setItem('savedUser', currentUser);        // 'eve' or 'alice'
```

Load on game init:
```javascript
const savedLevel = parseInt(localStorage.getItem('savedLevel') || '0');
const savedUser = localStorage.getItem('savedUser') || 'eve';
```

If saved state exists, load that level with `startDir` (can't restore mid-session cwd, but avoids restarting from level 1). Also restore `currentUser`.

## Auto-Jump Analysis

| Level | Was | Auto-jump? | Fixed by |
|---|---|---|---|
| 7 | /home/mallory → /home/eve | ❌ | cwd inheritance |
| 8 | /home/eve → /home/alice | ❌ | ssh switchCwd |
| 9 | /home/alice → /home/alice/research | ⚠️ | cwd inheritance + move temp_results.txt |
| 10 | /home/eve → /var/data | ❌ | cwd inheritance (player navigates themselves) |
| 12 | /var/data → /home/eve | ❌ | cwd inheritance + story nudge |

## Test Impact

- `commands.test.js`: ssh test gets `switchCwd: '/home/alice'` assertion
- `game.test.js`: playthrough needs `cd /var/data` before Level 10, `cd /home/eve` before Level 12, and Level 9 mv from `/home/alice/research`
- `levels.test.js`: Level 9 filesystem mock updated for new `temp_results.txt` location
- No new test file needed; `goto` and localStorage covered in `game.test.js`
