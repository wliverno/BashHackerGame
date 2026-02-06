import { createFilesystem } from '../js/engine/filesystem.js';

describe('createFilesystem', () => {
  test('creates filesystem with root directory', () => {
    const fs = createFilesystem();
    expect(fs.root).toBeDefined();
    expect(fs.root.type).toBe('dir');
    expect(fs.root.name).toBe('/');
  });

  test('starts with cwd at root', () => {
    const fs = createFilesystem();
    expect(fs.cwd).toBe('/');
  });

  test('creates filesystem from nested object', () => {
    const tree = {
      home: {
        analyst: {
          'readme.txt': 'Welcome to the server',
          projects: {},
        },
      },
    };
    const fs = createFilesystem(tree);

    expect(fs.root.children.home).toBeDefined();
    expect(fs.root.children.home.type).toBe('dir');
    expect(fs.root.children.home.children.analyst.children['readme.txt'].type).toBe('file');
    expect(fs.root.children.home.children.analyst.children['readme.txt'].content).toBe('Welcome to the server');
  });

  test('empty object creates empty directory', () => {
    const tree = { emptydir: {} };
    const fs = createFilesystem(tree);

    expect(fs.root.children.emptydir.type).toBe('dir');
    expect(fs.root.children.emptydir.children).toEqual({});
  });
});

describe('resolvePath', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'readme.txt': 'hello',
          projects: {
            'notes.txt': 'secret',
          },
        },
      },
      var: {
        log: {},
      },
    });
  });

  test('resolves absolute path to directory', () => {
    const node = fs.resolvePath('/home/analyst');
    expect(node.type).toBe('dir');
    expect(node.name).toBe('analyst');
  });

  test('resolves absolute path to file', () => {
    const node = fs.resolvePath('/home/analyst/readme.txt');
    expect(node.type).toBe('file');
    expect(node.content).toBe('hello');
  });

  test('resolves root path', () => {
    const node = fs.resolvePath('/');
    expect(node).toBe(fs.root);
  });

  test('resolves relative path from cwd', () => {
    fs.cwd = '/home/analyst';
    const node = fs.resolvePath('projects');
    expect(node.type).toBe('dir');
    expect(node.name).toBe('projects');
  });

  test('resolves .. to parent directory', () => {
    fs.cwd = '/home/analyst/projects';
    const node = fs.resolvePath('..');
    expect(node.name).toBe('analyst');
  });

  test('resolves . to current directory', () => {
    fs.cwd = '/home/analyst';
    const node = fs.resolvePath('.');
    expect(node.name).toBe('analyst');
  });

  test('resolves complex relative path', () => {
    fs.cwd = '/home/analyst';
    const node = fs.resolvePath('../analyst/projects/../readme.txt');
    expect(node.type).toBe('file');
    expect(node.content).toBe('hello');
  });

  test('returns null for non-existent path', () => {
    const node = fs.resolvePath('/does/not/exist');
    expect(node).toBeNull();
  });

  test('resolves ~ to home directory', () => {
    const node = fs.resolvePath('~');
    expect(node.name).toBe('analyst');
  });
});

describe('getAbsolutePath', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: { analyst: { projects: {} } },
    });
  });

  test('returns absolute path unchanged', () => {
    expect(fs.getAbsolutePath('/home/analyst')).toBe('/home/analyst');
  });

  test('converts relative path to absolute', () => {
    fs.cwd = '/home';
    expect(fs.getAbsolutePath('analyst')).toBe('/home/analyst');
  });

  test('resolves .. in path', () => {
    fs.cwd = '/home/analyst/projects';
    expect(fs.getAbsolutePath('../..')).toBe('/home');
  });

  test('resolves ~ to home', () => {
    expect(fs.getAbsolutePath('~')).toBe('/home/analyst');
  });

  test('returns / for root', () => {
    expect(fs.getAbsolutePath('/')).toBe('/');
  });
});

describe('listDir', () => {
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

  test('lists visible entries in directory', () => {
    const entries = fs.listDir('.');
    const names = entries.map(e => e.name);
    expect(names).toContain('readme.txt');
    expect(names).toContain('projects');
    expect(names).not.toContain('.hidden');
  });

  test('lists hidden entries with showHidden flag', () => {
    const entries = fs.listDir('.', { showHidden: true });
    const names = entries.map(e => e.name);
    expect(names).toContain('.hidden');
  });

  test('returns entry type', () => {
    const entries = fs.listDir('.');
    const readme = entries.find(e => e.name === 'readme.txt');
    const projects = entries.find(e => e.name === 'projects');
    expect(readme.type).toBe('file');
    expect(projects.type).toBe('dir');
  });

  test('returns null for non-existent path', () => {
    const entries = fs.listDir('/does/not/exist');
    expect(entries).toBeNull();
  });

  test('returns null for file path', () => {
    const entries = fs.listDir('readme.txt');
    expect(entries).toBeNull();
  });
});

