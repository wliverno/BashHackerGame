import { executePipeline, createGame, getCompletions } from '../js/game.js';
import { createFilesystem } from '../js/filesystem.js';
import { levels } from '../js/levels.js';

describe('executePipeline', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'file.txt': 'hello world',
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('executes single command', () => {
    const result = executePipeline('pwd', fs);
    expect(result.output).toBe('/home/analyst');
  });

  test('executes pipe chain', () => {
    const result = executePipeline('cat file.txt | cat', fs);
    expect(result.output).toBe('hello world');
  });

  test('handles redirect write', () => {
    executePipeline('echo "new content" > out.txt', fs);
    expect(fs.readFile('out.txt')).toBe('new content');
  });

  test('handles redirect append', () => {
    fs.writeFile('out.txt', 'line1');
    executePipeline('echo "line2" >> out.txt', fs);
    expect(fs.readFile('out.txt')).toBe('line1line2');
  });

  test('returns error output', () => {
    const result = executePipeline('cat nonexistent.txt', fs);
    expect(result.output).toContain('No such file or directory');
    expect(result.exitCode).toBe(1);
  });

  test('returns error for unknown command', () => {
    const result = executePipeline('foobar', fs);
    expect(result.output).toContain('command not found');
    expect(result.exitCode).toBe(127);
  });
});

describe('createGame', () => {
  test('initializes at level 0, substep 0', () => {
    const game = createGame();
    expect(game.currentLevel).toBe(0);
    expect(game.currentSubStep).toBe(0);
  });

  test('loads filesystem from level', () => {
    const game = createGame();
    expect(game.fs.cwd).toBe(levels[0].startDir);
  });

  test('getObjective returns current substep objective', () => {
    const game = createGame();
    expect(game.getObjective()).toBe(levels[0].subSteps[0].objective);
  });

  test('getHint returns hints for current substep', () => {
    const game = createGame();
    expect(game.getHint(0)).toBe(levels[0].subSteps[0].hints[0]);
  });

  test('getStory returns current level story', () => {
    const game = createGame();
    expect(game.getStory()).toBe(levels[0].story);
  });
});

describe('game.runCommand', () => {
  test('executes command and returns output', () => {
    const game = createGame();
    const result = game.runCommand('pwd');
    expect(result.output).toBe('/home/analyst');
  });

  test('advances substep when win condition met', () => {
    const game = createGame();
    expect(game.currentSubStep).toBe(0);
    game.runCommand('pwd');
    expect(game.currentSubStep).toBe(1);
  });

  test('does not advance when win condition not met', () => {
    const game = createGame();
    game.runCommand('echo hello');
    expect(game.currentSubStep).toBe(0);
  });

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

  test('sets won flag when all levels complete', () => {
    const game = createGame();

    // Level 1
    game.runCommand('pwd');
    game.runCommand('ls');
    game.runCommand('cat welcome.txt');

    // Level 2
    game.runCommand('cd internal');
    game.runCommand('ls');
    game.runCommand('cd projects');

    // Level 3
    game.runCommand('cd ..');
    game.runCommand('cd ..');
    game.runCommand('cd documents');
    game.runCommand('cat important.txt');


    // Level 4
    game.runCommand('cat reports/budget.txt');
    game.runCommand('cat reports/staffing.txt');
    game.runCommand('cat reports/budget.txt reports/staffing.txt');

    // Level 5
    game.runCommand('echo "started investigating" > notes.txt');
    game.runCommand('cat notes.txt');
    game.runCommand('echo "Project Helios is the target" > notes.txt');

    // Level 6
    game.runCommand('cat dossier.txt');
    game.runCommand('echo "- New finding: budget is $2.4M" >> dossier.txt');
    game.runCommand('cat dossier.txt');
    expect(game.won).toBe(true);
  });

  test('emits chapterComplete when crossing chapter boundary', () => {
    const game = createGame();

    // Fast-forward through Chapter 1
    game.runCommand('pwd');
    game.runCommand('ls');
    game.runCommand('cat welcome.txt');
    game.runCommand('cd internal');
    game.runCommand('ls');
    game.runCommand('cd projects');
    game.runCommand('cd ..');
    game.runCommand('cd ..');
    game.runCommand('cd documents');

    // Completes Level 3 (ch1) → transitions to Level 4 (ch2)
    const result = game.runCommand('cat important.txt');

    expect(result.chapterComplete).toBe(true);
    expect(result.completedChapter).toBe(1);
    expect(result.newLevel).toBe(true);
  });
});

describe('hint command', () => {
  test('returns current hint', () => {
    const game = createGame();
    const result = game.runCommand('hint');
    expect(result.output).toContain('pwd');
  });

  test('escalates hints on repeated calls', () => {
    const game = createGame();
    const hint1 = game.runCommand('hint');
    const hint2 = game.runCommand('hint');
    expect(hint2.output).not.toBe(hint1.output);
  });

  test('does not advance substep', () => {
    const game = createGame();
    game.runCommand('hint');
    expect(game.currentSubStep).toBe(0);
  });
});

describe('getCompletions', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'welcome.txt': 'hi',
          'readme.md': 'docs',
          documents: {},
          projects: {},
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('completes command names from empty input', () => {
    expect(getCompletions('', fs)).toContain('ls');
    expect(getCompletions('', fs)).toContain('cd');
  });

  test('completes partial command name', () => {
    expect(getCompletions('c', fs)).toContain('cat');
    expect(getCompletions('c', fs)).toContain('cd');
    expect(getCompletions('c', fs)).toContain('clear');
    expect(getCompletions('c', fs)).not.toContain('ls');
  });

  test('completes file names after command with trailing space', () => {
    const results = getCompletions('cat ', fs);
    expect(results).toContain('cat welcome.txt');
    expect(results).toContain('cat readme.md');
    expect(results).toContain('cat documents');
  });

  test('completes file names matching partial', () => {
    const results = getCompletions('cat w', fs);
    expect(results).toEqual(['cat welcome.txt']);
  });

  test('cd only completes directories', () => {
    const results = getCompletions('cd ', fs);
    expect(results).toContain('cd documents');
    expect(results).toContain('cd projects');
    expect(results).toContain('cd ..');
    expect(results).not.toContain('cd welcome.txt');
    expect(results).not.toContain('cd readme.md');
  });

  test('cd completes partial directory name', () => {
    const results = getCompletions('cd d', fs);
    expect(results).toEqual(['cd documents']);
  });

  test('ls completes all entries', () => {
    const results = getCompletions('ls ', fs);
    expect(results).toContain('ls welcome.txt');
    expect(results).toContain('ls documents');
  });
});
