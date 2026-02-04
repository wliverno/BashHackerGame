function buildNode(name, value) {
  if (typeof value === 'string') {
    return { type: 'file', name, content: value };
  }
  const children = {};
  for (const [childName, childValue] of Object.entries(value)) {
    children[childName] = buildNode(childName, childValue);
  }
  return { type: 'dir', name, children };
}

export function createFilesystem(tree = {}, homePath = '/home/analyst') {
  const root = {
    type: 'dir',
    name: '/',
    children: {},
  };

  for (const [name, value] of Object.entries(tree)) {
    root.children[name] = buildNode(name, value);
  }

  const fs = {
    root,
    cwd: '/',
    _permissions: new Map(),
    homePath,

    resolvePath(path) {
      if (path === '~') {
        path = this.homePath;
      } else if (path.startsWith('~/')) {
        path = this.homePath + path.slice(1);
      }

      let parts;
      if (path.startsWith('/')) {
        parts = path.split('/').filter(p => p !== '');
      } else {
        const cwdParts = this.cwd.split('/').filter(p => p !== '');
        const relParts = path.split('/').filter(p => p !== '');
        parts = [...cwdParts, ...relParts];
      }

      const resolved = [];
      for (const part of parts) {
        if (part === '..') {
          resolved.pop();
        } else if (part !== '.') {
          resolved.push(part);
        }
      }

      let node = this.root;
      for (const part of resolved) {
        if (node.type !== 'dir' || !node.children[part]) {
          return null;
        }
        node = node.children[part];
      }
      return node;
    },

    getAbsolutePath(path) {
      if (path === '~') {
        path = this.homePath;
      } else if (path.startsWith('~/')) {
        path = this.homePath + path.slice(1);
      }

      let parts;
      if (path.startsWith('/')) {
        parts = path.split('/').filter(p => p !== '');
      } else {
        const cwdParts = this.cwd.split('/').filter(p => p !== '');
        const relParts = path.split('/').filter(p => p !== '');
        parts = [...cwdParts, ...relParts];
      }

      const resolved = [];
      for (const part of parts) {
        if (part === '..') {
          resolved.pop();
        } else if (part !== '.') {
          resolved.push(part);
        }
      }

      return '/' + resolved.join('/');
    },

    listDir(path, options = {}) {
      const node = this.resolvePath(path);
      if (!node || node.type !== 'dir') {
        return null;
      }

      const entries = [];
      for (const [name, child] of Object.entries(node.children)) {
        if (!options.showHidden && name.startsWith('.')) {
          continue;
        }
        entries.push({ name, type: child.type });
      }
      return entries.sort((a, b) => a.name.localeCompare(b.name));
    },

    readFile(path) {
      const node = this.resolvePath(path);
      if (!node || node.type !== 'file') {
        return null;
      }
      return node.content;
    },

    writeFile(path, content, options = {}) {
      const absPath = this.getAbsolutePath(path);
      const parts = absPath.split('/').filter(p => p !== '');
      const fileName = parts.pop();

      if (!fileName) return false;

      const parentPath = '/' + parts.join('/');
      const parent = this.resolvePath(parentPath || '/');

      if (!parent || parent.type !== 'dir') {
        return false;
      }

      const existing = parent.children[fileName];
      if (existing && existing.type === 'dir') {
        return false;
      }

      if (options.append && existing) {
        existing.content += content;
      } else {
        parent.children[fileName] = {
          type: 'file',
          name: fileName,
          content,
        };
      }
      return true;
    },

    changeDir(path) {
      const absPath = this.getAbsolutePath(path);
      const node = this.resolvePath(path);

      if (!node || node.type !== 'dir') {
        return false;
      }

      this.cwd = absPath;
      return true;
    },

    createDir(path) {
      if (this.resolvePath(path) !== null) return false;

      const absPath = this.getAbsolutePath(path);
      const parts = absPath.split('/').filter(p => p !== '');
      const dirName = parts.pop();
      if (!dirName) return false;

      const parentPath = '/' + parts.join('/');
      const parent = this.resolvePath(parentPath || '/');
      if (!parent || parent.type !== 'dir') return false;

      parent.children[dirName] = { type: 'dir', name: dirName, children: {} };
      return true;
    },

    deleteEntry(path) {
      const absPath = this.getAbsolutePath(path);
      if (absPath === '/') return false;
      if (absPath === this.cwd || this.cwd.startsWith(absPath + '/')) return false;

      const parts = absPath.split('/').filter(p => p !== '');
      const entryName = parts.pop();
      if (!entryName) return false;

      const parentPath = '/' + parts.join('/');
      const parent = this.resolvePath(parentPath || '/');
      if (!parent || parent.type !== 'dir' || !parent.children[entryName]) return false;

      delete parent.children[entryName];
      return true;
    },

    setPermission(path, mode) {
      if (this.resolvePath(path) === null) return false;
      const absPath = this.getAbsolutePath(path);
      if (!this._permissions.has(absPath)) this._permissions.set(absPath, new Set());
      const perms = this._permissions.get(absPath);
      const op = mode[0];
      const chars = mode.slice(1).split('');
      if (op === '+') chars.forEach(c => perms.add(c));
      else if (op === '-') chars.forEach(c => perms.delete(c));
      return true;
    },

    getPermissions(path) {
      const absPath = this.getAbsolutePath(path);
      return this._permissions.get(absPath) || new Set();
    },
  };

  return fs;
}
