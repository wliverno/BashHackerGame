# Alice & Bob Storyline Revamp Design

## Overview

Complete storyline revamp of BashTreasureHunt. Replace the Umbrella Corp / analyst theme with a quantum computing lab setting built around classic cryptography character names (Alice, Bob, Eve, Mallory). The game teaches the same bash commands in the same order, but the narrative, filesystem content, and tone are entirely new.

## Setting & Characters

**Setting**: Megafirm Quantum Research Lab server (`megafirm-qlab`).

**Characters**:
- **Eve** (player) — security auditor who's SSH'd into the lab server. Classic "eavesdropper" name.
- **Alice** — lead quantum researcher, runs entanglement experiments.
- **Bob** — Alice's research partner, qubit calibration specialist.
- **Mallory** — lab technician, secretly sabotaging experiments. Classic "malicious" name.

**Tone**: Nerdy science humor with absurdist escalation. Physics puns, crypto in-jokes, and Mallory's sabotage getting increasingly unhinged (speed readings approaching light speed, negative timestamps from "time dilation").

## Prompt

`eve@megafirm-qlab:~$` — changes to `alice@megafirm-qlab:~$` after SSH key copy in Chapter 3.

## Filesystem Structure

### Home Directories (`/home/`)
- `/home/eve/` — sparse; welcome.txt, todo.txt, tasks.txt (assigned by lab manager)
- `/home/alice/` — notes/, research/ (RESTRICTED — requires being logged in as alice), .ssh/ (keys)
- `/home/bob/` — notes/, calibration/
- `/home/mallory/` — maintenance/, .plans/ (RESTRICTED — requires being mallory, never accessible)

### Shared Directories
- `/var/data/sensor_readings.csv` — quantum sensor data: timestamp, temperature_K, power_W, efficiency_pct, speed_ms, qubit_error_rate. Some readings show speed approaching 2.99E8 m/s (speed of light).
- `/var/log/access.log` — lab entry/exit records. Mallory accessing at odd hours. Some entries have negative timestamps ("time dilation" from the impossible speed readings).

### Restricted Directories
- `/home/alice/research/` — only accessible when currentUser is "alice"
- `/home/mallory/.plans/` — only accessible when currentUser is "mallory" (never happens; evidence comes from /var/ logs instead)

Attempting to `cd` into restricted dirs returns "Permission denied".

## Engine Changes

### 1. User Identity State
- `game-loop.js` tracks `currentUser` (default: `"eve"`)
- Levels can trigger user switching via a win condition side effect or a new `ssh` command
- `formatPrompt()` in `terminal.js` reads `currentUser` instead of hardcoding "analyst"

### 2. Restricted Directories
- Levels define `restrictedDirs: { "/path": "required_user" }`
- `cd` command checks this map; returns "Permission denied" if currentUser doesn't match

### 3. SSH Command
- Minimal implementation: only `ssh alice@megafirm-qlab` works
- Checks if `/home/eve/.ssh/id_rsa` exists in the virtual filesystem
- If yes: switches `currentUser` to `"alice"`, prints login banner
- If no: prints "Permission denied (publickey)."

## Chapter & Level Design

### Chapter 1: "Logging In" — Commands: pwd, ls, cd, cat

**Level 1 — First Contact**
- Start: `/home/eve`
- Story: Eve has just SSH'd into the Megafirm quantum lab server. Time to orient.
- FS: `/home/eve/welcome.txt`, `/home/eve/todo.txt`
- Substeps:
  1. `pwd` — see where you are
  2. `ls` — see what's in Eve's home
  3. `cat welcome.txt` — read the welcome message

**Level 2 — Nosy Neighbor**
- Start: `/home/eve`
- Story: The welcome message mentions other users. Navigate up to /home to see who else has accounts.
- FS: All four home dirs visible with subdirectories
- Substeps:
  1. `cd ..` — go up to /home
  2. `ls` — see alice, bob, eve, mallory directories
  3. `cd alice` — enter Alice's home (win: cwd is /home/alice)

