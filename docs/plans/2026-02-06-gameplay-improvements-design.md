# Gameplay Improvements & Stable Filesystem Design

**Date:** 2026-02-06
**Status:** Implemented

## Overview

This design documents the major gameplay improvements applied to BashTreasureHunt, focusing on:
1. Creating a stable, consistent filesystem across levels
2. Implementing protected files with game over mechanics
3. Escalating narrative tone from professional to absurdist
4. Improving pedagogical approach with better hints
5. Umbrella Corporation theming with dark humor

## Filesystem Architecture

### Base Filesystem Structure

A canonical "Umbrella Corp Server" filesystem serves as the foundation for most levels:

```
/home/analyst/
├── .bash_history (deletable evidence)
├── welcome.txt (protected lore)
├── documents/
│   ├── memo.txt
│   └── schedule.txt
└── internal/
    ├── contacts.txt (protected lore)
    ├── projects/
    │   ├── project_alpha.txt (protected lore)
    │   └── project_tango.txt (protected lore)
    └── reports/
        ├── q1_summary.txt (protected lore)
        └── activity_log.txt (deletable evidence)
```

### Design Principles

1. **Core files persist** - Lore-important files appear consistently across levels where appropriate
2. **Level-specific additions** - Each level adds only what's needed for teaching
3. **Easy extensibility** - Base filesystem can be extended with `/var/log/`, `/tmp/` directories later

### Implementation

- `BASE_FILESYSTEM` constant defined at top of `levels.js`
- `mergeFilesystem(base, override)` utility for deep merging
- Each level uses `mergeFilesystem(BASE_FILESYSTEM, { overrides })`

## Protected Files & Game Over System

### Protected Lore Files

These files trigger game over if deleted or moved:
- `/home/analyst/welcome.txt` - Umbrella Corp introduction
- `/home/analyst/internal/contacts.txt` - Deceased politicians
- `/home/analyst/internal/projects/project_alpha.txt` - $9.1 trillion project
- `/home/analyst/internal/projects/project_tango.txt` - Status FAILED
- `/home/analyst/internal/reports/q1_summary.txt` - Revenue/death statistics

### Deletable Evidence Files

Part of gameplay in "Covering Tracks" level:
- `.bash_history` - Can be deleted to cover tracks
- `activity_log.txt` - Can be deleted to cover tracks

### Game Over Mechanics

When a protected file is deleted or moved:
1. Terminal displays dramatic message:
   ```
   SYSTEM ALERT: Critical file destroyed.
   Security breach detected.
   Connection terminated.

   Press ENTER to restart level...
   ```
2. Terminal pauses input
3. Any keypress clears terminal and restarts current level
4. Player's progress in other levels is preserved

### Implementation

- Each level has `protectedFiles: PROTECTED_FILES` array
- `checkProtectedFiles(fs, protectedFiles)` in `game-loop.js`
- Check runs after `executePipeline()` but before win condition
- `game.restartLevel()` method reloads current level filesystem

## Narrative Tone Progression

### Chapter 1 (Levels 1-3): "Something's Off"

- Relatively professional corporate tone
- Subtle hints of wrongness:
  - "Sharing disabled for internal directories"
  - Suspicious activity logs at 02:14 UTC
  - Projects with odd names but not overtly evil
- Player learns navigation in seemingly normal server

### Chapter 2 (Levels 4-6): "Wait, What?"

- Dark humor emerges:
  - Project names: "Kill All Humans", "Puppy Love"
  - Revenue reports include "Human deaths up 2000%"
  - Budget numbers get absurd ($2.4B, $9.1 trillion)
  - Personnel: "J. T-virus" and "J. Bond"
- Tone shifts from corporate to darkly comedic
- Player questions what kind of company this is

### Chapter 3 (Levels 7-9): "Full Chaos"

- Deceased politicians in contacts (Dick Cheney, George Wallace)
- Full conspiracy/absurdist vibes
- Level 9 renamed to "The Antidote"
- Final script reveals no cure for T-virus
- Win message: "The Cheat is not dead" (Homestar Runner reference)

