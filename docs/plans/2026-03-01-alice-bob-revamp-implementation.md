# Alice & Bob Storyline Revamp — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Umbrella Corp storyline with a quantum computing lab setting (Eve, Alice, Bob, Mallory), add user identity switching (ssh command), and add restricted directory access.

**Architecture:** Three engine additions (user identity state, restricted directories, ssh command) plus a complete rewrite of all game content (levels, chapters, terminal UI text). The filesystem, parser, executor, and existing commands stay untouched.

**Tech Stack:** Vanilla JavaScript (ES6 modules), jQuery Terminal, Jest

**Design doc:** `docs/plans/2026-03-01-alice-bob-revamp-design.md`

---

### Task 1: Add user identity state to game-loop.js

**Files:**
- Modify: `js/ui/game-loop.js:15-28`

**Step 1: Write the failing test**

Add to `tests/game.test.js`:

```javascript
describe('user identity', () => {
  test('game starts with currentUser as eve', () => {
    const game = createGame();
    expect(game.currentUser).toBe('eve');
  });

  test('switchUser changes currentUser', () => {
    const game = createGame();
    game.switchUser('alice');
    expect(game.currentUser).toBe('alice');
  });

  test('restartLevel preserves currentUser', () => {
    const game = createGame();
    game.switchUser('alice');
    game.restartLevel();
    expect(game.currentUser).toBe('alice');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/game.test.js --testNamePattern="user identity" --verbose`
Expected: FAIL — `game.currentUser` is undefined, `game.switchUser` is not a function

**Step 3: Write minimal implementation**

In `js/ui/game-loop.js`, add `currentUser` state:

```javascript
// Add after line 19 (let won = false;)
let currentUser = 'eve';
```

Add to the `game` object (after `get won()` on line 34):

```javascript
get currentUser() { return currentUser; },

switchUser(user) {
  currentUser = user;
},
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/game.test.js --testNamePattern="user identity" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add js/ui/game-loop.js tests/game.test.js
git commit -m "feat: add user identity state to game loop"
```

---

### Task 2: Add restricted directory support to cd command

**Files:**
- Modify: `js/engine/commands/navigation.js:54-80`
- Modify: `js/ui/game-loop.js` (pass restricted dirs and currentUser to executor)

The approach: Levels define a `restrictedDirs` map on the level object. The game loop passes this + `currentUser` to the filesystem as metadata. The `cd` command checks this before allowing entry.

**Step 1: Write the failing test**

Add to `tests/commands.test.js` (or `tests/game.test.js` depending on where cd is tested):

```javascript
describe('restricted directories', () => {
  test('cd blocks entry to restricted dir when user does not match', () => {
    const fs = createFilesystem({
      home: {
        alice: {
          research: {
            'data.txt': 'secret',
          },
        },
      },
    });
    fs.cwd = '/home/alice';
    fs.restrictedDirs = { '/home/alice/research': 'alice' };
    fs.currentUser = 'eve';

    const result = commands.cd(['research'], '', fs);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Permission denied');
    expect(fs.cwd).toBe('/home/alice');
  });

  test('cd allows entry to restricted dir when user matches', () => {
    const fs = createFilesystem({
      home: {
        alice: {
          research: {
            'data.txt': 'secret',
          },
        },
      },
    });
    fs.cwd = '/home/alice';
    fs.restrictedDirs = { '/home/alice/research': 'alice' };
    fs.currentUser = 'alice';

    const result = commands.cd(['research'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.cwd).toBe('/home/alice/research');
  });

  test('cd works normally when no restrictedDirs set', () => {
    const fs = createFilesystem({
      home: { eve: { docs: {} } },
    });
    fs.cwd = '/home/eve';

    const result = commands.cd(['docs'], '', fs);
    expect(result.exitCode).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/commands.test.js --testNamePattern="restricted directories" --verbose`
Expected: FAIL — cd doesn't check restrictedDirs

**Step 3: Write minimal implementation**

In `js/engine/commands/navigation.js`, update the `cd` function. Add the restriction check after the directory type check (after line 72):

```javascript
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

    // Check restricted directory access
    if (fs.restrictedDirs) {
      const absPath = fs.getAbsolutePath(target);
      const requiredUser = fs.restrictedDirs[absPath];
      if (requiredUser && fs.currentUser !== requiredUser) {
        return {
          stdout: '',
          stderr: `cd: ${target}: Permission denied`,
          exitCode: 1,
        };
      }
    }

    fs.changeDir(target);
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
    };
  },
```

Then in `js/ui/game-loop.js`, update `loadLevel` to set these on the filesystem:

```javascript
const loadLevel = (levelIndex) => {
    const level = levels[levelIndex];
    const fs = createFilesystem(level.filesystem);
    fs.cwd = level.startDir;
    fs.restrictedDirs = level.restrictedDirs || {};
    fs.currentUser = currentUser;
    return fs;
  };
```

Also update `runCommand` — after any command runs, keep `fs.currentUser` in sync:

In the `switchUser` method, also update `fs.currentUser`:

```javascript
switchUser(user) {
  currentUser = user;
  fs.currentUser = user;
},
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/commands.test.js --testNamePattern="restricted directories" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add js/engine/commands/navigation.js js/ui/game-loop.js tests/commands.test.js
git commit -m "feat: add restricted directory access based on user identity"
```

---

### Task 3: Add ssh command

**Files:**
- Create: `js/engine/commands/network.js`
- Modify: `js/engine/commands/index.js:1-15`

The ssh command is handled specially — it needs to interact with game state (switching user). We'll implement it as a regular command that sets a flag on the filesystem, and the game loop will detect it.

**Step 1: Write the failing test**

Add to `tests/commands.test.js`:

```javascript
import { commands as networkCommands } from '../js/engine/commands/network.js';

describe('ssh command', () => {
  test('ssh alice@megafirm-qlab succeeds when .ssh/id_rsa exists', () => {
    const fs = createFilesystem({
      home: { eve: { '.ssh': { 'id_rsa': 'fake-key' } } },
    });
    fs.cwd = '/home/eve';
    fs.homePath = '/home/eve';

    const result = networkCommands.ssh(['alice@megafirm-qlab'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('alice');
    expect(result.switchUser).toBe('alice');
  });

  test('ssh fails when no .ssh/id_rsa exists', () => {
    const fs = createFilesystem({
      home: { eve: {} },
    });
    fs.cwd = '/home/eve';
    fs.homePath = '/home/eve';

    const result = networkCommands.ssh(['alice@megafirm-qlab'], '', fs);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Permission denied');
  });

  test('ssh fails with no arguments', () => {
    const fs = createFilesystem({ home: { eve: {} } });
    fs.cwd = '/home/eve';

    const result = networkCommands.ssh([], '', fs);
    expect(result.exitCode).toBe(1);
  });

  test('ssh fails with invalid user@host format', () => {
    const fs = createFilesystem({
      home: { eve: { '.ssh': { 'id_rsa': 'key' } } },
    });
    fs.cwd = '/home/eve';
    fs.homePath = '/home/eve';

    const result = networkCommands.ssh(['badformat'], '', fs);
    expect(result.exitCode).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/commands.test.js --testNamePattern="ssh command" --verbose`
Expected: FAIL — module doesn't exist

**Step 3: Write minimal implementation**

Create `js/engine/commands/network.js`:

```javascript
export const commands = {
  ssh(args, stdin, fs) {
    if (args.length === 0) {
      return { stdout: '', stderr: 'usage: ssh user@hostname', exitCode: 1 };
    }

    const target = args[0];
    const match = target.match(/^(\w+)@(.+)$/);
    if (!match) {
      return { stdout: '', stderr: `ssh: invalid target '${target}'`, exitCode: 1 };
    }

    const [, user, host] = match;

    // Check if SSH key exists in current user's home
    const keyPath = fs.homePath + '/.ssh/id_rsa';
    const key = fs.readFile(keyPath);

    if (!key) {
      return {
        stdout: '',
        stderr: `${target}: Permission denied (publickey).`,
        exitCode: 1,
      };
    }

    return {
      stdout: `Welcome to ${host}!\nLogged in as ${user}.`,
      stderr: '',
      exitCode: 0,
      switchUser: user,
    };
  },
};
```

Update `js/engine/commands/index.js` to include network commands:

```javascript
import { commands as navigationCommands } from './navigation.js';
import { commands as fileCommands } from './files.js';
import { commands as permissionCommands } from './permissions.js';
import { commands as metaCommands } from './meta.js';
import { commands as textCommands } from './text.js';
import { commands as networkCommands } from './network.js';

export const commands = {
  ...navigationCommands,
  ...fileCommands,
  ...permissionCommands,
  ...metaCommands,
  ...textCommands,
  ...networkCommands,
};

export const COMMAND_NAMES = Object.keys(commands);
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/commands.test.js --testNamePattern="ssh command" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add js/engine/commands/network.js js/engine/commands/index.js tests/commands.test.js
git commit -m "feat: add ssh command for user switching"
```

---

### Task 4: Handle ssh user-switching in game loop and executor

**Files:**
- Modify: `js/ui/game-loop.js:74-126`
- Modify: `js/engine/executor.js:86-106`

The executor needs to detect `switchUser` in command results and bubble it up. The game loop needs to call `switchUser()` and update the filesystem's `homePath`.

**Step 1: Write the failing test**

Add to `tests/game.test.js`:

```javascript
describe('ssh user switching in game', () => {
  test('running ssh command with valid key changes currentUser', () => {
    // This test depends on a level that has .ssh keys and ssh as a valid action
    // We'll test the mechanism directly
    const game = createGame();

    // Manually set up the filesystem to have .ssh keys
    game.fs.writeFile('/home/eve/.ssh/id_rsa', 'fake-key');
    game.fs.createDir('/home/eve/.ssh');
    game.fs.writeFile('.ssh/id_rsa', 'fake-key');

    const result = game.runCommand('ssh alice@megafirm-qlab');
    expect(game.currentUser).toBe('alice');
  });
});
```

Note: This test may need adjustment based on how the filesystem is set up for the test. The key thing is testing that `runCommand` with `ssh` triggers `switchUser`.

**Step 2: Run test to verify it fails**

Run: `npx jest tests/game.test.js --testNamePattern="ssh user switching" --verbose`
Expected: FAIL — ssh doesn't trigger switchUser

**Step 3: Write minimal implementation**

In `js/engine/executor.js`, after the pipeline execution loop (around line 106), before the redirect handling, check for `switchUser` on the last result and pass it through:

```javascript
  const output = lastResult.stderr || lastResult.stdout;
  return {
    output,
    exitCode: lastResult.exitCode,
    clear: lastResult.clear,
    switchUser: lastResult.switchUser,
  };
```

In `js/ui/game-loop.js`, in the `runCommand` method, after `const result = executePipeline(input, fs);` (line 83), add:

```javascript
      // Handle user switching (e.g., from ssh command)
      if (result.switchUser) {
        currentUser = result.switchUser;
        fs.currentUser = result.switchUser;
        fs.homePath = '/home/' + result.switchUser;
      }
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/game.test.js --testNamePattern="ssh user switching" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add js/engine/executor.js js/ui/game-loop.js tests/game.test.js
git commit -m "feat: wire ssh user-switching through executor and game loop"
```

---

### Task 5: Update terminal.js — prompt, win screen, and chapter text

**Files:**
- Modify: `js/ui/terminal.js:1-51`
- Modify: `js/main.js:88` (prompt function call)

**Step 1: Write the failing test**

Add to `tests/game.test.js`:

```javascript
import { formatPrompt } from '../js/ui/terminal.js';

describe('formatPrompt', () => {
  test('shows eve@megafirm-qlab with eve home path', () => {
    const fs = { cwd: '/home/eve', currentUser: 'eve', homePath: '/home/eve' };
    const prompt = formatPrompt(fs);
    expect(prompt).toContain('eve@megafirm-qlab');
    expect(prompt).toContain('~');
  });

  test('shows alice@megafirm-qlab after user switch', () => {
    const fs = { cwd: '/home/alice', currentUser: 'alice', homePath: '/home/alice' };
    const prompt = formatPrompt(fs);
    expect(prompt).toContain('alice@megafirm-qlab');
    expect(prompt).toContain('~');
  });

  test('shows full path when not in home directory', () => {
    const fs = { cwd: '/var/data', currentUser: 'eve', homePath: '/home/eve' };
    const prompt = formatPrompt(fs);
    expect(prompt).toContain('/var/data');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/game.test.js --testNamePattern="formatPrompt" --verbose`
Expected: FAIL — prompt still shows `analyst@ucorp-srv-04`

**Step 3: Write minimal implementation**

Update `js/ui/terminal.js` `formatPrompt`:

```javascript
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
```

Update `printWinScreen`:

```javascript
export function printWinScreen(term) {
  term.echo('');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('[[;#0f0;]      INVESTIGATION COMPLETE!           ]');
  term.echo('[[;#0f0;]═══════════════════════════════════════]');
  term.echo('');
  term.echo("[[;#0ff;]The evidence is irrefutable. Mallory's sabotage of the quantum computer has been fully documented.]");
  term.echo('[[;#0ff;]The speed-of-light anomalies, the tampered sensor readings, the suspicious access logs — it all points to one person.]');
  term.echo('');
  term.echo('[[;#ff0;]Congratulations, Eve. The quantum lab is safe... for now.]');
  term.echo('');
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest tests/game.test.js --testNamePattern="formatPrompt" --verbose`
Expected: PASS

**Step 5: Commit**

```bash
git add js/ui/terminal.js
git commit -m "feat: update prompt and win screen for Alice & Bob theme"
```

---

### Task 6: Update chapters.js

**Files:**
- Modify: `js/gameplay/chapters.js:1-27`

**Step 1: Update chapter metadata**

No test needed — this is pure metadata. Replace the chapters array:

```javascript
export const chapters = [
  {
    id: 1,
    title: 'Logging In',
    description: 'You\'ve SSH\'d into the Megafirm quantum lab server. Figure out where you are and who else is here.',
    commands: ['ls', 'cd', 'pwd', 'cat'],
  },
  {
    id: 2,
    title: 'Reading the Lab',
    description: 'The lab is full of memos, notes, and warnings. Read everything you can get your hands on.',
    commands: ['cat', 'echo', '>', '>>'],
  },
  {
    id: 3,
    title: 'Inside the Lab',
    description: 'Time to get your hands dirty. Copy keys, run experiments, and cover your tracks.',
    commands: ['mkdir', 'cp', 'mv', 'rm', 'chmod', 'ssh'],
  },
  {
    id: 4,
    title: 'The Data Pipeline',
    description: 'The sensor data tells a story. Use pipelines to extract the truth from the noise.',
    commands: ['|', 'wc', 'sort', 'grep', 'head', 'tail'],
  },
];
```

**Step 2: Commit**

```bash
git add js/gameplay/chapters.js
git commit -m "feat: update chapter metadata for quantum lab theme"
```

---

### Task 7: Rewrite levels.js — BASE_FILESYSTEM and Chapter 1 (Levels 1-3)

**Files:**
- Modify: `js/gameplay/levels.js:1-194`

**Step 1: Write the new BASE_FILESYSTEM and Chapter 1 levels**