**Level 3 — The Lab Layout**
- Start: `/home/alice`
- Story: Alice's directory has interesting subdirs. Explore, but research/ is locked. Navigate back to Eve's home.
- FS: Alice's dirs populated; research/ is restricted
- Substeps:
  1. `ls` — see Alice's directories (research/ visible but blocked)
  2. Navigate back to `/home/eve` using cd with `..` paths
  3. `cat todo.txt` — re-read Eve's task list, setting up next chapter

### Chapter 2: "Reading the Lab" — Commands: cat (with paths), echo, >, >>

**Level 4 — Lab Memos**
- Start: `/home/eve`
- Story: Time to read lab communications. Alice and Bob have notes that might reveal something.
- FS: `/home/alice/notes/lab_memo.txt` ("REMINDER: Whoever keeps kicking the laser table — STOP."), `/home/alice/notes/safety_notice.txt` ("NO WHISTLING IN THE LAB. Qubits experiencing decoherence."), `/home/bob/notes/meeting_notes.txt` ("Qubit error rates climbing. Alice suspects environment. I think it's something else...")
- Substeps:
  1. `cat /home/alice/notes/lab_memo.txt` — the hilarious memo
  2. `cat /home/bob/notes/meeting_notes.txt` — Bob's suspicions
  3. `cat /home/alice/notes/lab_memo.txt /home/alice/notes/safety_notice.txt` — multi-file cat

**Level 5 — Rewriting History**
- Start: `/home/eve`
- Story: Eve's been assigned tasks by the lab manager. There's a tasks.txt with "Fix the laser table alignment (AGAIN)". Eve has other ideas.
- FS: `tasks.txt` ("1. Fix the laser table alignment (AGAIN)\n2. Recalibrate qubit sensors\n3. Update lab safety documentation")
- Substeps:
  1. `cat tasks.txt` — read the boring tasks
  2. `echo "Tell Alice to fix laser table" > tasks.txt` — overwrite with delegation
  3. `cat tasks.txt` — admire the mischief (confirms > overwrites)

**Level 6 — Employee of the Month**
- Start: `/home/eve`
- Story: Eve realizes she can append to files without wiping them. Time to add one more line to her revised task list.
- FS: `tasks.txt` (already has "Tell Alice to fix laser table" from level context, or pre-seeded)
- Substeps:
  1. `cat tasks.txt` — see the current tasks
  2. `echo "Recommend Eve for employee of the month" >> tasks.txt` — append the kicker
  3. `cat tasks.txt` — verify both lines are there (confirms >> appends)

### Chapter 3: "Inside the Lab" — Commands: mkdir, cp, mv, rm, chmod

**Level 7 — Copying the Keys**
- Start: `/home/eve`
- Story: Alice's .ssh directory has her private keys just sitting there. In real life, you'd NEVER be able to just copy someone's SSH keys like this — Alice really needs to fix her file permissions. But for now... mkdir to organize, cp to copy.
- FS: `/home/alice/.ssh/id_rsa`, `/home/alice/.ssh/id_rsa.pub`, `/home/alice/.ssh/authorized_keys`
- Substeps:
  1. `mkdir evidence` — create evidence directory
  2. `cp -r /home/alice/.ssh /home/eve/.ssh` — copy the SSH keys
  3. `ssh alice@megafirm-qlab` — log in as Alice (prompt changes to alice@)

**Level 8 — Quantum Measurement**
- Start: `/home/alice/research` (now logged in as Alice)
- Story: As Alice, Eve can now access the restricted research directory. The quantum measurement script needs to be set up: qubit files must be readable/writable, and the script must be executable.
- FS: `measure.sh`, `alice.qubit` ("SUPERPOSITION"), `bob.qubit` ("SUPERPOSITION"), `README.txt` (instructions)
- Substeps:
  1. `cat README.txt` — learn the procedure
  2. `chmod +x measure.sh` — make script executable (also need alice.qubit and bob.qubit to be r/w — win condition checks all permissions)
  3. `./measure.sh` — run it! alice.qubit becomes "SPIN_UP", bob.qubit becomes "SPIN_DOWN" (quantum entanglement!)