describe('readFile', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'readme.txt': 'Hello, analyst!',
        },
      },
    });
  });

  test('reads file content', () => {
    const content = fs.readFile('/home/analyst/readme.txt');
    expect(content).toBe('Hello, analyst!');
  });

  test('returns null for non-existent file', () => {
    const content = fs.readFile('/does/not/exist.txt');
    expect(content).toBeNull();
  });

  test('returns null for directory', () => {
    const content = fs.readFile('/home/analyst');
    expect(content).toBeNull();
  });
});

describe('writeFile', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'existing.txt': 'old content',
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('creates new file', () => {
    const result = fs.writeFile('new.txt', 'new content');
    expect(result).toBe(true);
    expect(fs.readFile('new.txt')).toBe('new content');
  });

  test('overwrites existing file', () => {
    fs.writeFile('existing.txt', 'new content');
    expect(fs.readFile('existing.txt')).toBe('new content');
  });

  test('appends to file with append flag', () => {
    fs.writeFile('existing.txt', ' appended', { append: true });
    expect(fs.readFile('existing.txt')).toBe('old content appended');
  });

  test('creates file in nested path', () => {
    fs.writeFile('/home/analyst/new.txt', 'content');
    expect(fs.readFile('/home/analyst/new.txt')).toBe('content');
  });

  test('returns false for non-existent parent directory', () => {
    const result = fs.writeFile('/does/not/exist/file.txt', 'content');
    expect(result).toBe(false);
  });

  test('returns false when trying to write to directory', () => {
    const result = fs.writeFile('/home/analyst', 'content');
    expect(result).toBe(false);
  });
});

describe('changeDir', () => {
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
  });

  test('changes to absolute path', () => {
    const result = fs.changeDir('/home/analyst');
    expect(result).toBe(true);
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('changes to relative path', () => {
    fs.cwd = '/home';
    fs.changeDir('analyst');
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('changes to parent with ..', () => {
    fs.cwd = '/home/analyst';
    fs.changeDir('..');
    expect(fs.cwd).toBe('/home');
  });

  test('changes to home with ~', () => {
    fs.changeDir('~');
    expect(fs.cwd).toBe('/home/analyst');
  });

  test('returns false for non-existent directory', () => {
    const result = fs.changeDir('/does/not/exist');
    expect(result).toBe(false);
  });

  test('returns false for file path', () => {
    fs = createFilesystem({ home: { analyst: { 'file.txt': 'content' } } });
    const result = fs.changeDir('/home/analyst/file.txt');
    expect(result).toBe(false);
  });
});

describe('createDir', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: { analyst: { projects: {} } },
    });
    fs.cwd = '/home/analyst';
  });

  test('creates a new directory', () => {
    expect(fs.createDir('newdir')).toBe(true);
    expect(fs.listDir('newdir')).toEqual([]);
  });

  test('returns false if path already exists', () => {
    expect(fs.createDir('projects')).toBe(false);
  });

  test('returns false if parent does not exist', () => {
    expect(fs.createDir('nonexistent/child')).toBe(false);
  });

  test('creates directory with absolute path', () => {
    expect(fs.createDir('/home/analyst/newdir')).toBe(true);
    expect(fs.listDir('/home/analyst/newdir')).toEqual([]);
  });
});

describe('deleteEntry', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        analyst: {
          'file.txt': 'content',
          empty: {},
          logs: { 'a.log': 'log1' },
        },
      },
    });
    fs.cwd = '/home/analyst';
  });

  test('deletes a file', () => {
    expect(fs.deleteEntry('file.txt')).toBe(true);
    expect(fs.readFile('file.txt')).toBeNull();
  });

  test('deletes an empty directory', () => {
    expect(fs.deleteEntry('empty')).toBe(true);
    expect(fs.listDir('empty')).toBeNull();
  });

  test('deletes a directory with contents', () => {
    expect(fs.deleteEntry('logs')).toBe(true);
    expect(fs.listDir('logs')).toBeNull();
  });

  test('returns false for non-existent path', () => {
    expect(fs.deleteEntry('nope')).toBe(false);
  });

  test('returns false when trying to delete cwd', () => {
    expect(fs.deleteEntry('/home/analyst')).toBe(false);
  });

  test('returns false when trying to delete root', () => {
    expect(fs.deleteEntry('/')).toBe(false);
  });
});

describe('permissions', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: { analyst: { 'script.sh': '#!/bin/bash' } },
    });
    fs.cwd = '/home/analyst';
  });

  test('default permissions are empty', () => {
    expect(fs.getPermissions('script.sh').has('x')).toBe(false);
  });

  test('setPermission adds permissions', () => {
    fs.setPermission('script.sh', '+x');
    expect(fs.getPermissions('script.sh').has('x')).toBe(true);
  });

  test('setPermission removes permissions', () => {
    fs.setPermission('script.sh', '+x');
    fs.setPermission('script.sh', '-x');
    expect(fs.getPermissions('script.sh').has('x')).toBe(false);
  });

  test('returns false for non-existent file', () => {
    expect(fs.setPermission('nope.sh', '+x')).toBe(false);
  });
});