Replace the entire `BASE_FILESYSTEM`, `PROTECTED_FILES`, and levels 1-3. The new base filesystem:

```javascript
const BASE_FILESYSTEM = {
  home: {
    eve: {
      '.bash_history': 'ssh eve@megafirm-qlab\nls\npwd',
      'welcome.txt': 'Welcome to the Megafirm Quantum Research Lab server.\nAll activity is monitored and logged.\nPlease report any anomalies to the lab manager.\n\nOther users on this system: alice, bob, mallory',
      'todo.txt': '1. Review access logs for anomalies\n2. Check qubit calibration status\n3. Investigate reported equipment tampering',
    },
    alice: {
      notes: {
        'lab_memo.txt': 'REMINDER: Whoever keeps kicking the laser table — STOP.\nWe lost 3 hours of alignment yesterday.\nThe next person caught doing this will be assigned to clean the cryostat.\n\n— Alice',
        'safety_notice.txt': 'OFFICIAL NOTICE: NO WHISTLING IN THE LAB\n\nThe qubits are experiencing anomalous decoherence.\nAfter extensive debugging, we traced the issue to\nacoustic vibrations in the 1-2 kHz range.\n\nIn other words: someone is whistling and it\'s\ndestroying our quantum states.\n\nThis is not a joke. Stop whistling.\n\n— Management',
      },
      research: {
        'measure.sh': '#!/bin/bash\n# Quantum Measurement Script v2.3\n# WARNING: Running this script will collapse all qubit superpositions\n\necho "Initializing measurement apparatus..."\necho "Calibrating detectors..."\necho "Collapsing wavefunctions..."\necho ""\necho "Results:"\necho "  alice.qubit: SPIN_UP"\necho "  bob.qubit:   SPIN_DOWN"\necho ""\necho "Entanglement verified. Bell inequality violated."\necho "Spooky action at a distance confirmed."',
        'alice.qubit': 'SUPERPOSITION',
        'bob.qubit': 'SUPERPOSITION',
        'README.txt': 'Quantum Measurement Procedure\n==============================\n1. Ensure qubit files (alice.qubit, bob.qubit) are readable and writable\n   Use: chmod +rw alice.qubit bob.qubit\n2. Make the measurement script executable\n   Use: chmod +x measure.sh\n3. Run the measurement\n   Use: ./measure.sh\n\nWARNING: Measurement collapses superposition. This cannot be undone.\nSchrödinger sends his regards.',
      },
      '.ssh': {
        'id_rsa': '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA7q2ZfJfv4Hk0rFOBBNxE\nTOTALLY_REAL_PRIVATE_KEY_TRUST_ME\nAlice really needs to fix her permissions...\n-----END RSA PRIVATE KEY-----',
        'id_rsa.pub': 'ssh-rsa AAAAB3NzaC1yc2EAAAA... alice@megafirm-qlab',
        'authorized_keys': 'ssh-rsa AAAAB3NzaC1yc2EAAAA... alice@megafirm-qlab',
      },
    },
    bob: {
      notes: {
        'meeting_notes.txt': 'Qubit Error Rate Meeting — Minutes\n===================================\nAttendees: Alice, Bob, Mallory, Lab Manager\n\nAlice suspects environmental interference.\nVibration analysis shows anomalies during off-hours.\n\nI think it\'s something else. The error patterns\nare too regular to be random noise. Someone is\ndeliberately introducing interference.\n\nMallory suggested we "just restart the system."\nSuspiciously unhelpful.\n\n— Bob',
        'calibration_log.txt': 'Qubit calibration results:\nMonday:    99.2% fidelity\nTuesday:   98.7% fidelity\nWednesday: 91.3% fidelity  ← anomaly\nThursday:  99.1% fidelity\nFriday:    88.4% fidelity  ← anomaly\n\nNote: Anomalies correlate with Mallory\'s maintenance windows.',
      },
    },
    mallory: {
      'maintenance_schedule.txt': 'Weekly Maintenance Schedule\nMonday: Cooling system check\nWednesday: "Calibration adjustments"\nFriday: "Environmental controls"\n\nNote to self: make sure to clear logs after each session',
      '.plans': {
        'sabotage_notes.txt': 'Phase 1: Introduce subtle interference during maintenance windows\nPhase 2: Gradually increase speed parameter toward c\nPhase 3: When the timestamps go negative, blame it on "quantum effects"\nPhase 4: ???\nPhase 5: Profit\n\nRemember: if anyone asks, the decoherence is from "acoustic vibrations"',
        'speed_hack.sh': '#!/bin/bash\n# Speed parameter injection script\n# Target: 2.99E8 m/s (just under speed of light)\n# Side effects: time dilation in log timestamps\n# "It\'s not a bug, it\'s a feature" — Mallory',
      },
    },
  },
  var: {
    data: {
      'sensor_readings.csv': 'timestamp,temperature_K,power_W,efficiency_pct,speed_ms,qubit_error_rate\n2024-01-15T08:00:00,0.015,250,99.2,1.50E2,0.008\n2024-01-15T09:00:00,0.015,251,99.1,1.52E2,0.009\n2024-01-15T10:00:00,0.016,249,98.7,1.48E2,0.012\n2024-01-15T11:00:00,0.018,255,91.3,2.99E8,0.145\n2024-01-15T12:00:00,0.015,250,99.0,1.51E2,0.010\n2024-01-15T13:00:00,0.015,248,98.9,1.49E2,0.011\n2024-01-15T14:00:00,0.019,260,88.4,2.99E8,0.203\n2024-01-15T15:00:00,0.015,250,99.1,1.50E2,0.009\n2024-01-16T08:00:00,0.015,249,99.0,1.51E2,0.010\n2024-01-16T09:00:00,0.016,252,98.5,1.53E2,0.013\n2024-01-16T10:00:00,0.021,270,85.1,2.99E8,0.287\n2024-01-16T11:00:00,0.015,250,99.2,1.50E2,0.008\n2024-01-16T12:00:00,0.015,251,99.0,1.52E2,0.010\n2024-01-16T13:00:00,0.022,275,82.3,2.99E8,0.312\n2024-01-16T14:00:00,0.015,249,98.8,1.49E2,0.011\n2024-01-16T15:00:00,0.015,250,99.1,1.50E2,0.009',
    },
    log: {
      'access.log': 'Jan 15 07:55:01 megafirm-qlab: alice logged in\nJan 15 08:02:33 megafirm-qlab: bob logged in\nJan 15 10:45:12 megafirm-qlab: mallory logged in\nJan 15 10:47:00 megafirm-qlab: mallory accessed /var/data/sensor_readings.csv\nJan 15 10:52:18 megafirm-qlab: mallory modified speed parameter\nJan 15 10:55:00 megafirm-qlab: mallory cleared system logs\nJan 15 11:00:01 megafirm-qlab: ANOMALY speed=2.99E8\nJan 15 14:30:00 megafirm-qlab: mallory logged in\nJan 15 14:32:15 megafirm-qlab: mallory accessed /var/data/sensor_readings.csv\nJan 15 14:35:00 megafirm-qlab: mallory modified speed parameter\nJan 15 14:40:01 megafirm-qlab: ANOMALY speed=2.99E8\n-00:00:01 megafirm-qlab: TEMPORAL ERROR negative timestamp detected\n-00:00:03 megafirm-qlab: TEMPORAL ERROR causality violation\nJan 15 17:00:00 megafirm-qlab: alice logged out\nJan 15 17:15:00 megafirm-qlab: bob logged out\nJan 16 08:00:01 megafirm-qlab: alice logged in\nJan 16 09:45:00 megafirm-qlab: mallory logged in\nJan 16 09:48:22 megafirm-qlab: mallory modified speed parameter\nJan 16 10:00:01 megafirm-qlab: ANOMALY speed=2.99E8\n-00:00:02 megafirm-qlab: TEMPORAL ERROR timeline desynchronized\nJan 16 13:15:00 megafirm-qlab: mallory logged in\nJan 16 13:18:44 megafirm-qlab: mallory modified speed parameter\nJan 16 13:20:01 megafirm-qlab: ANOMALY speed=2.99E8\n-00:00:05 megafirm-qlab: TEMPORAL ERROR the universe is not amused',
    },
  },
};

const PROTECTED_FILES = [
  '/home/eve/welcome.txt',
  '/home/alice/.ssh/id_rsa',
  '/home/alice/research/alice.qubit',
  '/home/alice/research/bob.qubit',
  '/var/data/sensor_readings.csv',
  '/var/log/access.log',
];
```

