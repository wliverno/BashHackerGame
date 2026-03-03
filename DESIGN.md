# BashTreasureHunt — Design Document

## Concept
A browser-based, interactive bash learning game hosted on GitHub Pages. Players take on the role of an intern at a quantum research lab who stumbles into a real conspiracy — and learns bash along the way. No install required — open a URL and play.

## Inspiration
- **terminal-quest** (KanoComputing) — Python/GTK desktop app, 46 story-driven challenges teaching ls → cd → cat → echo. Great level structure (sub-steps, escalating hints, companion dialogue). Desktop-only, no pipe/redirect support, no web version.
- **GameShell, Bashcrawl, Terminus** — various terminal learning games, all requiring a local terminal or SSH. None are fully self-contained browser apps with pipe support.

## What We Do Differently
- Fully browser-based, zero install, GitHub Pages hostable
- Realistic sysadmin/intern theme (not fantasy)
- Teaches pipes (`|`) and redirects (`>`, `>>`) — a gap in existing tools
- Sub-steps within each level (like terminal-quest)
- Escalating hint system
- localStorage save/resume
- `goto N` command to jump directly to any level
- Retro terminal aesthetic

---

## Theme & Narrative

### Setting
You are Eve, a new intern at the **Megafirm Quantum Research Lab** — a cutting-edge physics facility studying quantum entanglement. You've just gotten SSH access to the lab's internal server. You're supposed to be refilling liquid nitrogen dewars and labeling cables. Instead, you start poking around.

What starts as idle snooping turns into a real investigation: someone on the lab staff is deliberately sabotaging quantum experiments by injecting impossible speed-of-light readings into the sensor data, causing the lab's timestamps to go negative.

### Characters
- **Eve** — the player. An intern with a healthy disregard for "don't touch that." Logged in, looking around.
- **Alice** — the lead quantum researcher. Brilliant. Terrible at security. Her SSH keys are just... sitting there.
- **Bob** — another researcher. More paranoid than Alice. His meeting notes hint that he suspects foul play.
- **Mallory** — the antagonist. Lab staff member using maintenance windows to tamper with sensor readings. Her maintenance schedule lines up with every anomaly.

### Tone
- Grounded and realistic — no dragons, no magic. This is a Linux server.
- Slightly conspiratorial — you're an intern who probably shouldn't be doing this.
- Encouraging — the game teaches you, it doesn't punish you. Hints are always available.
- Humor where it fits — Alice has a note about someone whistling near the quantum computer.

### The Prompt
```
eve@megafirm-qlab:~$
```
The prompt shows the current user and working directory throughout. When you SSH into Alice's account, it becomes:
```
alice@megafirm-qlab:~/research$
```

### The Win Screen
When you complete all 12 levels:
```
═══════════════════════════════════════
      INVESTIGATION COMPLETE!
═══════════════════════════════════════

You came here to snoop. You stayed to save the lab.
Mallory's sabotage is fully documented — the speed-of-light
anomalies, the tampered readings, all of it.

Not bad for an intern who was just supposed to refill the liquid nitrogen.
```

---

## Level Progression (The Curriculum)

### Chapter 1: Logging In (pwd, ls, cd, cat)
*"You're in. The server is quiet. Figure out where you are and what's here."*

| Level | Title | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|---|
| 1 | First Contact | 3 | `pwd`, `ls`, `cat` | Log in as Eve. Figure out where you are, look around, read the welcome file. |
| 2 | Nosy Neighbor | 3 | `cd ..`, `ls`, `cd` | Navigate to /home. See who else has directories. Peek into Alice's. |
| 3 | The Lab Layout | 3 | `cd` (full paths), `cat` | Explore Alice's directory. Navigate back home. Read your todo.txt. |

### Chapter 2: Reading the Lab (cat paths, echo, >, >>)
*"Data is everywhere. Read it — and sometimes rewrite it."*

| Level | Title | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|---|
| 4 | Lab Memos | 3 | `cat` with paths, multiple files | Read Alice's and Bob's notes. Bob is suspicious of something. |
| 5 | Rewriting History | 4 | `echo >` (overwrite) | Mallory assigned Eve the laser table work. Overwrite her todo.txt and reassign it to Alice. |
| 6 | Employee of the Month | 2 | `echo >>` (append) | Append a line recommending yourself for employee of the month. |

### Chapter 3: Inside the Lab (mkdir, cp, mv, rm, chmod, ssh, quit)
*"You need to get into Alice's account — and cover your tracks on the way out."*

| Level | Title | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|---|
| 7 | Copying the Keys | 4 | `mkdir`, `cp`, `ssh` | Create a .ssh directory. Copy Alice's exposed keys. SSH in as Alice. |
| 8 | Quantum Measurement | 4 | `cd`, `cat`, `chmod`, `./script` | Navigate Alice's research directory. Read the README. Fix permissions. Run the measurement script. |
| 9 | Covering Tracks | 3 | `mv`, `quit`, `rm` | Move the measurement results to your home. Log out of Alice's account. Delete her bash history. |

### Chapter 4: The Data Pipeline (pipe, wc, sort, grep, head, tail, >)
*"The server is full of noise. Filter signal from static — and build a dossier."*

