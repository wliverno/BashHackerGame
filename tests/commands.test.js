import { commands } from '../js/commands.js';
import { createFilesystem } from '../js/filesystem.js';

describe('pwd', () => {
  test('returns current working directory', () => {
    const fs = createFilesystem({ home: { analyst: {} } });
    fs.cwd = '/home/analyst';
    const result = commands.pwd([], '', fs);
    expect(result.stdout).toBe('/home/analyst');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
  });

  test('returns root when at root', () => {
    const fs = createFilesystem({});
    fs.cwd = '/';
    expect(commands.pwd([], '', fs).stdout).toBe('/');
  });
});

describe('ls', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          '.hidden': 'secret',
          'readme.txt': 'hello',
          projects: {},
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('lists current directory', () => {
    const result = commands.ls([], '', fs);
    expect(result.stdout).toContain('readme.txt');
    expect(result.stdout).toContain('projects');
    expect(result.stdout).not.toContain('.hidden');
    expect(result.exitCode).toBe(0);
  });

  test('lists specified directory', () => {
    fs.cwd = '/';
    const result = commands.ls(['/home/analyst'], '', fs);
    expect(result.stdout).toContain('readme.txt');
  });

  test('shows hidden files with -a flag', () => {
    const result = commands.ls(['-a'], '', fs);
    expect(result.stdout).toContain('.hidden');
  });

  test('returns error for non-existent path', () => {
    const result = commands.ls(['/does/not/exist'], '', fs);
    expect(result.stderr).toContain('No such file or directory');
    expect(result.exitCode).toBe(1);
  });

  test('shows file name for file argument', () => {
    const result = commands.ls(['readme.txt'], '', fs);
    expect(result.stdout).toBe('readme.txt');
  });
});

describe('cd', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          projects: {},
          'file.txt': 'content',
        },
      },
    });
    fs.cwd = '/';
  });

  test('changes to specified directory', () => {
    const result = commands.cd(['/home/analyst'], '', fs);
    expect(fs.cwd).toBe('/home/analyst');
    expect(result.stdout).toBe('');
    expect(result.exitCode).toBe(0);
  });

  test('changes to relative directory', () => {
    fs.cwd = '/home';
    commands.cd(['analyst'], '', fs);
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('changes to parent with ..', () => {
    fs.cwd = '/home/analyst';
    commands.cd(['..'], '', fs);
    expect(fs.cwd).toBe('/home');
  });

  test('changes to home with no args', () => {
    commands.cd([], '', fs);
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('changes to home with ~', () => {
    commands.cd(['~'], '', fs);
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('returns error for non-existent directory', () => {
    const result = commands.cd(['/does/not/exist'], '', fs);
    expect(result.stderr).toContain('No such file or directory');
    expect(result.exitCode).toBe(1);
  });

  test('returns error for file path', () => {
    const result = commands.cd(['/home/analyst/file.txt'], '', fs);
    expect(result.stderr).toContain('Not a directory');
    expect(result.exitCode).toBe(1);
  });
});

describe('cat', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'file1.txt': 'Hello',
          'file2.txt': 'World',
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('reads single file', () => {
    const result = commands.cat(['file1.txt'], '', fs);
    expect(result.stdout).toBe('Hello');
    expect(result.exitCode).toBe(0);
  });

  test('reads multiple files', () => {
    const result = commands.cat(['file1.txt', 'file2.txt'], '', fs);
    expect(result.stdout).toBe('Hello\nWorld');
  });

  test('returns error for non-existent file', () => {
    const result = commands.cat(['missing.txt'], '', fs);
    expect(result.stderr).toContain('No such file or directory');
    expect(result.exitCode).toBe(1);
  });

  test('returns error for directory', () => {
    const result = commands.cat(['/home'], '', fs);
    expect(result.stderr).toContain('Is a directory');
    expect(result.exitCode).toBe(1);
  });

  test('passes through stdin when no args', () => {
    const result = commands.cat([], 'piped input', fs);
    expect(result.stdout).toBe('piped input');
  });
});

describe('echo', () => {
  test('outputs arguments joined by space', () => {
    const fs = createFilesystem({});
    expect(commands.echo(['hello', 'world'], '', fs).stdout).toBe('hello world');
  });

  test('outputs empty string for no args', () => {
    const fs = createFilesystem({});
    expect(commands.echo([], '', fs).stdout).toBe('');
  });

  test('preserves quoted argument as single token', () => {
    const fs = createFilesystem({});
    expect(commands.echo(['hello world'], '', fs).stdout).toBe('hello world');
  });
});

describe('help', () => {
  test('lists available commands', () => {
    const fs = createFilesystem({});
    const result = commands.help([], '', fs);
    expect(result.stdout).toContain('ls');
    expect(result.stdout).toContain('cd');
    expect(result.stdout).toContain('pwd');
    expect(result.stdout).toContain('cat');
    expect(result.exitCode).toBe(0);
  });
});

describe('clear', () => {
  test('returns clear signal', () => {
    const fs = createFilesystem({});
    const result = commands.clear([], '', fs);
    expect(result.clear).toBe(true);
    expect(result.exitCode).toBe(0);
  });
});