Chapter 1 levels:

```javascript
// Level 1 — First Contact
{
  id: 1,
  chapter: 1,
  title: 'First Contact',
  story: `You're in. The SSH connection to Megafirm's quantum lab server is live.

You're logged in as Eve — a security auditor brought in to investigate
reports of equipment tampering. Something is wrong with their quantum computer.

First things first: figure out where you are.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/eve',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
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
      objective: "There's a file called `welcome.txt`. Use `cat` to read it.",
      hints: [
        'cat displays the contents of a file',
        'Syntax: cat [filename]',
      ],
      winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('welcome.txt'),
    },
  ],
},

// Level 2 — Nosy Neighbor
{
  id: 2,
  chapter: 1,
  title: 'Nosy Neighbor',
  story: `The welcome message mentioned other users: alice, bob, mallory.

Your home directory is /home/eve. The other users should have directories
in /home too. Time to see who else is on this server.

Use cd to change directories. cd .. goes up one level.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/eve',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Navigate up to `/home` using `cd ..`.',
      hints: [
        'cd stands for "change directory"',
        '.. means "parent directory"',
        'Type: cd ..',
      ],
      winCondition: (cmd, output, fs) => fs.cwd === '/home',
    },
    {
      objective: 'Use `ls` to see what other users have home directories.',
      hints: [
        'You know this one!',
        'Type: ls',
      ],
      winCondition: (cmd, output, fs) => cmd.trim().startsWith('ls') && fs.cwd === '/home',
    },
    {
      objective: "Interesting... Let's check out Alice's directory. Use `cd alice`.",
      hints: [
        'cd changes to a directory',
        'Type: cd alice',
      ],
      winCondition: (cmd, output, fs) => fs.cwd === '/home/alice',
    },
  ],
},

// Level 3 — The Lab Layout
{
  id: 3,
  chapter: 1,
  title: 'The Lab Layout',
  story: `You're in Alice's home directory. She's the lead quantum researcher.

Her directory has some interesting subdirectories. But be careful —
some areas might be restricted.

You can also use cd with full paths, like cd /home/eve, to jump
directly to a location.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/alice',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Use `ls` to see what\'s in Alice\'s directory.',
      hints: [
        'ls lists files and folders',
        'Type: ls',
      ],
      winCondition: (cmd, output, fs) => cmd.trim().startsWith('ls') && fs.cwd === '/home/alice',
    },
    {
      objective: 'Navigate back to your home directory at `/home/eve`.',
      hints: [
        'You can use cd with .. to go up, or use a full path',
        'Type: cd /home/eve or cd ../eve',
      ],
      winCondition: (cmd, output, fs) => fs.cwd === '/home/eve',
    },
    {
      objective: 'Read your `todo.txt` to see what you need to investigate.',
      hints: [
        'cat displays the contents of a file',
        'Try: cat todo.txt',
      ],
      winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('todo.txt') && output.includes('anomalies'),
    },
  ],
},
```

**Step 2: Run all tests to check nothing is broken structurally**

Run: `npx jest tests/levels.test.js --verbose`
Expected: Level structure tests PASS, but level-specific win condition tests FAIL (expected — we'll update those in Task 11)

**Step 3: Commit**

```bash
git add js/gameplay/levels.js
git commit -m "feat: rewrite BASE_FILESYSTEM and Chapter 1 for quantum lab theme"
```

---

### Task 8: Rewrite levels.js — Chapter 2 (Levels 4-6)

**Files:**
- Modify: `js/gameplay/levels.js` (levels 4-6)

**Step 1: Write Chapter 2 levels**

```javascript
// Level 4 — Lab Memos
{
  id: 4,
  chapter: 2,
  title: 'Lab Memos',
  story: `Time to dig into the lab communications. Alice and Bob have notes
in their home directories that might reveal what's going on.

You can cat files in other directories by using the full path:
cat /home/alice/notes/filename.txt`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/eve',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Read Alice\'s lab memo about the laser table.',
      hints: [
        'cat can read files in other directories using the full path',
        'Syntax: cat /path/to/file',
        'Try: cat /home/alice/notes/lab_memo.txt',
      ],
      winCondition: (cmd, output, fs) => output.includes('kicking the laser table'),
    },
    {
      objective: 'Read Bob\'s meeting notes — he seems suspicious about something.',
      hints: [
        'Bob\'s notes are in /home/bob/notes/',
        'Try: cat /home/bob/notes/meeting_notes.txt',
      ],
      winCondition: (cmd, output, fs) => output.includes('deliberately introducing interference'),
    },
    {
      objective: 'Read both of Alice\'s notes in a single command. cat can take multiple files.',
      hints: [
        'cat can display multiple files: cat file1 file2',
        'Try: cat /home/alice/notes/lab_memo.txt /home/alice/notes/safety_notice.txt',
      ],
      winCondition: (cmd, output, fs) => {
        return cmd.includes('lab_memo.txt') && cmd.includes('safety_notice.txt');
      },
    },
  ],
},

// Level 5 — Rewriting History
{
  id: 5,
  chapter: 2,
  title: 'Rewriting History',
  story: `There's a tasks.txt file in your home directory — assigned by the lab manager.

In Linux, you can redirect output into a file using >.
echo "text" > file.txt creates (or overwrites) a file.

Let's see what thankless tasks you've been assigned...`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {
    home: {
      eve: {
        'tasks.txt': '1. Fix the laser table alignment (AGAIN)\n2. Recalibrate qubit sensors\n3. Update lab safety documentation\n4. Clean the cryostat\n5. Apologize to the laser table',
      },
    },
  }),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/eve',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Read your assigned tasks with `cat tasks.txt`.',
      hints: [
        'cat displays file contents',
        'Try: cat tasks.txt',
      ],
      winCondition: (cmd, output, fs) => output.includes('Fix the laser table'),
    },
    {
      objective: 'Use echo and > to overwrite tasks.txt. Delegate the laser table to Alice.',
      hints: [
        'echo outputs text, > redirects it to a file',
        'Syntax: echo "text" > filename',
        'Try: echo "Tell Alice to fix laser table" > tasks.txt',
      ],
      winCondition: (cmd, output, fs) => {
        const content = fs.readFile('tasks.txt');
        return cmd.includes('>') && !cmd.includes('>>') && content !== null && !content.includes('Fix the laser table alignment');
      },
    },
    {
      objective: 'Read tasks.txt again to see that > completely overwrites the file.',
      hints: [
        'cat displays file contents',
        'Notice: all the original tasks are gone!',
        'Try: cat tasks.txt',
      ],
      winCondition: (cmd, output, fs) => {
        return cmd.includes('cat') && cmd.includes('tasks.txt') && output.length > 0;
      },
    },
  ],
},

