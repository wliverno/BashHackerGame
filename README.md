# BashTreasureHunt

A browser-based bash learning game that teaches bash commands through an interactive quantum lab espionage story.

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

# Play the game (needs a local server because of ES modules)
npx serve .
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

### Running Locally

```bash
# Play the game (ES modules require a local server)
npx serve .
# Then open http://localhost:3000 in your browser

# Run the test suite
npm install
npm test
```

### Current Progress

- Chapter 1: Logging In (ls, cd, pwd, cat)
- Chapter 2: Reading the Lab (cat, echo, >, >>)
- Chapter 3: Inside the Lab (mkdir, cp, mv, rm, chmod, ssh)
- Chapter 4: The Data Pipeline (|, wc, sort, grep, head, tail)

## License

[Your license here]
