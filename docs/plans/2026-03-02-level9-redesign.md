# Level 9 Redesign: Covering Tracks

**Date:** 2026-03-02

## Problem

The current Level 9 asks Eve to:
- `mv temp_results.txt /home/eve/evidence/` — narratively odd (evidence folder not established until Ch.4)
- `rm -r old_logs` — Eve deleting Alice's debug logs makes no sense; they belong to Alice, not Eve
- `cd /home/mallory` — chapter bridge, but the framing is weak

## Design

**Title:** "Covering Tracks" (keep)

**Story:** Eve just collapsed a quantum superposition. Alice will be furious.
Time to take what you want and get out clean.

**Substeps (3):**

1. `mv temp_results.txt /home/eve/`
   - Eve steals Alice's quantum measurement results
   - Teaches `mv` as file relocation (not just rename)
   - Win condition: `/home/alice/temp_results.txt` gone, `/home/eve/temp_results.txt` exists

2. `quit`
   - Close the SSH session, return to Eve's account at `/home/eve`
   - New command (see below)
   - Win condition: `fs.currentUser === 'eve'`

3. `rm /home/alice/.bash_history`
   - Delete the session trail from Alice's home directory
   - Classic "covering tracks" trope, memorable
   - Win condition: `fs.readFile('/home/alice/.bash_history') === null`

## Filesystem Changes

**Remove:**
- `alice/old_logs/` directory (no longer needed)
- `eve/evidence/` directory (premature — introduced in Level 12)

**Add:**
- `/home/alice/.bash_history` with fake SSH session lines, e.g.:
  ```
  ls
  cat research/README.txt
  ./research/measure.sh
  cat research/alice.qubit
  ```

## New `quit` Command

Add to `js/engine/commands/network.js`:

```javascript
quit(args, stdin, fs) {
  return {
    stdout: 'Connection to megafirm-qlab closed.',
    stderr: '',
    exitCode: 0,
    switchUser: 'eve',
    switchCwd: '/home/eve',
  };
}
```

Handle `switchCwd` in `js/ui/game-loop.js` (alongside existing `switchUser` handler):

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

## Test Updates

- `tests/levels.test.js`: Level 9 now has 3 substeps with new win conditions
- `tests/game.test.js`: Playthrough uses `mv`, `quit`, `rm` instead of old commands