## Pedagogical Improvements

### Better Hints - Show Patterns, Not Answers

**Before:**
```javascript
hints: [
  'cat displays the contents of a file',
  'Type: cat welcome.txt',  // Too prescriptive
]
```

**After:**
```javascript
hints: [
  'cat displays the contents of a file',
  'Syntax: cat [filename]',  // Teaches the pattern
  'Try: cat welcome.txt',
]
```

### Better Objectives - Focus on Goals

**Before:**
```javascript
objective: "There's a file called welcome.txt. Read it with `cat welcome.txt`."
```

**After:**
```javascript
objective: "There's a file called welcome.txt. Print the contents of the file to the terminal (type 'hint' for a hint)."
```

### Progressive Hint System

1. **First hint**: General concept/syntax pattern
2. **Second hint**: More specific guidance
3. **Third hint**: Nearly the exact answer (for when stuck)

This keeps challenge while preventing frustration.

### Streamlined Progression

- Level 3: Combined two `cd ..` steps into one objective to reach `/home/analyst`
- Hints show multiple approaches (relative `cd ..` or absolute `cd /home/analyst`)

## Theming: Umbrella Corporation

### Branding Changes

- Changed from "NexusCorp" to "Umbrella Corporation"
- Terminal prompt: `analyst@ucorp-srv-04`
- Welcome message emphasizes surveillance and restricted sharing

### Dark Humor Elements

- **Contacts**: Deceased politicians (Dick Cheney, George Wallace) with .gov emails
- **Projects**:
  - "Project Alpha" - $9.1 trillion budget, lead: dtrump@whitehouse.gov
  - "Project Tango" - Status FAILED
  - "Kill All Humans" - $2.4B budget, lead: J. T-virus
  - "Puppy Love" - $800K budget, lead: J. Bond
- **Reports**: "Human deaths up 2000%" alongside revenue growth
- **Final reveal**: T-virus has no known cure

## Future Extensions

### Potential Additions

- **Additional directories**: `/var/log/`, `/tmp/` for more variety
- **Chapter 4+**: Continue escalating chaos
- **Final win screen**: Update to reflect Umbrella Corp narrative
- **Easter eggs**: More Homestar Runner references
- **Bonus levels**: Optional challenges for deleting evidence files

### Easy Extension Points

1. Add to `BASE_FILESYSTEM` to include new directories globally
2. Individual levels can override specific files for teaching purposes
3. `mergeFilesystem` utility handles deep merging automatically

## Technical Implementation Summary

### Files Modified

1. **js/gameplay/levels.js**
   - Added `BASE_FILESYSTEM` constant
   - Added `PROTECTED_FILES` array
   - Added `mergeFilesystem()` utility
   - Updated all 9 levels with new structure
   - Improved hints across all levels
   - Updated narrative content

2. **js/ui/game-loop.js**
   - Added `checkProtectedFiles()` function
   - Updated `runCommand()` to check for violations
   - Added `restartLevel()` method

3. **js/main.js**
   - Added game over handling
   - Terminal pause/resume on game over
   - Keypress listener for level restart

### Key Design Decisions

- **Protected files live at level definition** for clarity
- **Game over restarts current level only** (not whole chapter)
- **Terminal-native UX** (no GUI buttons, just keypress)
- **Escalating tone** builds immersion gradually
- **Extensible base filesystem** allows easy future additions

## Success Criteria

✅ Stable filesystem that doesn't change unnecessarily between levels
✅ Protected files prevent accidental deletion of lore-important content
✅ Game over system provides consequence without being punishing
✅ Narrative escalates from professional to absurdist chaos
✅ Hints teach patterns rather than prescribing exact commands
✅ Umbrella Corp theming with dark humor throughout
✅ "The Cheat is not dead" final message
✅ Easy to extend with new directories/content in future

## Notes

- User preference: J. Bond (James Bond reference) working on "Puppy Love" provides comic relief
- Evidence files (.bash_history, activity_log.txt) intentionally deletable for realism
- Future levels can build on this foundation without major refactoring
