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
- `winConditions.changedToDir('/home/eve')`

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