Note: The win condition for substep 2 should verify both that measure.sh has +x AND that alice.qubit/bob.qubit are r/w. If they aren't r/w by default, the player needs to chmod them too. The hints should guide this.

**Level 9 — Covering Tracks**
- Start: `/home/alice` (still as Alice)
- Story: Eve found the measurement data. Before Mallory notices, move evidence and clean up. mv moves, rm removes — no undo.
- FS: `temp_results.txt`, `old_logs/` with files, `/home/eve/evidence/`
- Substeps:
  1. `mv temp_results.txt /home/eve/evidence/` — move evidence to Eve's stash
  2. `rm -r old_logs` — clean up traces
  3. Navigate to `/home/mallory` (or `/var/`) to set up investigation (win: cwd change)

### Chapter 4: "The Data Pipeline" — Commands: pipe (|), wc, sort, grep, head, tail

**Level 10 — Counting the Damage**
- Start: `/var/data` (or similar)
- Story: The lab's sensor data has anomalies. Pipes chain commands — output of one becomes input of the next.
- FS: `/var/data/sensor_readings.csv` (~20 lines with headers: timestamp,temperature_K,power_W,efficiency_pct,speed_ms,qubit_error_rate — some speed values approaching 2.99E8), `/var/log/access.log` (lab entry/exit, Mallory at odd hours, some negative timestamps)
- Substeps:
  1. `cat sensor_readings.csv | wc` — how much data?
  2. `cat sensor_readings.csv | sort` — sort the readings
  3. `cat /var/log/access.log | grep mallory` — find Mallory's entries

**Level 11 — Narrowing the Search**
- Start: `/var/data`
- Story: Speed readings approaching the speed of light? That can't be right. The access logs show Mallory in the lab at impossible times. Chain multiple pipes.
- Substeps:
  1. `cat sensor_readings.csv | grep "2.99E" | wc` — count impossible readings (2+ pipes)
  2. `cat /var/log/access.log | sort | head -n 5` — earliest entries (negative timestamps!)
  3. `cat sensor_readings.csv | grep "2.99E" | sort -n | tail -n 3` — worst offenders

**Level 12 — The Evidence Dossier** (finale)
- Start: `/home/eve`
- Story: Compile the final evidence. Pipes + redirects together build the dossier proving Mallory's sabotage. The quantum computer — and reality itself — depends on it.
- Substeps:
  1. `cat /var/log/access.log | grep mallory > evidence/access_proof.txt` — extract Mallory's records
  2. `cat /var/data/sensor_readings.csv | grep "2.99E" > evidence/speed_anomalies.txt` — extract anomalies
  3. `cat evidence/access_proof.txt evidence/speed_anomalies.txt | sort >> evidence/final_dossier.txt` — compile final dossier

## Files to Modify

1. `js/gameplay/levels.js` — Complete rewrite of all 12 levels + BASE_FILESYSTEM
2. `js/gameplay/chapters.js` — Update chapter titles and descriptions
3. `js/ui/terminal.js` — Update formatPrompt() to use dynamic user, update win screen text
4. `js/ui/game-loop.js` — Add currentUser state, user switching, restricted directory checks
5. `js/engine/commands/navigation.js` — Add restricted dir check to cd command
6. `js/engine/commands/index.js` — Add ssh command (or add to a new module)
7. `tests/levels.test.js` — Rewrite to match new level content
8. `tests/game.test.js` — Add tests for user switching and restricted dirs

## Protected Files

Each level defines protected files contextually. Key protected files:
- `/home/alice/.ssh/id_rsa` — needed for the SSH subplot
- `/home/alice/research/alice.qubit` — needed for measurement
- `/home/alice/research/bob.qubit` — needed for measurement
- `/var/data/sensor_readings.csv` — needed for pipeline chapters
- `/var/log/access.log` — needed for pipeline chapters