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
        eve: {
          'readme.txt': 'Welcome to the server',
          projects: {},
        },
      },
    };
    const fs = createFilesystem(tree);

    expect(fs.root.children.home).toBeDefined();
    expect(fs.root.children.home.type).toBe('dir');
    expect(fs.root.children.home.children.eve.children['readme.txt'].type).toBe('file');
    expect(fs.root.children.home.children.eve.children['readme.txt'].content).toBe('Welcome to the server');
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
        eve: {
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
    const node = fs.resolvePath('/home/eve');
    expect(node.type).toBe('dir');
    expect(node.name).toBe('eve');
  });

  test('resolves absolute path to file', () => {
    const node = fs.resolvePath('/home/eve/readme.txt');
    expect(node.type).toBe('file');
    expect(node.content).toBe('hello');
  });

  test('resolves root path', () => {
    const node = fs.resolvePath('/');
    expect(node).toBe(fs.root);
  });

  test('resolves relative path from cwd', () => {
    fs.cwd = '/home/eve';
    const node = fs.resolvePath('projects');
    expect(node.type).toBe('dir');
    expect(node.name).toBe('projects');
  });

  test('resolves .. to parent directory', () => {
    fs.cwd = '/home/eve/projects';
    const node = fs.resolvePath('..');
    expect(node.name).toBe('eve');
  });

  test('resolves . to current directory', () => {
    fs.cwd = '/home/eve';
    const node = fs.resolvePath('.');
    expect(node.name).toBe('eve');
  });

  test('resolves complex relative path', () => {
    fs.cwd = '/home/eve';
    const node = fs.resolvePath('../eve/projects/../readme.txt');
    expect(node.type).toBe('file');
    expect(node.content).toBe('hello');
  });

  test('returns null for non-existent path', () => {
    const node = fs.resolvePath('/does/not/exist');
    expect(node).toBeNull();
  });

  test('resolves ~ to home directory', () => {
    const node = fs.resolvePath('~');
    expect(node.name).toBe('eve');
  });
});

describe('getAbsolutePath', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: { eve: { projects: {} } },
    });
  });

  test('returns absolute path unchanged', () => {
    expect(fs.getAbsolutePath('/home/eve')).toBe('/home/eve');
  });

  test('converts relative path to absolute', () => {
    fs.cwd = '/home';
    expect(fs.getAbsolutePath('eve')).toBe('/home/eve');
  });

  test('resolves .. in path', () => {
    fs.cwd = '/home/eve/projects';
    expect(fs.getAbsolutePath('../..')).toBe('/home');
  });

  test('resolves ~ to home', () => {
    expect(fs.getAbsolutePath('~')).toBe('/home/eve');
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
        eve: {
          '.hidden': 'secret',
          'readme.txt': 'hello',
          projects: {},
        },
      },
    });
    fs.cwd = '/home/eve';
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
        eve: {
          'readme.txt': 'Hello, eve!',
        },
      },
    });
  });

  test('reads file content', () => {
    const content = fs.readFile('/home/eve/readme.txt');
    expect(content).toBe('Hello, eve!');
  });

  test('returns null for non-existent file', () => {
    const content = fs.readFile('/does/not/exist.txt');
    expect(content).toBeNull();
  });

  test('returns null for directory', () => {
    const content = fs.readFile('/home/eve');
    expect(content).toBeNull();
  });
});

describe('writeFile', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        eve: {
          'existing.txt': 'old content',
        },
      },
    });
    fs.cwd = '/home/eve';
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
    fs.writeFile('existing.txt', 'appended', { append: true });
    expect(fs.readFile('existing.txt')).toBe('old content\nappended');
  });

  test('creates file in nested path', () => {
    fs.writeFile('/home/eve/new.txt', 'content');
    expect(fs.readFile('/home/eve/new.txt')).toBe('content');
  });

  test('returns false for non-existent parent directory', () => {
    const result = fs.writeFile('/does/not/exist/file.txt', 'content');
    expect(result).toBe(false);
  });

  test('returns false when trying to write to directory', () => {
    const result = fs.writeFile('/home/eve', 'content');
    expect(result).toBe(false);
  });
});

describe('changeDir', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        eve: {
          projects: {},
          'file.txt': 'content',
        },
      },
    });
  });

  test('changes to absolute path', () => {
    const result = fs.changeDir('/home/eve');
    expect(result).toBe(true);
    expect(fs.cwd).toBe('/home/eve');
  });

  test('changes to relative path', () => {
    fs.cwd = '/home';
    fs.changeDir('eve');
    expect(fs.cwd).toBe('/home/eve');
  });

  test('changes to parent with ..', () => {
    fs.cwd = '/home/eve';
    fs.changeDir('..');
    expect(fs.cwd).toBe('/home');
  });

  test('changes to home with ~', () => {
    fs.changeDir('~');
    expect(fs.cwd).toBe('/home/eve');
  });

  test('returns false for non-existent directory', () => {
    const result = fs.changeDir('/does/not/exist');
    expect(result).toBe(false);
  });

  test('returns false for file path', () => {
    fs = createFilesystem({ home: { eve: { 'file.txt': 'content' } } });
    const result = fs.changeDir('/home/eve/file.txt');
    expect(result).toBe(false);
  });
});

describe('createDir', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: { eve: { projects: {} } },
    });
    fs.cwd = '/home/eve';
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
    expect(fs.createDir('/home/eve/newdir')).toBe(true);
    expect(fs.listDir('/home/eve/newdir')).toEqual([]);
  });
});

describe('deleteEntry', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: {
        eve: {
          'file.txt': 'content',
          empty: {},
          logs: { 'a.log': 'log1' },
        },
      },
    });
    fs.cwd = '/home/eve';
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
    expect(fs.deleteEntry('/home/eve')).toBe(false);
  });

  test('returns false when trying to delete root', () => {
    expect(fs.deleteEntry('/')).toBe(false);
  });
});

describe('permissions', () => {
  let fs;

  beforeEach(() => {
    fs = createFilesystem({
      home: { eve: { 'script.sh': '#!/bin/bash' } },
    });
    fs.cwd = '/home/eve';
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
