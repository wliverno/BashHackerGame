# BashTreasureHunt — Design Document

## Concept
A browser-based, interactive bash learning game hosted on GitHub Pages. Players are hackers/sysadmins who SSH into a compromised remote server and must navigate a realistic Linux filesystem to complete missions. No install required — open a URL and play.

## Inspiration
- **terminal-quest** (KanoComputing) — Python/GTK desktop app, 46 story-driven challenges teaching ls → cd → cat → echo. Great level structure (sub-steps, escalating hints, companion dialogue). Desktop-only, no pipe/redirect support, no web version.
- **GameShell, Bashcrawl, Terminus** — various terminal learning games, all requiring a local terminal or SSH. None are fully self-contained browser apps with pipe support.

## What We Do Differently
- Fully browser-based, zero install, GitHub Pages hostable
- Realistic sysadmin/hacker theme (not fantasy)
- Teaches pipes (`|`) and redirects (`>`, `>>`) — a gap in existing tools
- Teaches `find`, `sed`, multi-command pipelines in later levels
- Sub-steps within each level (like terminal-quest)
- Escalating hint system
- localStorage save/resume
- Retro terminal aesthetic

---

## Theme & Narrative

### Setting
You receive an anonymous tip that a mega-corporation called **Nexus Corp** has been suppressing open-source software, hoarding critical data, and locking down public internet infrastructure. Someone on the inside has given you SSH credentials to one of their internal servers. Your job: get in, find what you need, and get out — one mission at a time.

The server feels *real*: it has system directories, log files, config files, junk files, red herrings. It's messy the way real servers are messy.

### Tone
- Grounded and realistic — no dragons, no magic. This is a Linux server.
- Slightly tense — you're not supposed to be here.
- Encouraging — the game teaches you, it doesn't punish you. Hints are always available.
- Humor where it fits — a sysadmin left a `todo.txt` with "fix this later" from 2019.

### The Login Experience
The game opens with a realistic SSH login sequence:
```
Connecting to nexus-corp-srv-04.internal...
Connected.
nexus-corp-srv-04 login: analyst
Password: ••••••••
Last login: Fri Jan 31 03:22:41 from 10.0.0.77

Welcome to NexusCorp Internal Server
========================================
  You have 3 unread system messages.
  Use `cat /var/messages` to read them.
========================================

analyst@nexus-srv-04:~$
```
This sets the tone immediately — it feels like a real cluster login. The prompt stays realistic throughout: `analyst@nexus-srv-04:~/path$`

---

## Level Progression (The Curriculum)

### Chapter 1: Getting In (ls, cd, pwd)
*"You're in. The server is quiet. Figure out where you are and what's here."*

| Level | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|
| 1 | 3 | `ls`, `pwd` | You just logged in. Look around your home directory. Find the unread system messages file. |
| 2 | 3 | `cd`, `ls` | Navigate into subdirectories. The messages point you to a folder called `internal/`. |
| 3 | 3 | `cd ..`, relative paths | You went too deep. Navigate back up. Find the `projects/` directory. |

### Chapter 2: Reading the Server (cat, echo >)
*"Data is everywhere on this thing. You need to read it — and sometimes write to it."*

| Level | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|
| 4 | 3 | `cat` | Read config files and logs in `projects/`. One of them has a username for the next stage. |
| 5 | 3 | `echo >` (file creation) | You need to leave a note for your contact on the inside. Write a specific message to a dead-drop file. |
| 6 | 3 | `echo >>` (append) | Your contact needs more info appended to the dead-drop. Don't overwrite what's already there. |

### Chapter 3: Moving Pieces (mkdir, cp, mv, rm, chmod)
*"You need to organize what you've found — and cover your tracks."*

| Level | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|
| 7 | 3 | `mkdir`, `cp` | Your evidence is scattered across directories. Create an organized folder and copy the key files there. |
| 8 | 3 | `mv`, `rm` | Time to clean up. Move the originals somewhere safe, and delete the breadcrumbs you left behind. |
| 9 | 3 | `chmod` | You found a shell script that could help — but it won't run. Figure out why and fix it. |

### Chapter 4: The Data Pipeline (pipes, wc, sort)
*"The server is full of noise. You need to filter signal from static."*

| Level | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|
| 10 | 3 | `\|` (basic pipe) | A user list is dumped to a file. Pipe it through another command to find active accounts. |
| 11 | 3 | `wc`, `sort` | Count how many log entries match a pattern. Sort a list of IPs to find duplicates. |
| 12 | 3 | Multi-pipe chains | Chain `cat \| sort \| wc` together. Nexus Corp's firewall rules are buried in noise — extract the one that's blocking public internet. |

### Chapter 5: Search & Filter (grep, head, tail)
*"You know the data is here. You just need to find it."*

| Level | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|
| 13 | 3 | `grep` (basic) | Search server logs for a specific IP address tied to the suppression campaign. |
| 14 | 3 | `grep` with flags (`-i`, `-r`, `-n`) | Case-insensitive recursive search across `/var/log/`. Find all references to "project_nightfall". |
| 15 | 3 | `head`, `tail` | A massive database dump exists. You don't need all of it — just the header and the last few entries. |

### Chapter 6: Deep Recon (find, ls flags, du, which)
*"The interesting stuff is always hidden in the places no one looks."*

| Level | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|
| 16 | 3 | `ls -a`, `which` | Hidden files (dotfiles) in the sysadmin's home directory. Config files with credentials. Use `which` to track down where a key tool is installed. |
| 17 | 3 | `find` (basic), `du` | A file called `credentials.db` exists somewhere on the server. Find it. Then figure out what's eating your disk quota before you run out of space. |
| 18 | 3 | `find` with flags (`-name`, `-type`, `-path`) | Locate all `.conf` files under `/etc/` that were modified recently. Nexus changed their firewall config — find the proof. |

