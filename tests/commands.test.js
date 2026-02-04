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

describe('mkdir', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({ home: { analyst: {} } });
    fs.cwd = '/home/analyst';
  });

  test('creates a directory', () => {
    const result = commands.mkdir(['newdir'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.listDir('newdir')).toEqual([]);
  });

  test('returns error for existing path', () => {
    fs.createDir('existing');
    const result = commands.mkdir(['existing'], '', fs);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('existing');
  });

  test('returns error with no args', () => {
    const result = commands.mkdir([], '', fs);
    expect(result.exitCode).toBe(1);
  });
});

describe('cp', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'source.txt': 'hello',
          dest: {},
          srcdir: { 'inner.txt': 'nested' },
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('copies file to new name', () => {
    const result = commands.cp(['source.txt', 'copy.txt'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.readFile('copy.txt')).toBe('hello');
  });

  test('copies file into existing directory', () => {
    const result = commands.cp(['source.txt', 'dest'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.readFile('dest/source.txt')).toBe('hello');
  });

  test('returns error without -r for directory source', () => {
    const result = commands.cp(['srcdir', 'dest'], '', fs);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('-r');
  });

  test('copies directory recursively with -r', () => {
    const result = commands.cp(['-r', 'srcdir', 'srcdir_copy'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.readFile('srcdir_copy/inner.txt')).toBe('nested');
  });

  test('returns error for non-existent source', () => {
    const result = commands.cp(['nope.txt', 'dest'], '', fs);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });
});

describe('mv', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'file.txt': 'content',
          target: {},
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('renames a file', () => {
    const result = commands.mv(['file.txt', 'renamed.txt'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.readFile('renamed.txt')).toBe('content');
    expect(fs.readFile('file.txt')).toBeNull();
  });

  test('moves file into existing directory', () => {
    const result = commands.mv(['file.txt', 'target'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.readFile('target/file.txt')).toBe('content');
    expect(fs.readFile('file.txt')).toBeNull();
  });

  test('returns error for non-existent source', () => {
    const result = commands.mv(['nope.txt', 'target'], '', fs);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });
});

describe('rm', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'file.txt': 'content',
          mydir: { 'inner.txt': 'nested' },
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('removes a file', () => {
    const result = commands.rm(['file.txt'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.readFile('file.txt')).toBeNull();
  });

  test('returns error for directory without -r', () => {
    const result = commands.rm(['mydir'], '', fs);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Is a directory');
  });

  test('removes directory with -r', () => {
    const result = commands.rm(['-r', 'mydir'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.listDir('mydir')).toBeNull();
  });

  test('-f silences error for non-existent file', () => {
    const result = commands.rm(['-f', 'nope.txt'], '', fs);
    expect(result.exitCode).toBe(0);
  });
});

describe('chmod', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: { analyst: { 'script.sh': 'echo hi' } },
    });
    fs.cwd = '/home/analyst';
  });

  test('sets executable permission', () => {
    const result = commands.chmod(['+x', 'script.sh'], '', fs);
    expect(result.exitCode).toBe(0);
    expect(fs.getPermissions('script.sh').has('x')).toBe(true);
  });

  test('returns error for non-existent file', () => {
    const result = commands.chmod(['+x', 'nope.sh'], '', fs);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No such file or directory');
  });

  test('returns error with no args', () => {
    const result = commands.chmod([], '', fs);
    expect(result.exitCode).toBe(1);
  });
});
