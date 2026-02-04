import { levels } from '../js/levels.js';

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

  test('each level has at least 3 substeps', () => {
    for (const level of levels) {
      expect(level.subSteps.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('level 1 win conditions fire correctly', () => {
    const level = levels[0];
    const mockFs = { cwd: '/home/analyst' };

    // Step 0: pwd
    expect(level.subSteps[0].winCondition('pwd', '/home/analyst', mockFs)).toBe(true);
    expect(level.subSteps[0].winCondition('ls', '', mockFs)).toBe(false);

    // Step 1: ls
    expect(level.subSteps[1].winCondition('ls', 'readme.txt', mockFs)).toBe(true);
    expect(level.subSteps[1].winCondition('pwd', '', mockFs)).toBe(false);

    // Step 2: cat welcome.txt
    expect(level.subSteps[2].winCondition('cat welcome.txt', 'Welcome...', mockFs)).toBe(true);
    expect(level.subSteps[2].winCondition('cat memo.txt', 'Team...', mockFs)).toBe(false);
  });

  test('level 2 win conditions check cwd', () => {
    const level = levels[1];

    expect(level.subSteps[0].winCondition('cd internal', '', { cwd: '/home/analyst/internal' })).toBe(true);
    expect(level.subSteps[0].winCondition('cd internal', '', { cwd: '/home/analyst' })).toBe(false);

    expect(level.subSteps[2].winCondition('cd projects', '', { cwd: '/home/analyst/internal/projects' })).toBe(true);
  });

  test('level 3 win conditions check cwd and output', () => {
    const level = levels[2];

    expect(level.subSteps[0].winCondition('cd ..', '', { cwd: '/home/analyst/internal' })).toBe(true);
    expect(level.subSteps[1].winCondition('cd ..', '', { cwd: '/home/analyst' })).toBe(true);
    expect(level.subSteps[2].winCondition('cat important.txt', 'You found the important file!', {})).toBe(true);
    expect(level.subSteps[2].winCondition('cat readme.txt', 'Internal directory', {})).toBe(false);
  });

  test('level 4 win conditions check cat output and multi-file command', () => {
    const level = levels[3];

    // Step 0: output must mention Helios
    expect(level.subSteps[0].winCondition('cat reports/budget.txt', 'Project Helios: $2.4M', {})).toBe(true);
    expect(level.subSteps[0].winCondition('cat reports/budget.txt', 'Nothing here', {})).toBe(false);

    // Step 1: output must mention Martinez
    expect(level.subSteps[1].winCondition('cat reports/staffing.txt', 'J. Martinez hired', {})).toBe(true);
    expect(level.subSteps[1].winCondition('cat reports/staffing.txt', 'No one listed', {})).toBe(false);

    // Step 2: command must reference both files
    expect(level.subSteps[2].winCondition('cat reports/budget.txt reports/staffing.txt', 'combined', {})).toBe(true);
    expect(level.subSteps[2].winCondition('cat reports/budget.txt', 'only one', {})).toBe(false);
  });


  test('level 5 win conditions check file creation and overwrite via >', () => {
    const level = levels[4];
    const hasFile = { readFile: () => 'some content' };
    const noFile = { readFile: () => null };

    // Step 0: notes.txt must exist in filesystem after command
    expect(level.subSteps[0].winCondition('echo "hi" > notes.txt', '', hasFile)).toBe(true);
    expect(level.subSteps[0].winCondition('echo "hi" > notes.txt', '', noFile)).toBe(false);

    // Step 1: must cat notes.txt and get non-empty output
    expect(level.subSteps[1].winCondition('cat notes.txt', 'some content', {})).toBe(true);
    expect(level.subSteps[1].winCondition('ls', 'notes.txt', {})).toBe(false);
    expect(level.subSteps[1].winCondition('cat notes.txt', '', {})).toBe(false);

    // Step 2: must use > (not >>) targeting notes.txt
    expect(level.subSteps[2].winCondition('echo "new intel" > notes.txt', '', {})).toBe(true);
    expect(level.subSteps[2].winCondition('echo "new intel" >> notes.txt', '', {})).toBe(false);
    expect(level.subSteps[2].winCondition('echo "new intel" > other.txt', '', {})).toBe(false);
  });

});