// Level 6 — Employee of the Month
{
  id: 6,
  chapter: 2,
  title: 'Employee of the Month',
  story: `You overwrote the whole file — > replaces everything.

There's another redirect operator: >>
It appends to a file instead of overwriting.

echo "new line" >> file.txt adds to the end of file.txt.

Time to add one more item to your revised task list...`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {
    home: {
      eve: {
        'tasks.txt': 'Tell Alice to fix laser table',
      },
    },
  }),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/eve',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Read your current tasks.txt.',
      hints: [
        'cat displays file contents',
        'Try: cat tasks.txt',
      ],
      winCondition: (cmd, output, fs) => output.includes('Alice') && output.includes('laser'),
    },
    {
      objective: 'Use >> to append a new line: recommend yourself for employee of the month.',
      hints: [
        '>> appends to a file without erasing it',
        'Syntax: echo "text" >> filename',
        'Try: echo "Recommend Eve for employee of the month" >> tasks.txt',
      ],
      winCondition: (cmd, output, fs) => {
        const content = fs.readFile('tasks.txt');
        return cmd.includes('>>') && cmd.includes('tasks.txt') && content && content.includes('Alice');
      },
    },
    {
      objective: 'Read tasks.txt again to admire your handiwork.',
      hints: [
        'cat displays file contents',
        'You should see both lines now',
        'Try: cat tasks.txt',
      ],
      winCondition: (cmd, output, fs) => {
        return cmd.trim().startsWith('cat') && cmd.includes('tasks.txt');
      },
    },
  ],
},
```

**Step 2: Run structure tests**

Run: `npx jest tests/levels.test.js --testNamePattern="required properties|sequential" --verbose`
Expected: PASS

**Step 3: Commit**

```bash
git add js/gameplay/levels.js
git commit -m "feat: rewrite Chapter 2 levels for quantum lab theme"
```

---

### Task 9: Rewrite levels.js — Chapter 3 (Levels 7-9)

**Files:**
- Modify: `js/gameplay/levels.js` (levels 7-9)

**Step 1: Write Chapter 3 levels**

```javascript
// Level 7 — Copying the Keys
{
  id: 7,
  chapter: 3,
  title: 'Copying the Keys',
  story: `You noticed Alice has a .ssh directory with her private keys.

Normally, you'd NEVER be able to just copy someone's SSH keys like this.
Alice really needs to fix her file permissions. But hey, you're a
security auditor — finding these vulnerabilities is literally your job.

mkdir creates directories. cp copies files. cp -r copies directories.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/eve',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Create a directory called `evidence` to store your findings.',
      hints: [
        'mkdir creates a new directory',
        'Syntax: mkdir dirname',
        'Try: mkdir evidence',
      ],
      winCondition: (cmd, output, fs) => fs.listDir('evidence') !== null,
    },
    {
      objective: "Copy Alice's .ssh directory to your home. Use `cp -r` for directories.",
      hints: [
        'cp -r copies directories recursively',
        'Syntax: cp -r source destination',
        'Try: cp -r /home/alice/.ssh /home/eve/.ssh',
      ],
      winCondition: (cmd, output, fs) => fs.readFile('/home/eve/.ssh/id_rsa') !== null,
    },
    {
      objective: "Now use Alice's stolen keys to SSH in as her: `ssh alice@megafirm-qlab`",
      hints: [
        'ssh connects to a server as a different user',
        'Type: ssh alice@megafirm-qlab',
      ],
      winCondition: (cmd, output, fs) => cmd.includes('ssh') && cmd.includes('alice'),
    },
  ],
},

// Level 8 — Quantum Measurement
{
  id: 8,
  chapter: 3,
  title: 'Quantum Measurement',
  story: `You're logged in as Alice now. Her research directory is accessible.

Inside is a quantum measurement script (measure.sh) and two qubit files.
The qubits are in superposition — both SPIN_UP and SPIN_DOWN simultaneously.

To run the measurement, the qubit files need to be readable/writable
and the script needs to be executable. Read the README for instructions.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/alice/research',
  restrictedDirs: {
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Read the README.txt for measurement instructions.',
      hints: [
        'cat displays file contents',
        'Try: cat README.txt',
      ],
      winCondition: (cmd, output, fs) => output.includes('chmod'),
    },
    {
      objective: 'Set up permissions: make qubit files readable/writable (+rw) and measure.sh executable (+x).',
      hints: [
        'chmod changes permissions. +rw = read+write, +x = executable',
        'You can chmod multiple files: chmod +rw file1 file2',
        'Try: chmod +rw alice.qubit bob.qubit then chmod +x measure.sh',
      ],
      winCondition: (cmd, output, fs) => {
        return fs.getPermissions('alice.qubit').has('r') &&
               fs.getPermissions('alice.qubit').has('w') &&
               fs.getPermissions('bob.qubit').has('r') &&
               fs.getPermissions('bob.qubit').has('w') &&
               fs.getPermissions('measure.sh').has('x');
      },
    },
    {
      objective: 'Run ./measure.sh to collapse the quantum superposition!',
      hints: [
        './ runs a script in the current directory',
        'Try: ./measure.sh',
      ],
      winCondition: (cmd, output, fs) => output.includes('Entanglement verified'),
    },
  ],
},

// Level 9 — Covering Tracks
{
  id: 9,
  chapter: 3,
  title: 'Covering Tracks',
  story: `The quantum measurement worked. The qubits collapsed exactly as predicted —
alice.qubit is SPIN_UP, bob.qubit is SPIN_DOWN. Entanglement confirmed.

But you've been leaving traces everywhere. Before Mallory notices someone's
been poking around, you need to move evidence to safety and clean up.

mv moves files (or renames them). rm removes files permanently.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {
    home: {
      alice: {
        'temp_results.txt': 'Measurement results: entanglement verified\nBell inequality: violated (S = 2.73 > 2)\nQuantum state fidelity: 99.7%\nTimestamp: 2024-01-16T14:30:00',
        old_logs: {
          'debug_jan14.log': 'DEBUG: qubit initialization sequence started\nDEBUG: cooling system nominal\nDEBUG: measurement apparatus calibrated',
          'debug_jan15.log': 'DEBUG: anomalous speed reading detected\nDEBUG: timestamp synchronization error\nDEBUG: this is fine. everything is fine.',
        },
      },
      eve: {
        evidence: {},
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
      objective: 'Move the measurement results to Eve\'s evidence folder.',
      hints: [
        'mv moves files from one location to another',
        'Syntax: mv source destination',
        'Try: mv temp_results.txt /home/eve/evidence/',
      ],
      winCondition: (cmd, output, fs) => {
        return fs.readFile('/home/eve/evidence/temp_results.txt') !== null && fs.readFile('temp_results.txt') === null;
      },
    },
    {
      objective: 'Delete the old debug logs — they show you were here.',
      hints: [
        'rm -r removes directories and everything inside',
        'Try: rm -r old_logs',
      ],
      winCondition: (cmd, output, fs) => fs.listDir('old_logs') === null,
    },
    {
      objective: 'Navigate to Mallory\'s home directory to investigate.',
      hints: [
        'Use cd with a full path',
        'Try: cd /home/mallory',
      ],
      winCondition: (cmd, output, fs) => fs.cwd === '/home/mallory',
    },
  ],
},
```

Note: Level 8 starts at `/home/alice/research` and does NOT have `'/home/alice/research': 'alice'` in its `restrictedDirs` because by this point the player has already SSH'd in as Alice. The game loop should remember `currentUser` across level transitions.

**Step 2: Verify currentUser persists across levels**

Check that `loadLevel` in game-loop.js sets `fs.currentUser = currentUser` (already done in Task 2). The `currentUser` variable is NOT reset between levels, so it persists. Good.

**Step 3: Run structure tests**

Run: `npx jest tests/levels.test.js --testNamePattern="required properties|sequential" --verbose`
Expected: PASS

**Step 4: Commit**

```bash
git add js/gameplay/levels.js
git commit -m "feat: rewrite Chapter 3 levels — SSH keys, quantum measurement, cleanup"
```

---

### Task 10: Rewrite levels.js — Chapter 4 (Levels 10-12)

**Files:**
- Modify: `js/gameplay/levels.js` (levels 10-12)

**Step 1: Write Chapter 4 levels**

```javascript
// Level 10 — Counting the Damage
{
  id: 10,
  chapter: 4,
  title: 'Counting the Damage',
  story: `You're in Mallory's home directory. Suspicious maintenance schedule...

But the real evidence is in the server's data logs. The sensor readings
in /var/data/ and access logs in /var/log/ should tell the whole story.

Pipes let you chain commands together with |. The output of one command
becomes the input of the next.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
  protectedFiles: PROTECTED_FILES,
  startDir: '/var/data',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Count how many readings are in the sensor data: `cat sensor_readings.csv | wc`',
      hints: [
        'The pipe character | sends output from one command to another',
        'wc counts lines, words, and characters',
        'Type: cat sensor_readings.csv | wc',
      ],
      winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('sensor_readings.csv') && cmd.includes('|') && cmd.includes('wc'),
    },
    {
      objective: 'Sort the sensor readings to see them in order: `cat sensor_readings.csv | sort`',
      hints: [
        'sort arranges lines in order',
        'Pipe the cat output into sort',
        'Type: cat sensor_readings.csv | sort',
      ],
      winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('sensor_readings.csv') && cmd.includes('|') && cmd.includes('sort'),
    },
    {
      objective: 'Search the access log for Mallory\'s entries: `cat /var/log/access.log | grep mallory`',
      hints: [
        'grep searches for patterns in text',
        'Syntax: cat file | grep pattern',
        'Type: cat /var/log/access.log | grep mallory',
      ],
      winCondition: (cmd, output, fs) => {
        return cmd.includes('grep') && cmd.includes('mallory') && output.includes('mallory');
      },
    },
  ],
},

