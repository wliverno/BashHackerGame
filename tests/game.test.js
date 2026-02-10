import { createGame } from '../js/ui/game-loop.js';
import { executePipeline } from '../js/engine/executor.js';
import { getCompletions } from '../js/ui/terminal.js';
import { createFilesystem } from '../js/engine/filesystem.js';
import { levels } from '../js/gameplay/levels.js';

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
    expect(fs.readFile('out.txt')).toBe('line1\nline2');
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

  test('executes ./script when file is executable', () => {
    const fs = createFilesystem({
      home: { analyst: { 'run.sh': 'hello from script' } },
    });
    fs.cwd = '/home/analyst';
    fs.setPermission('run.sh', '+x');
    const result = executePipeline('./run.sh', fs);
    expect(result.output).toBe('hello from script');
    expect(result.exitCode).toBe(0);
  });

  test('returns Permission denied for non-executable ./script', () => {
    const fs = createFilesystem({
      home: { analyst: { 'run.sh': 'hello' } },
    });
    fs.cwd = '/home/analyst';
    const result = executePipeline('./run.sh', fs);
    expect(result.output).toContain('Permission denied');
    expect(result.exitCode).toBe(126);
  });

  test('returns error for non-existent ./script', () => {
    const fs = createFilesystem({ home: { analyst: {} } });
    fs.cwd = '/home/analyst';
    const result = executePipeline('./nope.sh', fs);
    expect(result.output).toContain('No such file or directory');
    expect(result.exitCode).toBe(127);
  });

  test('expands * wildcard', () => {
    const fs = createFilesystem({
      home: { analyst: { 'test1.txt': 'content1', 'test2.txt': 'content2', 'other.log': 'log' } },
    });
    fs.cwd = '/home/analyst';
    const result = executePipeline('ls *.txt', fs);
    expect(result.output).toContain('test1.txt');
    expect(result.output).toContain('test2.txt');
    expect(result.output).not.toContain('other.log');
  });

  test('expands ? wildcard', () => {
    const fs = createFilesystem({
      home: { analyst: { 'test1.txt': 'c1', 'test2.txt': 'c2', 'test10.txt': 'c10' } },
    });
    fs.cwd = '/home/analyst';
    const result = executePipeline('ls test?.txt', fs);
    expect(result.output).toContain('test1.txt');
    expect(result.output).toContain('test2.txt');
    expect(result.output).not.toContain('test10.txt');
  });

  test('expands wildcards in subdirectories', () => {
    const fs = createFilesystem({
      home: { analyst: { subdir: { 'file1.txt': 'content1', 'file2.txt': 'content2' } } },
    });
    fs.cwd = '/home/analyst';
    const result = executePipeline('cat subdir/*.txt', fs);
    expect(result.output).toContain('content1');
    expect(result.output).toContain('content2');
  });

  test('leaves wildcard as-is when no matches', () => {
    const fs = createFilesystem({ home: { analyst: {} } });
    fs.cwd = '/home/analyst';
    const result = executePipeline('ls *.nonexistent', fs);
    expect(result.output).toContain('No such file or directory');
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

    // Level 7 — Organizing the Evidence
    expect(game.currentLevel).toBe(6);
    game.runCommand('mkdir evidence');
    game.runCommand('cp reports/budget.txt evidence/');
    game.runCommand('cp reports/staffing.txt evidence/');

    // Level 8 — Covering Tracks
    expect(game.currentLevel).toBe(7);
    game.runCommand('mv evidence/budget.txt classified/');
    game.runCommand('rm temp.log');
    game.runCommand('rm -r old_logs');

    // Level 9 — The Antidote
    expect(game.currentLevel).toBe(8);
    game.runCommand('cat readme.txt');
    game.runCommand('chmod +x antidote.sh');
    game.runCommand('./antidote.sh');

    // Level 10 — Data Streams
    expect(game.currentLevel).toBe(9);
    game.runCommand('cat access.log | wc');
    game.runCommand('cat data.txt | sort');
    game.runCommand('cat access.log | grep admin');

    // Level 11 — Pipeline Power
    expect(game.currentLevel).toBe(10);
    game.runCommand('cat events.log | grep ERROR | wc');
    game.runCommand('cat employees.txt | sort | head -n 3');
    game.runCommand('cat numbers.txt | sort -n | tail -n 2');

    // Level 12 — The Evidence Dossier
    expect(game.currentLevel).toBe(11);
    game.runCommand('cat suspects.txt | grep Koch > evidence/suspect.txt');
    game.runCommand('cat transactions.txt | grep "Kill All Humans" > evidence/crimes.txt');
    game.runCommand('cat suspects.txt | sort >> evidence/dossier.txt');

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

  test('completes files in subdirectories', () => {
    fs.writeFile('documents/report.txt', 'content');
    fs.writeFile('documents/memo.txt', 'content');
    const results = getCompletions('cat documents/', fs);
    expect(results).toContain('cat documents/report.txt');
    expect(results).toContain('cat documents/memo.txt');
  });

  test('completes partial filenames in subdirectories', () => {
    fs.writeFile('documents/report.txt', 'content');
    fs.writeFile('documents/memo.txt', 'content');
    const results = getCompletions('cat documents/r', fs);
    expect(results).toEqual(['cat documents/report.txt']);
  });

  test('cd completes subdirectories', () => {
    fs.createDir('documents/archive');
    fs.createDir('documents/drafts');
    const results = getCompletions('cd documents/', fs);
    expect(results).toContain('cd documents/..');
    expect(results).toContain('cd documents/archive');
    expect(results).toContain('cd documents/drafts');
  });
});
