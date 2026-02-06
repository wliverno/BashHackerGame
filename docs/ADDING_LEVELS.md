# Adding Levels Guide

## Quick Start

1. Open `js/gameplay/levels.js`
2. Copy an existing level object as a template
3. Modify the fields (see structure below)
4. Test in browser
5. Done!

## Level Object Structure

```javascript
{
  id: 10,                    // Unique sequential number
  chapter: 4,                // Which chapter (1-7)
  title: 'Basic Pipes',      // Short title shown in level header
  story: `Multi-line story text here...`, // Intro narrative
  filesystem: {              // Starting filesystem for this level
    home: {
      analyst: {
        'data.txt': 'file contents here',
        subfolder: {
          'another.txt': 'more content',
        },
      },
    },
  },
  startDir: '/home/analyst', // Where player starts
  subSteps: [                // Array of 3-4 sub-objectives
    {
      objective: 'Task description shown to player',
      hints: [
        'First hint (gentle nudge)',
        'Second hint (more specific)',
        'Final hint (almost the answer)',
      ],
      winCondition: (cmd, output, fs) => {
        // Return true when player succeeds
        return cmd.trim() === 'pwd';
      },
    },
    // ... more substeps
  ],
}
```

## Win Condition Patterns

### Using Helpers (Recommended)

```javascript
import { winConditions } from './win-conditions.js';

// Check exact command
winCondition: winConditions.exactCommand('pwd')

// Check command starts with
winCondition: winConditions.commandStartsWith('ls')

// Check command includes multiple parts
winCondition: winConditions.commandIncludes('cat', 'welcome.txt')

// Check directory changed
winCondition: winConditions.changedToDir('/home/analyst/internal')

// Check file exists
winCondition: winConditions.fileExists('/tmp/output.txt')

// Check file content
winCondition: winConditions.fileContains('/tmp/note.txt', 'secret message')
winCondition: winConditions.fileMatches('/tmp/note.txt', 'exact content')

// Check permissions
winCondition: winConditions.hasPermission('./script.sh', 'x')

// Combine multiple conditions
winCondition: winConditions.all(
  winConditions.fileExists('/tmp/output.txt'),
  winConditions.commandIncludes('echo', '>')
)
```

### Custom Win Conditions

```javascript
winCondition: (cmd, output, fs) => {
  // cmd = the command string player typed
  // output = the output from running the command
  // fs = filesystem object (check state with fs.readFile(), fs.cwd, etc)

  // Example: Check if user created specific directory structure
  const hasDir = fs.resolvePath('/home/analyst/evidence');
  const hasFile = fs.readFile('/home/analyst/evidence/data.txt');
  return hasDir && hasDir.type === 'dir' && hasFile !== null;
}
```

## Filesystem Structure

Filesystem is a nested object where:
- Strings = file contents
- Objects = directories containing more files/directories

```javascript
filesystem: {
  home: {
    analyst: {
      'simple-file.txt': 'This is a file',
      'another.txt': 'More content',
      documents: {
        'nested-file.txt': 'Inside documents folder',
        'report.txt': 'Multi-line\ncontent\nworks too',
      },
    },
  },
  var: {
    log: {
      'system.log': 'Log entry 1\nLog entry 2',
    },
  },
}
```

## Best Practices

### Story Writing
- Keep it concise (3-5 lines max)
- Make it feel realistic (you're on a Linux server)
- Hint at what the player should do, but don't give it away
- Use the hacker/sysadmin theme

### Objectives
- Start with a verb: "Use `pwd` to...", "Navigate to...", "Create a file..."
- Be specific about what to type when teaching new commands
- Reference actual files/directories in the level's filesystem
- One clear goal per substep

### Hints
- First hint: conceptual reminder ("pwd shows your current location")
- Second hint: command name or approach ("Try the pwd command")
- Third hint: nearly the exact answer ("Type: pwd")
- Always provide 2-3 hints per substep

### SubSteps
- 3 substeps is ideal (more = level feels long)
- 4 substeps for complex multi-step procedures
- Each substep should take 30-120 seconds to complete
- First substep teaches the concept
- Second substep reinforces it
- Third substep tests understanding

### Win Conditions
- Prefer using helpers from `win-conditions.js` over custom functions
- Test both positive and negative cases (should pass when right, fail when wrong)
- Don't check for specific output text when command itself is sufficient
- For file creation, check `fs.readFile()` result, not output

## Testing Your Level

### In Browser
1. Save `levels.js`
2. Refresh browser
3. Play through to your new level
4. Try to "break" it - type wrong commands, edge cases
5. Verify hints make sense in sequence

### Writing Automated Tests

Add to `tests/levels.test.js`:

```javascript
test('Level 10: Basic Pipes - substep 1', () => {
  const game = createGame();
  // ... advance to level 10 ...

  const result = game.runCommand('cat data.txt');
  expect(result.advanced).toBe(true);
  expect(result.newObjective).toContain('next task');
});
```

## Example: Complete Level

```javascript
{
  id: 10,
  chapter: 4,
  title: 'Basic Pipes',
  story: `The server generates thousands of log entries every hour.

Reading raw logs is like drinking from a firehose. You need to filter them.

Time to learn the power of pipes: feeding one command's output into another.`,
  filesystem: {
    home: {
      analyst: {
        'users.txt': 'alice\nbob\ncharlie\nadmin\nroot\nguest',
        logs: {
          'access.log': '192.168.1.1 GET /\n10.0.0.5 POST /api\n192.168.1.1 GET /login',
        },
      },
    },
  },
  startDir: '/home/analyst',
  subSteps: [
    {
      objective: 'Use `cat users.txt` to display the user list.',
      hints: [
        'cat shows file contents',
        'Type: cat users.txt',
      ],
      winCondition: winConditions.commandIncludes('cat', 'users.txt'),
    },
    {
      objective: 'Now pipe that list through `grep admin` to find the admin user: `cat users.txt | grep admin`',
      hints: [
        'The pipe symbol | sends output from left command to right command',
        'Format: cat file.txt | grep pattern',
        'Type: cat users.txt | grep admin',
      ],
      winCondition: winConditions.all(
        winConditions.commandIncludes('cat', 'users.txt'),
        winConditions.commandIncludes('|'),
        winConditions.commandIncludes('grep', 'admin')
      ),
    },
    {
      objective: 'Save the result to a file: `cat users.txt | grep admin > admin_users.txt`',
      hints: [
        'Add > filename to save output',
        'Combine pipe and redirect: cmd1 | cmd2 > file',
        'Type: cat users.txt | grep admin > admin_users.txt',
      ],
      winCondition: winConditions.fileContains('admin_users.txt', 'admin'),
    },
  ],
}
```

## Common Mistakes

❌ **Too much story**: Keep it under 5 lines
✅ **Brief and focused**: 2-3 lines setting the scene

❌ **Vague objectives**: "Explore the filesystem"
✅ **Specific objectives**: "Navigate to the internal directory with `cd internal`"

❌ **Hints too cryptic**: "Think about navigation"
✅ **Hints escalate**: "pwd shows location" → "Use pwd" → "Type: pwd"

❌ **Complex win conditions**: Checking 5 different things
✅ **Simple win conditions**: Use helpers, check one thing well

❌ **Empty filesystem**: Just one or two files
✅ **Realistic filesystem**: Red herrings, nested dirs, hidden files

## Need Help?

- Check existing levels in `levels.js` for patterns
- Use win condition helpers from `win-conditions.js`
- Test thoroughly in browser before committing
- Read `MODULE_ORGANIZATION.md` for architecture overview
