import { createGame } from '../js/ui/game-loop.js';
import { executePipeline } from '../js/engine/executor.js';
import { getCompletions, formatPrompt } from '../js/ui/terminal.js';
import { createFilesystem } from '../js/engine/filesystem.js';
import { levels } from '../js/gameplay/levels.js';

describe('executePipeline', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        eve: {
          'file.txt': 'hello world',
        },
      },
    });
    fs.cwd = '/home/eve';
  });

  test('executes single command', () => {
    const result = executePipeline('pwd', fs);
    expect(result.output).toBe('/home/eve');
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
      home: { eve: { 'run.sh': 'hello from script' } },
    });
    fs.cwd = '/home/eve';
    fs.setPermission('run.sh', '+x');
    const result = executePipeline('./run.sh', fs);
    expect(result.output).toBe('hello from script');
    expect(result.exitCode).toBe(0);
  });

  test('returns Permission denied for non-executable ./script', () => {
    const fs = createFilesystem({
      home: { eve: { 'run.sh': 'hello' } },
    });
    fs.cwd = '/home/eve';
    const result = executePipeline('./run.sh', fs);
    expect(result.output).toContain('Permission denied');
    expect(result.exitCode).toBe(126);
  });

  test('returns error for non-existent ./script', () => {
    const fs = createFilesystem({ home: { eve: {} } });
    fs.cwd = '/home/eve';
    const result = executePipeline('./nope.sh', fs);
    expect(result.output).toContain('No such file or directory');
    expect(result.exitCode).toBe(127);
  });

  test('expands * wildcard', () => {
    const fs = createFilesystem({
      home: { eve: { 'test1.txt': 'content1', 'test2.txt': 'content2', 'other.log': 'log' } },
    });
    fs.cwd = '/home/eve';
    const result = executePipeline('ls *.txt', fs);
    expect(result.output).toContain('test1.txt');
    expect(result.output).toContain('test2.txt');
    expect(result.output).not.toContain('other.log');
  });

  test('expands ? wildcard', () => {
    const fs = createFilesystem({
      home: { eve: { 'test1.txt': 'c1', 'test2.txt': 'c2', 'test10.txt': 'c10' } },
    });
    fs.cwd = '/home/eve';
    const result = executePipeline('ls test?.txt', fs);
    expect(result.output).toContain('test1.txt');
    expect(result.output).toContain('test2.txt');
    expect(result.output).not.toContain('test10.txt');
  });

  test('expands wildcards in subdirectories', () => {
    const fs = createFilesystem({
      home: { eve: { subdir: { 'file1.txt': 'content1', 'file2.txt': 'content2' } } },
    });
    fs.cwd = '/home/eve';
    const result = executePipeline('cat subdir/*.txt', fs);
    expect(result.output).toContain('content1');
    expect(result.output).toContain('content2');
  });

  test('leaves wildcard as-is when no matches', () => {
    const fs = createFilesystem({ home: { eve: {} } });
    fs.cwd = '/home/eve';
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

  test('carries cwd from previous level on advance', () => {
    const game2 = createGame();
    game2.runCommand('pwd');           // substep 0 of level 1
    game2.runCommand('ls');            // substep 1 of level 1
    game2.runCommand('cd ..');         // navigate to /home — not a win condition
    expect(game2.fs.cwd).toBe('/home');
    game2.runCommand('cat welcome.txt');  // substep 2 — advances to level 2
    // After level advance, cwd should be inherited (/home), NOT reset to /home/eve
    expect(game2.fs.cwd).toBe('/home');
    expect(game2.currentLevel).toBe(1);
  });

  test('createGame respects startLevel option', () => {
    const game = createGame({ startLevel: 4 });
    expect(game.currentLevel).toBe(4);
    expect(game.fs.cwd).toBe(levels[4].startDir);
  });

  test('createGame respects startUser option', () => {
    const game = createGame({ startUser: 'alice' });
    expect(game.currentUser).toBe('alice');
  });
});

