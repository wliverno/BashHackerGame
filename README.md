# BashTreasureHunt

A browser-based bash learning game. No installation required - just open and play!

## For Players

Open `index.html` in your browser and start learning bash commands through interactive missions.

## For Developers

### Project Structure

```
BashTreasureHunt/
├── js/
│   ├── engine/       # Core game engine (filesystem, parser, commands)
│   ├── gameplay/     # Level content (edit this to add levels!)
│   ├── ui/           # Terminal display and game loop
│   └── main.js       # Entry point
├── tests/            # Jest tests
├── docs/             # Documentation
│   ├── MODULE_ORGANIZATION.md  # Architecture overview
│   ├── ADDING_LEVELS.md        # How to create levels
│   └── plans/                  # Implementation plans
├── index.html        # Game entry point
└── style.css         # Terminal styling
```

### Quick Start (Development)

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run specific test file
npm test -- filesystem.test.js

# Open game in browser
open index.html
```

### Adding Content

**Want to add a new level?**
1. Open `js/gameplay/levels.js`
2. Copy an existing level as template
3. Modify story, objectives, filesystem
4. See `docs/ADDING_LEVELS.md` for detailed guide

**Want to add a new command?**
1. Edit appropriate file in `js/engine/commands/`
2. Add tests in `tests/commands.test.js`
3. See `docs/MODULE_ORGANIZATION.md` for details

### Documentation

- **[Module Organization](docs/MODULE_ORGANIZATION.md)** - How the code is structured
- **[Adding Levels](docs/ADDING_LEVELS.md)** - Step-by-step guide to creating content
- **[Design Document](DESIGN.md)** - Original vision and curriculum plan

### Tech Stack

- Vanilla JavaScript (ES6 modules)
- jQuery Terminal (terminal emulation)
- Jest (testing)
- No build step - pure static files

### Current Progress

- ✅ Chapter 1: Navigation (ls, cd, pwd)
- ✅ Chapter 2: File I/O (cat, echo, redirects)
- ✅ Chapter 3: File Operations (mkdir, cp, mv, rm, chmod)
- ✅ Chapter 4: Pipes & Text Processing (wc, sort, grep, head, tail)
- 📋 Chapters 5-7: find, sed, advanced scripting

## License

[Your license here]