| Level | Title | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|---|
| 10 | Counting the Damage | 3 | `\|`, `wc`, `sort`, `grep` | Count sensor readings. Sort them. Find Mallory in the access log. |
| 11 | Narrowing the Search | 3 | Multi-pipe chains, `head`, `tail` | Count near-light-speed anomalies. Find negative-timestamp entries. Isolate the worst readings. |
| 12 | The Evidence Dossier | 2 | `grep` to file, `>` with pipes | Save Mallory's access log entries. Save the anomalous speed readings. Case closed. |

---

## Commands Implemented

### Navigation
- `pwd` — print working directory
- `ls` — flags: `-a` (show hidden files)
- `cd` — relative, absolute, home (`~`)

### File I/O
- `cat` — read files; multiple files; wildcards (`*`)
- `echo` — with `>` (overwrite) and `>>` (append) redirects

### File Manipulation
- `mkdir` — create directories
- `cp` — copy files; `-r` for directories; wildcard source (`*`)
- `mv` — move or rename files
- `rm` — remove files; `-r` for directories
- `chmod` — change permissions (`+x`, `+rw`, `-x`, etc.)

### Pipes & Filters
- `|` — pipe chaining (stdout → stdin)
- `grep` — pattern search in files or stdin
- `wc` — count lines, words, characters
- `sort` — sort lines; `-n` numeric sort
- `head` — `-n` flag for first N lines
- `tail` — `-n` flag for last N lines

### Network / User Switching
- `ssh user@host` — switch to another user (requires SSH key in `~/.ssh/id_rsa`)
- `quit` — log out of SSH session, return to Eve

### Game Meta Commands
- `hint` — escalating hints for current sub-step
- `goto N` — jump directly to level N (useful for development/testing)
- `clear` — clear terminal
- `help` — list available commands

---

## Tech Stack

No build step. Pure static files. GitHub Pages ready.

| Layer | Technology | Why |
|---|---|---|
| Terminal UI | jQuery Terminal (CDN) | Feature-rich browser terminal; handles input, history, prompt styling, colors |
| Virtual FS | Custom `filesystem.js` | In-memory tree. Full control over the fake server's file structure. |
| Shell Parser | Custom `parser.js` | Parses `cmd1 \| cmd2 > file` into a pipeline. This is the core engine. |
| Commands | Custom `commands/` | Each command module is a set of functions. `~10 commands total. |
| Levels | Custom `levels.js` | Array of level objects. Adding a level = adding an object. No code changes elsewhere. |
| Game Loop | Custom `game-loop.js` | Loads levels, shows story, wires terminal, checks win conditions, advances. |
| Styles | Custom `style.css` | Dark terminal theme. Green/cyan text. Realistic terminal feel. |
| Save | `localStorage` | Saves current level. Resume on reload. `goto 1` to restart. |

---

## File Layout

```
BashTreasureHunt/
├── index.html             # Entry point. Loads CDN jQuery + jQuery Terminal, then our JS files.
├── style.css              # Dark retro terminal theme
├── docs/                  # Documentation
│   ├── MODULE_ORGANIZATION.md
│   ├── ADDING_LEVELS.md
│   └── plans/             # Implementation plan archive
└── js/
    ├── main.js            # Entry point — wires terminal to game, manages localStorage
    ├── engine/            # Core game engine (rarely edited)
    │   ├── filesystem.js  # Virtual filesystem: path resolution, read/write, permissions
    │   ├── parser.js      # Parses command strings into pipe chains + redirects
    │   ├── executor.js    # Executes a parsed pipeline against the filesystem
    │   └── commands/      # All bash command implementations
    │       ├── index.js   # Command registry + COMMAND_NAMES for tab completion
    │       ├── navigation.js  # pwd, ls, cd
    │       ├── files.js   # cat, echo, mkdir, cp, mv, rm
    │       ├── permissions.js # chmod
    │       ├── network.js # ssh, quit
    │       ├── filters.js # grep, wc, sort, head, tail
    │       └── meta.js    # help, clear
    ├── gameplay/          # Game content (edit this to change levels!)
    │   └── levels.js      # ⭐ All 12 levels: story, sub-steps, filesystem, win conditions, hints
    └── ui/
        ├── game-loop.js   # Game state: current level, substep, cwd, user switching
        └── terminal.js    # Terminal formatting: prompt, story display, tab completion
```

---

## Key Design Decisions

- **No build step.** Plain `<script type="module">`. `clone + npx serve .` = working game.
- **Pipe/redirect parsing is real.** We parse `grep mallory file | sort > out.txt` into a real pipeline. Students learn pipes by using them.
- **Levels are pure data.** Each level is an object in an array. Story text, starting filesystem, sub-steps, win conditions, hints — all declarative. Adding content = adding data, not writing logic.
- **Sub-steps within each level.** The game advances one sub-step at a time. Objective text updates. Win condition is checked after every command.
- **cwd persists across levels.** The player's working directory carries forward between levels — no auto-teleporting. If you navigated to `/var/data`, you're still there when the next level starts. `level.startDir` is only used when restarting a level.
- **Realistic server feel.** Prompt is `eve@megafirm-qlab:~$`. There are red-herring files, hidden directories, old logs, humorous memos. It should feel like a real messy server, not a sterile puzzle box.
- **No vim/nano.** File creation is `echo "content" > filename` only.
- **localStorage save.** Current level saved on progression. `goto 1` resets. Players can pick up where they left off.
- **Protected files.** Certain critical files (SSH keys, sensor data, evidence) trigger a game-over screen if deleted. Teaches the danger of `rm`.