// Level 11 — Narrowing the Search
{
  id: 11,
  chapter: 4,
  title: 'Narrowing the Search',
  story: `The data is revealing patterns. Mallory's been accessing the lab at odd hours.

And those speed readings — 2.99E8 m/s? That's the speed of light!
No wonder the timestamps went negative. When you approach c, time dilation
kicks in. Einstein would not be amused.

Chain multiple pipes to narrow down the evidence.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
  protectedFiles: PROTECTED_FILES,
  startDir: '/var/data',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Count how many readings hit near light-speed: `cat sensor_readings.csv | grep "2.99E" | wc`',
      hints: [
        'Chain: cat → grep → wc',
        'grep filters for lines containing a pattern',
        'Type: cat sensor_readings.csv | grep "2.99E" | wc',
      ],
      winCondition: (cmd, output, fs) => {
        return cmd.includes('grep') && cmd.includes('2.99E') && cmd.includes('wc') && cmd.match(/\|/g)?.length >= 2;
      },
    },
    {
      objective: 'Find the earliest access log entries (negative timestamps!): `cat /var/log/access.log | sort | head -n 5`',
      hints: [
        'sort orders lines, head -n 5 shows the first 5',
        'The negative timestamps should sort to the top',
        'Type: cat /var/log/access.log | sort | head -n 5',
      ],
      winCondition: (cmd, output, fs) => {
        return cmd.includes('sort') && cmd.includes('head') && output.includes('TEMPORAL ERROR');
      },
    },
    {
      objective: 'Find the worst speed anomalies: `cat sensor_readings.csv | grep "2.99E" | sort -n | tail -n 3`',
      hints: [
        'sort -n sorts numerically, tail -n 3 shows last 3 lines',
        'Type: cat sensor_readings.csv | grep "2.99E" | sort -n | tail -n 3',
      ],
      winCondition: (cmd, output, fs) => {
        return cmd.includes('sort') && cmd.includes('tail') && output.includes('2.99E');
      },
    },
  ],
},

// Level 12 — The Evidence Dossier
{
  id: 12,
  chapter: 4,
  title: 'The Evidence Dossier',
  story: `Time to compile the evidence. Pipes and redirects work together — you can
process data with pipelines, then save the results to files.

Build your final dossier. The quantum computer — and the integrity
of spacetime itself — depends on it.`,
  filesystem: mergeFilesystem(BASE_FILESYSTEM, {
    home: {
      eve: {
        evidence: {},
      },
    },
  }),
  protectedFiles: PROTECTED_FILES,
  startDir: '/home/eve',
  restrictedDirs: {
    '/home/alice/research': 'alice',
    '/home/mallory/.plans': 'mallory',
  },
  subSteps: [
    {
      objective: 'Extract Mallory\'s access records into evidence: `cat /var/log/access.log | grep mallory > evidence/access_proof.txt`',
      hints: [
        'grep filters lines, > redirects to a file',
        'Type: cat /var/log/access.log | grep mallory > evidence/access_proof.txt',
      ],
      winCondition: (cmd, output, fs) => {
        return cmd.includes('grep') && cmd.includes('mallory') && cmd.includes('>') && fs.readFile('evidence/access_proof.txt')?.includes('mallory');
      },
    },
    {
      objective: 'Extract the speed anomalies: `cat /var/data/sensor_readings.csv | grep "2.99E" > evidence/speed_anomalies.txt`',
      hints: [
        'Same idea — grep for the anomalous speed, redirect to file',
        'Type: cat /var/data/sensor_readings.csv | grep "2.99E" > evidence/speed_anomalies.txt',
      ],
      winCondition: (cmd, output, fs) => {
        const content = fs.readFile('evidence/speed_anomalies.txt');
        return cmd.includes('grep') && cmd.includes('2.99E') && cmd.includes('>') && content && content.includes('2.99E');
      },
    },
    {
      objective: 'Compile the final dossier: combine and sort all evidence into evidence/final_dossier.txt',
      hints: [
        'cat can combine multiple files, sort orders them',
        'Use >> to append to the dossier',
        'Type: cat evidence/access_proof.txt evidence/speed_anomalies.txt | sort >> evidence/final_dossier.txt',
      ],
      winCondition: (cmd, output, fs) => {
        const dossier = fs.readFile('evidence/final_dossier.txt');
        return cmd.includes('sort') && cmd.includes('>>') && cmd.includes('dossier.txt') && dossier && dossier.length > 0;
      },
    },
  ],
},
```

**Step 2: Run structure tests**

Run: `npx jest tests/levels.test.js --testNamePattern="required properties|sequential|at least" --verbose`
Expected: PASS

**Step 3: Commit**

```bash
git add js/gameplay/levels.js
git commit -m "feat: rewrite Chapter 4 levels — data pipelines and evidence dossier"
```

---

### Task 11: Update levels.test.js for new content

**Files:**
- Modify: `tests/levels.test.js:52-200`

**Step 1: Rewrite all level-specific win condition tests**

Replace the level-specific tests (from line 52 onward) with tests for the new levels:

```javascript
  test('level 1 win conditions fire correctly', () => {
    const level = levels[0];
    const mockFs = { cwd: '/home/eve' };

    expect(level.subSteps[0].winCondition('pwd', '/home/eve', mockFs)).toBe(true);
    expect(level.subSteps[0].winCondition('ls', '', mockFs)).toBe(false);

    expect(level.subSteps[1].winCondition('ls', 'welcome.txt  todo.txt', mockFs)).toBe(true);
    expect(level.subSteps[1].winCondition('pwd', '', mockFs)).toBe(false);

    expect(level.subSteps[2].winCondition('cat welcome.txt', 'Welcome...', mockFs)).toBe(true);
    expect(level.subSteps[2].winCondition('cat todo.txt', 'stuff', mockFs)).toBe(false);
  });

  test('level 2 win conditions check cwd', () => {
    const level = levels[1];

    expect(level.subSteps[0].winCondition('cd ..', '', { cwd: '/home' })).toBe(true);
    expect(level.subSteps[0].winCondition('cd ..', '', { cwd: '/home/eve' })).toBe(false);

    expect(level.subSteps[1].winCondition('ls', 'alice bob eve mallory', { cwd: '/home' })).toBe(true);
    expect(level.subSteps[1].winCondition('ls', 'alice bob', { cwd: '/home/eve' })).toBe(false);

    expect(level.subSteps[2].winCondition('cd alice', '', { cwd: '/home/alice' })).toBe(true);
    expect(level.subSteps[2].winCondition('cd bob', '', { cwd: '/home/bob' })).toBe(false);
  });

  test('level 3 win conditions check navigation and reading', () => {
    const level = levels[2];

    expect(level.subSteps[0].winCondition('ls', 'notes research .ssh', { cwd: '/home/alice' })).toBe(true);
    expect(level.subSteps[0].winCondition('ls', 'stuff', { cwd: '/home/eve' })).toBe(false);

    expect(level.subSteps[1].winCondition('cd /home/eve', '', { cwd: '/home/eve' })).toBe(true);
    expect(level.subSteps[1].winCondition('cd ..', '', { cwd: '/home' })).toBe(false);

    expect(level.subSteps[2].winCondition('cat todo.txt', '1. Review access logs for anomalies', {})).toBe(true);
    expect(level.subSteps[2].winCondition('cat todo.txt', 'nothing', {})).toBe(false);
  });

  test('level 4 win conditions check reading lab memos', () => {
    const level = levels[3];

    expect(level.subSteps[0].winCondition('cat /home/alice/notes/lab_memo.txt', 'Whoever keeps kicking the laser table', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat something', 'nothing relevant', {})).toBe(false);

    expect(level.subSteps[1].winCondition('cat /home/bob/notes/meeting_notes.txt', 'deliberately introducing interference', {})).toBe(true);
    expect(level.subSteps[1].winCondition('cat something', 'nothing', {})).toBe(false);

    expect(level.subSteps[2].winCondition('cat /home/alice/notes/lab_memo.txt /home/alice/notes/safety_notice.txt', 'combined', {})).toBe(true);
    expect(level.subSteps[2].winCondition('cat /home/alice/notes/lab_memo.txt', 'only one', {})).toBe(false);
  });

  test('level 5 win conditions check echo > overwrite', () => {
    const level = levels[4];

    expect(level.subSteps[0].winCondition('cat tasks.txt', '1. Fix the laser table alignment (AGAIN)', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat tasks.txt', 'nothing', {})).toBe(false);

    const overwritten = { readFile: () => 'Tell Alice to fix laser table' };
    const original = { readFile: () => '1. Fix the laser table alignment (AGAIN)\n2. Recalibrate' };
    expect(level.subSteps[1].winCondition('echo "Tell Alice" > tasks.txt', '', overwritten)).toBe(true);
    expect(level.subSteps[1].winCondition('echo "Tell Alice" > tasks.txt', '', original)).toBe(false);
    expect(level.subSteps[1].winCondition('echo "Tell Alice" >> tasks.txt', '', overwritten)).toBe(false);

    expect(level.subSteps[2].winCondition('cat tasks.txt', 'Tell Alice to fix laser table', {})).toBe(true);
    expect(level.subSteps[2].winCondition('ls', '', {})).toBe(false);
    expect(level.subSteps[2].winCondition('cat tasks.txt', '', {})).toBe(false);
  });

  test('level 6 win conditions check echo >> append', () => {
    const level = levels[5];

    expect(level.subSteps[0].winCondition('cat tasks.txt', 'Tell Alice to fix laser table', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat tasks.txt', 'nothing', {})).toBe(false);

    const appended = { readFile: () => 'Tell Alice to fix laser table\nRecommend Eve' };
    const overwritten = { readFile: () => 'Recommend Eve' };
    expect(level.subSteps[1].winCondition('echo "Recommend Eve" >> tasks.txt', '', appended)).toBe(true);
    expect(level.subSteps[1].winCondition('echo "x" > tasks.txt', '', appended)).toBe(false);
    expect(level.subSteps[1].winCondition('echo "x" >> tasks.txt', '', overwritten)).toBe(false);

    expect(level.subSteps[2].winCondition('cat tasks.txt', 'stuff', {})).toBe(true);
    expect(level.subSteps[2].winCondition('ls', '', {})).toBe(false);
  });

  test('level 7 win conditions check mkdir, cp, and ssh', () => {
    const level = levels[6];

    expect(level.subSteps[0].winCondition('mkdir evidence', '', { listDir: (p) => p === 'evidence' ? [] : null })).toBe(true);
    expect(level.subSteps[0].winCondition('mkdir evidence', '', { listDir: () => null })).toBe(false);

    expect(level.subSteps[1].winCondition('cp -r /home/alice/.ssh /home/eve/.ssh', '', { readFile: (p) => p === '/home/eve/.ssh/id_rsa' ? 'key' : null })).toBe(true);
    expect(level.subSteps[1].winCondition('cp -r /home/alice/.ssh /home/eve/.ssh', '', { readFile: () => null })).toBe(false);

    expect(level.subSteps[2].winCondition('ssh alice@megafirm-qlab', '', {})).toBe(true);
    expect(level.subSteps[2].winCondition('ls', '', {})).toBe(false);
  });

  test('level 8 win conditions check chmod and script execution', () => {
    const level = levels[7];

    expect(level.subSteps[0].winCondition('cat README.txt', 'Use: chmod +rw alice.qubit bob.qubit', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat README.txt', 'nothing useful', {})).toBe(false);

    const allPerms = {
      getPermissions: (path) => {
        if (path === 'alice.qubit') return new Set(['r', 'w']);
        if (path === 'bob.qubit') return new Set(['r', 'w']);
        if (path === 'measure.sh') return new Set(['x']);
        return new Set();
      },
    };
    const missingPerms = {
      getPermissions: (path) => new Set(),
    };
    expect(level.subSteps[1].winCondition('chmod +x measure.sh', '', allPerms)).toBe(true);
    expect(level.subSteps[1].winCondition('chmod +x measure.sh', '', missingPerms)).toBe(false);

    expect(level.subSteps[2].winCondition('./measure.sh', 'Entanglement verified. Bell inequality violated.', {})).toBe(true);
    expect(level.subSteps[2].winCondition('./measure.sh', 'Permission denied', {})).toBe(false);
  });

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

**Step 2: Run tests**

Run: `npx jest tests/levels.test.js --verbose`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add tests/levels.test.js
git commit -m "test: rewrite level win condition tests for quantum lab theme"
```

---

### Task 12: Update game.test.js full playthrough test

**Files:**
- Modify: `tests/game.test.js:150-280`

**Step 1: Rewrite the full playthrough and chapter-transition tests**

The key tests to update:
- `game.runCommand` → `executes command and returns output` (uses pwd, expects `/home/eve`)
- `advances substep when win condition met` (uses pwd)
- `advances to next level when all substeps complete` (plays through level 1)
- `sets won flag when all levels complete` (plays through ALL 12 levels)
- `emits chapterComplete when crossing chapter boundary`

Update the `runCommand` output test:

```javascript
  test('executes command and returns output', () => {
    const game = createGame();
    const result = game.runCommand('pwd');
    expect(result.output).toBe('/home/eve');
  });
```

Update the `advances to next level` test:

```javascript
  test('advances to next level when all substeps complete', () => {
    const game = createGame();

    game.runCommand('pwd');
    expect(game.currentSubStep).toBe(1);

    game.runCommand('ls');
    expect(game.currentSubStep).toBe(2);

    game.runCommand('cat welcome.txt');
    expect(game.currentLevel).toBe(1);
    expect(game.currentSubStep).toBe(0);
  });
```

Update the full playthrough test — this is the big one. Every level's commands need to change:

```javascript
  test('sets won flag when all levels complete', () => {
    const game = createGame();

    // Level 1 — First Contact
    game.runCommand('pwd');
    game.runCommand('ls');
    game.runCommand('cat welcome.txt');

    // Level 2 — Nosy Neighbor
    game.runCommand('cd ..');
    game.runCommand('ls');
    game.runCommand('cd alice');

    // Level 3 — The Lab Layout
    game.runCommand('ls');
    game.runCommand('cd /home/eve');
    game.runCommand('cat todo.txt');

    // Level 4 — Lab Memos
    game.runCommand('cat /home/alice/notes/lab_memo.txt');
    game.runCommand('cat /home/bob/notes/meeting_notes.txt');
    game.runCommand('cat /home/alice/notes/lab_memo.txt /home/alice/notes/safety_notice.txt');

    // Level 5 — Rewriting History
    game.runCommand('cat tasks.txt');
    game.runCommand('echo "Tell Alice to fix laser table" > tasks.txt');
    game.runCommand('cat tasks.txt');

    // Level 6 — Employee of the Month
    game.runCommand('cat tasks.txt');
    game.runCommand('echo "Recommend Eve for employee of the month" >> tasks.txt');
    game.runCommand('cat tasks.txt');

    // Level 7 — Copying the Keys
    expect(game.currentLevel).toBe(6);
    game.runCommand('mkdir evidence');
    game.runCommand('cp -r /home/alice/.ssh /home/eve/.ssh');
    game.runCommand('ssh alice@megafirm-qlab');

    // Level 8 — Quantum Measurement
    expect(game.currentLevel).toBe(7);
    game.runCommand('cat README.txt');
    game.runCommand('chmod +rw alice.qubit bob.qubit');
    game.runCommand('chmod +x measure.sh');
    game.runCommand('./measure.sh');

    // Level 9 — Covering Tracks
    expect(game.currentLevel).toBe(8);
    game.runCommand('mv temp_results.txt /home/eve/evidence/');
    game.runCommand('rm -r old_logs');
    game.runCommand('cd /home/mallory');

    // Level 10 — Counting the Damage
    expect(game.currentLevel).toBe(9);
    game.runCommand('cat sensor_readings.csv | wc');
    game.runCommand('cat sensor_readings.csv | sort');
    game.runCommand('cat /var/log/access.log | grep mallory');

    // Level 11 — Narrowing the Search
    expect(game.currentLevel).toBe(10);
    game.runCommand('cat sensor_readings.csv | grep "2.99E" | wc');
    game.runCommand('cat /var/log/access.log | sort | head -n 5');
    game.runCommand('cat sensor_readings.csv | grep "2.99E" | sort -n | tail -n 3');

    // Level 12 — The Evidence Dossier
    expect(game.currentLevel).toBe(11);
    game.runCommand('cat /var/log/access.log | grep mallory > evidence/access_proof.txt');
    game.runCommand('cat /var/data/sensor_readings.csv | grep "2.99E" > evidence/speed_anomalies.txt');
    game.runCommand('cat evidence/access_proof.txt evidence/speed_anomalies.txt | sort >> evidence/final_dossier.txt');

    expect(game.won).toBe(true);
  });
```

Update the chapter transition test:

```javascript
  test('emits chapterComplete when crossing chapter boundary', () => {
    const game = createGame();

    // Fast-forward through Chapter 1
    game.runCommand('pwd');
    game.runCommand('ls');
    game.runCommand('cat welcome.txt');
    game.runCommand('cd ..');
    game.runCommand('ls');
    game.runCommand('cd alice');
    game.runCommand('ls');
    game.runCommand('cd /home/eve');

    // Completes Level 3 (ch1) → transitions to Level 4 (ch2)
    const result = game.runCommand('cat todo.txt');

    expect(result.chapterComplete).toBe(true);
    expect(result.completedChapter).toBe(1);
    expect(result.newLevel).toBe(true);
  });
```

Update the hint test:

```javascript
  test('returns current hint', () => {
    const game = createGame();
    const result = game.runCommand('hint');
    expect(result.output).toContain('pwd');
  });
```

Also update `executePipeline` tests that reference `/home/analyst`:

```javascript
  beforeEach(() => {
    fs = createFilesystem({
      home: {
        eve: {
          'file.txt': 'hello world',
        },
      },
    });
    fs.cwd = '/home/eve';
  });

  test('executes single command', () => {
    const result = executePipeline('pwd', fs);
    expect(result.output).toBe('/home/eve');
  });
```

And update the `getCompletions` test setup:

```javascript
  beforeEach(() => {
    fs = createFilesystem({
      home: {
        eve: {
          'welcome.txt': 'hi',
          'readme.md': 'docs',
          documents: {},
          projects: {},
        },
      },
    });
    fs.cwd = '/home/eve';
  });
```

**Step 2: Run all tests**

Run: `npx jest --verbose`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add tests/game.test.js
git commit -m "test: rewrite full playthrough and game tests for quantum lab theme"
```

---

### Task 13: Update filesystem.js default homePath

**Files:**
- Modify: `js/engine/filesystem.js:12`

**Step 1: Update default homePath**

Change line 12:

```javascript
export function createFilesystem(tree = {}, homePath = '/home/eve') {
```

**Step 2: Run all tests**

Run: `npx jest --verbose`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add js/engine/filesystem.js
git commit -m "feat: update default homePath to /home/eve"
```

---

### Task 14: Final integration test — run all tests and verify

**Step 1: Run the full test suite**

Run: `npx jest --verbose`
Expected: ALL PASS

**Step 2: Manual smoke test (optional)**

Open `index.html` in browser, play through first few levels to verify:
- Prompt shows `eve@megafirm-qlab:~$`
- Level 1 starts in `/home/eve`
- `ls` shows `welcome.txt`, `todo.txt`
- Navigation works
- Story text displays correctly

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address integration issues from final testing"
```

---

## Task Dependency Graph

```
Task 1 (user identity state)
  ↓
Task 2 (restricted dirs) ←── depends on user identity
  ↓
Task 3 (ssh command) ←── independent of Task 2, but logically follows
  ↓
Task 4 (wire ssh in game loop) ←── depends on Tasks 1, 3
  ↓
Task 5 (terminal.js updates) ←── depends on Task 1
  ↓
Task 6 (chapters.js) ←── independent
  ↓
Task 7 (levels Ch.1 + BASE_FS) ←── depends on Tasks 1-4
  ↓
Task 8 (levels Ch.2)
  ↓
Task 9 (levels Ch.3) ←── uses ssh + restricted dirs
  ↓
Task 10 (levels Ch.4)
  ↓
Task 11 (levels.test.js) ←── depends on Tasks 7-10
  ↓
Task 12 (game.test.js) ←── depends on ALL above
  ↓
Task 13 (filesystem.js homePath)
  ↓
Task 14 (final integration)
```

## Parallelization Opportunities

Tasks that can run in parallel:
- Tasks 1, 3, 5, 6 are largely independent (different files)
- Tasks 7-10 (level content) can be written in parallel if BASE_FILESYSTEM is done first
- Tasks 11-12 (tests) must come after all level content is finalized
