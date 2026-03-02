import { levels } from '../js/gameplay/levels.js';

describe('levels', () => {
  test('has at least 3 levels', () => {
    expect(levels.length).toBeGreaterThanOrEqual(3);
  });

  test('each level has required properties', () => {
    for (const level of levels) {
      expect(level.id).toBeDefined();
      expect(level.title).toBeDefined();
      expect(typeof level.title).toBe('string');
      expect(level.story).toBeDefined();
      expect(typeof level.story).toBe('string');
      expect(level.filesystem).toBeDefined();
      expect(typeof level.filesystem).toBe('object');
      expect(level.startDir).toBeDefined();
      expect(typeof level.startDir).toBe('string');
      expect(level.subSteps).toBeDefined();
      expect(level.subSteps.length).toBeGreaterThan(0);
      expect(level.chapter).toBeDefined();
      expect(typeof level.chapter).toBe('number');
    }
  });

  test('each substep has objective, hints, and winCondition', () => {
    for (const level of levels) {
      for (const step of level.subSteps) {
        expect(step.objective).toBeDefined();
        expect(typeof step.objective).toBe('string');
        expect(step.hints).toBeDefined();
        expect(Array.isArray(step.hints)).toBe(true);
        expect(step.hints.length).toBeGreaterThan(0);
        expect(step.winCondition).toBeDefined();
        expect(typeof step.winCondition).toBe('function');
      }
    }
  });

  test('level IDs are sequential starting at 1', () => {
    levels.forEach((level, index) => {
      expect(level.id).toBe(index + 1);
    });
  });

  test('each level has at least 2 substeps', () => {
    for (const level of levels) {
      expect(level.subSteps.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('level 1 win conditions fire correctly', () => {
    const level = levels[0];
    const mockFs = { cwd: '/home/eve' };

    expect(level.subSteps[0].winCondition('pwd', '/home/eve', mockFs)).toBe(true);
    expect(level.subSteps[0].winCondition('ls', '', mockFs)).toBe(false);

    expect(level.subSteps[1].winCondition('ls', 'welcome.txt  todo.txt', mockFs)).toBe(true);
    expect(level.subSteps[1].winCondition('pwd', '', mockFs)).toBe(false);

    expect(level.subSteps[2].winCondition('cat welcome.txt', 'Welcome...', mockFs)).toBe(true);
    expect(level.subSteps[2].winCondition('cat todo.txt', 'stuff', mockFs)).toBe(false);
  });

  test('level 2 win conditions check cwd', () => {
    const level = levels[1];

    expect(level.subSteps[0].winCondition('cd ..', '', { cwd: '/home' })).toBe(true);
    expect(level.subSteps[0].winCondition('cd ..', '', { cwd: '/home/eve' })).toBe(false);

    expect(level.subSteps[1].winCondition('ls', 'alice bob eve mallory', { cwd: '/home' })).toBe(true);
    expect(level.subSteps[1].winCondition('ls', 'alice bob', { cwd: '/home/eve' })).toBe(false);

    expect(level.subSteps[2].winCondition('cd alice', '', { cwd: '/home/alice' })).toBe(true);
    expect(level.subSteps[2].winCondition('cd bob', '', { cwd: '/home/bob' })).toBe(false);
  });

  test('level 3 win conditions check navigation and reading', () => {
    const level = levels[2];

    expect(level.subSteps[0].winCondition('ls', 'notes research .ssh', { cwd: '/home/alice' })).toBe(true);
    expect(level.subSteps[0].winCondition('ls', 'stuff', { cwd: '/home/eve' })).toBe(false);

    expect(level.subSteps[1].winCondition('cd /home/eve', '', { cwd: '/home/eve' })).toBe(true);
    expect(level.subSteps[1].winCondition('cd ..', '', { cwd: '/home' })).toBe(false);

    expect(level.subSteps[2].winCondition('cat todo.txt', '1. Review access logs for anomalies', {})).toBe(true);
    expect(level.subSteps[2].winCondition('cat todo.txt', 'nothing', {})).toBe(false);
  });

  test('level 4 win conditions check reading lab memos', () => {
    const level = levels[3];

    expect(level.subSteps[0].winCondition('cat /home/alice/notes/lab_memo.txt', 'Whoever keeps kicking the laser table', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat something', 'nothing relevant', {})).toBe(false);

    expect(level.subSteps[1].winCondition('cat /home/bob/notes/meeting_notes.txt', 'deliberately introducing interference', {})).toBe(true);
    expect(level.subSteps[1].winCondition('cat something', 'nothing', {})).toBe(false);

    expect(level.subSteps[2].winCondition('cat /home/alice/notes/lab_memo.txt /home/alice/notes/safety_notice.txt', 'combined', {})).toBe(true);
    expect(level.subSteps[2].winCondition('cat /home/alice/notes/lab_memo.txt', 'only one', {})).toBe(false);
  });

  test('level 5 win conditions check echo > overwrite', () => {
    const level = levels[4];

    expect(level.subSteps[0].winCondition('cat tasks.txt', '1. Fix the laser table alignment (AGAIN)', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat tasks.txt', 'nothing', {})).toBe(false);

    const overwritten = { readFile: () => 'Tell Alice to fix laser table' };
    const original = { readFile: () => '1. Fix the laser table alignment (AGAIN)\n2. Recalibrate' };
    expect(level.subSteps[1].winCondition('echo "Tell Alice" > tasks.txt', '', overwritten)).toBe(true);
    expect(level.subSteps[1].winCondition('echo "Tell Alice" > tasks.txt', '', original)).toBe(false);
    expect(level.subSteps[1].winCondition('echo "Tell Alice" >> tasks.txt', '', overwritten)).toBe(false);

    expect(level.subSteps[2].winCondition('cat tasks.txt', 'Tell Alice to fix laser table', {})).toBe(true);
    expect(level.subSteps[2].winCondition('ls', '', {})).toBe(false);
    expect(level.subSteps[2].winCondition('cat tasks.txt', '', {})).toBe(false);
  });

  test('level 6 win conditions check echo >> append', () => {
    const level = levels[5];

    expect(level.subSteps[0].winCondition('cat tasks.txt', 'Tell Alice to fix laser table', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat tasks.txt', 'nothing', {})).toBe(false);

    const appended = { readFile: () => 'Tell Alice to fix laser table\nRecommend Eve' };
    const overwritten = { readFile: () => 'Recommend Eve' };
    expect(level.subSteps[1].winCondition('echo "Recommend Eve" >> tasks.txt', '', appended)).toBe(true);
    expect(level.subSteps[1].winCondition('echo "x" > tasks.txt', '', appended)).toBe(false);
    expect(level.subSteps[1].winCondition('echo "x" >> tasks.txt', '', overwritten)).toBe(false);

    expect(level.subSteps[2].winCondition('cat tasks.txt', 'stuff', {})).toBe(true);
    expect(level.subSteps[2].winCondition('ls', '', {})).toBe(false);
  });

  test('level 7 win conditions check mkdir, cp, and ssh', () => {
    const level = levels[6];

    expect(level.subSteps[0].winCondition('mkdir evidence', '', { listDir: (p) => p === 'evidence' ? [] : null })).toBe(true);
    expect(level.subSteps[0].winCondition('mkdir evidence', '', { listDir: () => null })).toBe(false);

    expect(level.subSteps[1].winCondition('cp -r /home/alice/.ssh /home/eve/.ssh', '', { readFile: (p) => p === '/home/eve/.ssh/id_rsa' ? 'key' : null })).toBe(true);
    expect(level.subSteps[1].winCondition('cp -r /home/alice/.ssh /home/eve/.ssh', '', { readFile: () => null })).toBe(false);

    expect(level.subSteps[2].winCondition('ssh alice@megafirm-qlab', '', {})).toBe(true);
    expect(level.subSteps[2].winCondition('ls', '', {})).toBe(false);
  });

  test('level 8 win conditions check chmod and script execution', () => {
    const level = levels[7];

    expect(level.subSteps[0].winCondition('cat README.txt', 'Use: chmod +rw alice.qubit bob.qubit', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat README.txt', 'nothing useful', {})).toBe(false);

    const allPerms = {
      getPermissions: (path) => {
        if (path === 'alice.qubit') return new Set(['r', 'w']);
        if (path === 'bob.qubit') return new Set(['r', 'w']);
        if (path === 'measure.sh') return new Set(['x']);
        return new Set();
      },
    };
    const missingPerms = {
      getPermissions: () => new Set(),
    };
    expect(level.subSteps[1].winCondition('chmod +x measure.sh', '', allPerms)).toBe(true);
    expect(level.subSteps[1].winCondition('chmod +x measure.sh', '', missingPerms)).toBe(false);

    expect(level.subSteps[2].winCondition('./measure.sh', 'Entanglement verified. Bell inequality violated.', {})).toBe(true);
    expect(level.subSteps[2].winCondition('./measure.sh', 'Permission denied', {})).toBe(false);
  });

  test('level 9 win conditions check mv, rm, and cd', () => {
    const level = levels[8];

    const moved = { readFile: (p) => p === '/home/eve/evidence/temp_results.txt' ? 'data' : null };
    const notMoved = { readFile: (p) => p === 'temp_results.txt' ? 'data' : null };
    expect(level.subSteps[0].winCondition('mv temp_results.txt /home/eve/evidence/', '', moved)).toBe(true);
    expect(level.subSteps[0].winCondition('mv temp_results.txt /home/eve/evidence/', '', notMoved)).toBe(false);

    expect(level.subSteps[1].winCondition('rm -r old_logs', '', { listDir: () => null })).toBe(true);
    expect(level.subSteps[1].winCondition('rm -r old_logs', '', { listDir: () => [] })).toBe(false);

    expect(level.subSteps[2].winCondition('cd /home/mallory', '', { cwd: '/home/mallory' })).toBe(true);
    expect(level.subSteps[2].winCondition('cd /home/mallory', '', { cwd: '/home/eve' })).toBe(false);
  });

});
