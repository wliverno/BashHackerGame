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

    expect(level.subSteps[2].winCondition('cat todo.txt', 'Pray that the laser table is still aligned', {})).toBe(true);
    expect(level.subSteps[2].winCondition('cat todo.txt', 'nothing', {})).toBe(false);
  });

  test('level 4 win conditions check reading lab memos', () => {
    const level = levels[3];

    expect(level.subSteps[0].winCondition('cat /home/alice/notes/lab_memo.txt', 'Whoever keeps kicking the laser table', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat something', 'nothing relevant', {})).toBe(false);

    expect(level.subSteps[1].winCondition('cat /home/bob/notes/meeting_notes.txt', 'deliberately introducing interference', {})).toBe(true);
    expect(level.subSteps[1].winCondition('cat something', 'nothing', {})).toBe(false);

    expect(level.subSteps[2].winCondition('cat /home/alice/notes/*', 'kicking the laser table\nWHISTLING IN THE LAB', {})).toBe(true);
    expect(level.subSteps[2].winCondition('cat /home/alice/notes/lab_memo.txt /home/alice/notes/safety_notice.txt', 'kicking the laser table\nWHISTLING IN THE LAB', {})).toBe(true);
    expect(level.subSteps[2].winCondition('cat /home/alice/notes/lab_memo.txt', 'kicking the laser table', {})).toBe(false);
  });

  test('level 5 win conditions check navigation and echo > overwrite on mallory todo', () => {
    const level = levels[4];

    expect(level.subSteps[0].winCondition('cd /home/mallory', '', { cwd: '/home/mallory' })).toBe(true);
    expect(level.subSteps[0].winCondition('cd /home/mallory', '', { cwd: '/home/eve' })).toBe(false);

    expect(level.subSteps[1].winCondition('cat todo.txt', 'Get Eve to fix the laser table alignment', {})).toBe(true);
    expect(level.subSteps[1].winCondition('cat todo.txt', 'nothing here', {})).toBe(false);

    const overwritten = { readFile: () => 'Get Alice to align laser table' };
    const noAlice = { readFile: () => 'Fix everything' };
    expect(level.subSteps[2].winCondition('echo "Get Alice to align laser table" > todo.txt', '', overwritten)).toBe(true);
    expect(level.subSteps[2].winCondition('echo "Fix everything" > todo.txt', '', noAlice)).toBe(false);
    expect(level.subSteps[2].winCondition('echo "Alice laser" >> todo.txt', '', overwritten)).toBe(false);

    expect(level.subSteps[3].winCondition('cat todo.txt', 'Get Alice to align laser table', {})).toBe(true);
    expect(level.subSteps[3].winCondition('ls', '', {})).toBe(false);
    expect(level.subSteps[3].winCondition('cat todo.txt', 'no match here', {})).toBe(false);
  });

  test('level 6 win conditions check echo >> append on mallory todo', () => {
    const level = levels[5];

    const appended = { readFile: () => 'Get Alice to align laser table\nRecommend Eve for employee of the month' };
    const oneLine = { readFile: () => 'Recommend Eve' };
    expect(level.subSteps[0].winCondition('echo "Recommend Eve" >> todo.txt', '', appended)).toBe(true);
    expect(level.subSteps[0].winCondition('echo "x" > todo.txt', '', appended)).toBe(false);
    expect(level.subSteps[0].winCondition('echo "x" >> todo.txt', '', oneLine)).toBe(false);

    expect(level.subSteps[1].winCondition('cat todo.txt', 'line1\nline2', {})).toBe(true);
    expect(level.subSteps[1].winCondition('ls', '', {})).toBe(false);
  });

  test('level 7 win conditions check mkdir, cp, and ssh', () => {
    const level = levels[6];

    expect(level.subSteps[0].winCondition('mkdir evidence', '', { listDir: (p) => p === 'evidence' ? [] : null })).toBe(true);
    expect(level.subSteps[0].winCondition('mkdir evidence', '', { listDir: () => null })).toBe(false);

    expect(level.subSteps[1].winCondition('mkdir .ssh', '', { listDir: (p) => p === '/home/eve/.ssh' ? [] : null })).toBe(true);
    expect(level.subSteps[1].winCondition('mkdir .ssh', '', { listDir: () => null })).toBe(false);

    expect(level.subSteps[2].winCondition('cp /home/alice/.ssh/* .ssh/', '', { readFile: (p) => p === '/home/eve/.ssh/id_rsa' ? 'key' : null })).toBe(true);
    expect(level.subSteps[2].winCondition('cp /home/alice/.ssh/* .ssh/', '', { readFile: () => null })).toBe(false);

    expect(level.subSteps[3].winCondition('ssh alice@megafirm-qlab', '', {})).toBe(true);
    expect(level.subSteps[3].winCondition('ls', '', {})).toBe(false);
  });

  test('level 8 win conditions check chmod and script execution', () => {
    const level = levels[7];

    expect(level.subSteps[0].winCondition('cd research', '', { cwd: '/home/alice/research' })).toBe(true);
    expect(level.subSteps[0].winCondition('cd research', '', { cwd: '/home/alice' })).toBe(false);

    expect(level.subSteps[1].winCondition('cat README.txt', 'qubit data files need to be readable and writable', {})).toBe(true);
    expect(level.subSteps[1].winCondition('cat README.txt', 'nothing useful', {})).toBe(false);

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
    expect(level.subSteps[2].winCondition('chmod +x measure.sh', '', allPerms)).toBe(true);
    expect(level.subSteps[2].winCondition('chmod +x measure.sh', '', missingPerms)).toBe(false);

    expect(level.subSteps[3].winCondition('./measure.sh', 'Entanglement verified. Bell inequality violated.', {})).toBe(true);
    expect(level.subSteps[3].winCondition('./measure.sh', 'Permission denied', {})).toBe(false);
  });

  test('level 9 win conditions check mv, quit, and rm bash_history', () => {
    const level = levels[8];
    expect(level.subSteps.length).toBe(3);

    // substep 0: mv temp_results.txt to /home/eve/
    // source at /home/alice/temp_results.txt is gone (null), destination at /home/eve/ exists
    const moved = { readFile: (p) => p === '/home/eve/temp_results.txt' ? 'data' : null };
    const notMoved = { readFile: () => null };
    expect(level.subSteps[0].winCondition('mv temp_results.txt /home/eve/', '', moved)).toBe(true);
    expect(level.subSteps[0].winCondition('mv temp_results.txt /home/eve/', '', notMoved)).toBe(false);
    const copiedNotMoved = { readFile: () => 'data' }; // both paths return data
    expect(level.subSteps[0].winCondition('mv temp_results.txt /home/eve/', '', copiedNotMoved)).toBe(false);

    // substep 1: quit (currentUser back to eve)
    expect(level.subSteps[1].winCondition('quit', '', { currentUser: 'eve' })).toBe(true);
    expect(level.subSteps[1].winCondition('quit', '', { currentUser: 'alice' })).toBe(false);

    // substep 2: rm /home/alice/.bash_history
    const deleted = { readFile: () => null };
    const notDeleted = { readFile: (p) => p === '/home/alice/.bash_history' ? 'history' : null };
    expect(level.subSteps[2].winCondition('rm /home/alice/.bash_history', '', deleted)).toBe(true);
    expect(level.subSteps[2].winCondition('rm /home/alice/.bash_history', '', notDeleted)).toBe(false);
  });

  test('level 12 win conditions check grep output content', () => {
    const level = levels[11];
    expect(level.subSteps.length).toBe(2);

    // substep 0: access_proof.txt must exist and all lines contain 'mallory'
    const goodAccess = { readFile: (p) => p === '/home/eve/evidence/access_proof.txt' ? 'mallory accessed at 10:00\nmallory accessed at 11:00' : null };
    const emptyAccess = { readFile: () => null };
    const badAccess = { readFile: (p) => p === '/home/eve/evidence/access_proof.txt' ? 'mallory accessed\nalice accessed' : null };
    expect(level.subSteps[0].winCondition('grep mallory /var/log/access.log > evidence/access_proof.txt', '', goodAccess)).toBe(true);
    expect(level.subSteps[0].winCondition('grep mallory /var/log/access.log > evidence/access_proof.txt', '', emptyAccess)).toBe(false);
    expect(level.subSteps[0].winCondition('grep mallory /var/log/access.log > evidence/access_proof.txt', '', badAccess)).toBe(false);

    // substep 1: speed_anomalies.txt must exist and all lines contain '2.99E'
    const goodSpeed = { readFile: (p) => p === '/home/eve/evidence/speed_anomalies.txt' ? '2024,2.99E8\n2024,2.99E8' : null };
    const emptySpeed = { readFile: () => null };
    const badSpeed = { readFile: (p) => p === '/home/eve/evidence/speed_anomalies.txt' ? '2024,2.99E8\n2024,1.5E3' : null };
    expect(level.subSteps[1].winCondition('grep "2.99E" /var/data/sensor_readings.csv > evidence/speed_anomalies.txt', '', goodSpeed)).toBe(true);
    expect(level.subSteps[1].winCondition('grep "2.99E" /var/data/sensor_readings.csv > evidence/speed_anomalies.txt', '', emptySpeed)).toBe(false);
    expect(level.subSteps[1].winCondition('grep "2.99E" /var/data/sensor_readings.csv > evidence/speed_anomalies.txt', '', badSpeed)).toBe(false);
  });

});