### Chapter 7: The Endgame (sed, complex pipelines)
*"You have everything you need. Now you need to act on it."*

| Level | Sub-steps | What's Taught | Mission Flavor |
|---|---|---|---|
| 19 | 3 | `sed` (basic s/old/new/) | A firewall rule file is corrupted — a key IP is wrong. Use `sed` to fix it in place. |
| 20 | 3 | `sed` + pipes | The kill-switch script exists but references a wrong path. Pipe the file through `sed` to correct it, then write the output. |
| 21 | 4 | Full pipeline (cat \| grep \| sed \| sort > output) | Final mission: extract, filter, transform, and write the data that will unlock public internet access. Game over screen. |

---

## Commands to Implement

### Navigation
- `ls` — flags: `-a` (hidden), `-l` (long), `-R` (recursive)
- `cd` — relative (`../`), absolute (`/`), home (`~`)
- `pwd`

### File I/O
- `cat` — read files, multiple files
- `echo` — with `>` (write) and `>>` (append) redirects

### File Manipulation
- `mkdir` — create directories
- `cp` — copy files; `-r` for directories
- `mv` — move or rename files
- `rm` — remove files; `-r` for directories, `-f` to force — destructive!
- `chmod` — change permissions (`+x`, `-x`, `+r`, etc.)

### Utility
- `du` — disk usage; `-sh` for human-readable summary of a path
- `which` — show the installed path of a command

### Pipes & Filters
- `|` — pipe chaining (stdout of left → stdin of right)
- `grep` — flags: `-i` (case insensitive), `-r` (recursive), `-n` (line numbers)
- `wc` — `-l` (lines), `-w` (words)
- `sort`
- `head` — `-n` flag
- `tail` — `-n` flag

### Search & Transform
- `find` — `-name`, `-type`, `-path`
- `sed` — `s/pattern/replacement/` and `s/pattern/replacement/g`

### Game Meta Commands
- `help` — list available commands
- `hint` — escalating hints for current sub-step
- `clear` — clear terminal
- `whoami` — returns `analyst` (flavor)
- `date` — returns a fake date (flavor)
- `history` — shows command history (flavor)

---

## Tech Stack

No build step. Pure static files. GitHub Pages ready.

| Layer | Technology | Why |
|---|---|---|
| Terminal UI | jQuery Terminal (CDN) | Feature-rich browser terminal; handles input, history, prompt styling, colors |
| Virtual FS | Custom `filesystem.js` | In-memory tree. Full control over the fake server's file structure. |
| Shell Parser | Custom `parser.js` | Parses `cmd1 \| cmd2 > file` into a pipeline. This is the core engine. |
| Commands | Custom `commands.js` | Each command is a function. ~15 commands total — no framework needed. |
| Levels | Custom `levels.js` | Array of level objects. Adding a level = adding an object. No code changes elsewhere. |
| Game Loop | Custom `game.js` | Loads levels, shows story, wires terminal, checks win conditions, advances. |
| Styles | Custom `style.css` | Dark terminal theme. Green/cyan text. Realistic terminal feel. |
| Save | `localStorage` | Saves current level. Resume on reload. `restart` command to reset. |

---

## File Layout

```
BashTreasureHunt/
├── index.html          # Entry point. Loads CDN jQuery + jQuery Terminal, then our JS files.
├── style.css           # Dark retro terminal theme
└── js/
    ├── filesystem.js   # Virtual filesystem — the fake server
    ├── parser.js       # Parses command strings into pipe chains + redirects
    ├── commands.js     # All command implementations (ls, cd, cat, grep, etc.)
    ├── levels.js       # All 18 levels: story text, sub-steps, starting FS, win conditions, hints
    └── game.js         # Game loop: loads level, wires jQuery Terminal, checks wins, advances
```

---

## Build Order

1. `index.html` + `style.css` — Terminal skeleton, realistic SSH login screen
2. `filesystem.js` — Virtual FS: nested object tree, cd, read/write files
3. `parser.js` — Parse `cmd | cmd > file` into pipeline + redirect AST
4. `commands.js` — Implement all commands against the virtual FS
5. `levels.js` — Define Chapter 1 (levels 1–3) first, get the loop working
6. `game.js` — Wire it all: load level → show story → accept input → check win → next sub-step / next level
7. Chapters 2–6 — Fill in remaining levels in `levels.js`
8. Polish — Login sequence animation, ASCII art chapter headers, color coding, edge cases, help text

---

## Key Design Decisions

- **No build step.** Plain `<script>` tags. `clone + open index.html` = working game.
- **Pipe/redirect parsing is real.** We parse `echo hello | grep h > out.txt` into a chain of commands and wire stdout→stdin manually. Students learn the *concept* of pipes by using them.
- **Levels are pure data.** Each level is an object in an array. Story text, starting filesystem, sub-steps, win conditions, hints — all declarative. Adding content = adding data, not writing logic.
- **Sub-steps within each level.** The game advances one sub-step at a time. Story text prints at each sub-step. Win condition is checked after every command.
- **Realistic server feel.** Prompt is `analyst@nexus-srv-04:~/path$`. There are red-herring files, empty directories, old logs. It should feel like a real messy server, not a sterile puzzle box.
- **No vim/nano.** File creation is `echo "content" > filename` only.
- **localStorage save.** Current level + sub-step saved on progression. `restart` resets. Students can pick up where they left off.