describe('game.runCommand', () => {
  test('executes command and returns output', () => {
    const game = createGame();
    const result = game.runCommand('pwd');
    expect(result.output).toBe('/home/eve');
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

    // Level 1 — First Contact
    game.runCommand('pwd');
    game.runCommand('ls');
    game.runCommand('cat welcome.txt');

    // Level 2 — Nosy Neighbor
    game.runCommand('cd ..');
    game.runCommand('ls');
    game.runCommand('cd alice');

    // Level 3 — The Lab Layout
    game.runCommand('ls');
    game.runCommand('cd /home/eve');
    game.runCommand('cat todo.txt');

    // Level 4 — Lab Memos
    expect(game.currentLevel).toBe(3);
    game.runCommand('cat /home/alice/notes/lab_memo.txt');
    game.runCommand('cat /home/bob/notes/meeting_notes.txt');
    game.runCommand('cat /home/alice/notes/lab_memo.txt /home/alice/notes/safety_notice.txt');

    // Level 5 — Rewriting History (Mallory's todo)
    expect(game.currentLevel).toBe(4);
    game.runCommand('cd /home/mallory');
    game.runCommand('cat todo.txt');
    game.runCommand('echo "Get Alice to align laser table" > todo.txt');
    game.runCommand('cat todo.txt');

    // Level 6 — Employee of the Month (Mallory's todo)
    expect(game.currentLevel).toBe(5);
    game.runCommand('echo "Recommend Eve for employee of the month" >> todo.txt');
    game.runCommand('cat todo.txt');

    // Level 7 — Copying the Keys
    expect(game.currentLevel).toBe(6);
    game.runCommand('cd /home/eve');
    game.runCommand('mkdir evidence');
    game.runCommand('mkdir .ssh');
    game.runCommand('cp /home/alice/.ssh/* .ssh/');
    game.runCommand('ssh alice@megafirm-qlab');

    // Level 8 — Quantum Measurement
    expect(game.currentLevel).toBe(7);
    game.runCommand('cd research');
    game.runCommand('cat README.txt');
    game.runCommand('chmod +rw alice.qubit bob.qubit');
    game.runCommand('chmod +x measure.sh');
    game.runCommand('./measure.sh');

    // Level 9 — Covering Tracks
    expect(game.currentLevel).toBe(8);
    game.runCommand('cd /home/alice');
    game.runCommand('mv temp_results.txt /home/eve/');
    game.runCommand('quit');
    game.runCommand('rm /home/alice/.bash_history');
    expect(game.currentLevel).toBe(9);

    // Level 10 — Counting the Damage
    expect(game.currentLevel).toBe(9);
    game.runCommand('cat sensor_readings.csv | wc');
    game.runCommand('cat sensor_readings.csv | sort');
    game.runCommand('cat /var/log/access.log | grep mallory');

    // Level 11 — Narrowing the Search
    expect(game.currentLevel).toBe(10);
    game.runCommand('cd /var/data');
    game.runCommand('cat sensor_readings.csv | grep "2.99E" | wc');
    game.runCommand('cat /var/log/access.log | sort | head -n 5');
    game.runCommand('cat sensor_readings.csv | grep "2.99E" | sort -n | tail -n 3');

    // Level 12 — The Evidence Dossier
    expect(game.currentLevel).toBe(11);
    game.runCommand('cd /home/eve');
    game.runCommand('grep mallory /var/log/access.log > evidence/access_proof.txt');
    game.runCommand('grep "2.99E" /var/data/sensor_readings.csv > evidence/speed_anomalies.txt');

    expect(game.won).toBe(true);
  });

  test('emits chapterComplete when crossing chapter boundary', () => {
    const game = createGame();

    // Fast-forward through Chapter 1
    game.runCommand('pwd');
    game.runCommand('ls');
    game.runCommand('cat welcome.txt');
    game.runCommand('cd ..');
    game.runCommand('ls');
    game.runCommand('cd alice');
    game.runCommand('ls');
    game.runCommand('cd /home/eve');

    // Completes Level 3 (ch1) → transitions to Level 4 (ch2)
    const result = game.runCommand('cat todo.txt');

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

describe('user identity', () => {
  test('game starts with currentUser as eve', () => {
    const game = createGame();
    expect(game.currentUser).toBe('eve');
  });

  test('switchUser changes currentUser', () => {
    const game = createGame();
    game.switchUser('alice');
    expect(game.currentUser).toBe('alice');
  });

  test('restartLevel preserves currentUser', () => {
    const game = createGame();
    game.switchUser('alice');
    game.restartLevel();
    expect(game.currentUser).toBe('alice');
  });
});

describe('ssh user switching in game', () => {
  test('executePipeline passes through switchUser from ssh command', () => {
    const fs = createFilesystem({
      home: { eve: { '.ssh': { 'id_rsa': 'fake-key' } } },
    });
    fs.cwd = '/home/eve';
    fs.homePath = '/home/eve';

    const result = executePipeline('ssh alice@megafirm-qlab', fs);
    expect(result.switchUser).toBe('alice');
    expect(result.exitCode).toBe(0);
  });
});

describe('formatPrompt for quantum lab', () => {
  test('shows eve@megafirm-qlab with eve home path', () => {
    const fs = { cwd: '/home/eve', currentUser: 'eve', homePath: '/home/eve' };
    const prompt = formatPrompt(fs);
    expect(prompt).toContain('eve@megafirm-qlab');
    expect(prompt).toContain('~');
  });

  test('shows alice@megafirm-qlab after user switch', () => {
    const fs = { cwd: '/home/alice', currentUser: 'alice', homePath: '/home/alice' };
    const prompt = formatPrompt(fs);
    expect(prompt).toContain('alice@megafirm-qlab');
    expect(prompt).toContain('~');
  });

  test('shows full path when not in home directory', () => {
    const fs = { cwd: '/var/data', currentUser: 'eve', homePath: '/home/eve' };
    const prompt = formatPrompt(fs);
    expect(prompt).toContain('/var/data');
  });

  test('replaces home prefix with ~ in subdirectories', () => {
    const fs = { cwd: '/home/eve/evidence', currentUser: 'eve', homePath: '/home/eve' };
    const prompt = formatPrompt(fs);
    expect(prompt).toContain('~/evidence');
    expect(prompt).not.toContain('/home/eve');
  });
});

describe('getCompletions', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        eve: {
          'welcome.txt': 'hi',
          'readme.md': 'docs',
          documents: {},
          projects: {},
        },
      },
    });
    fs.cwd = '/home/eve';
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
