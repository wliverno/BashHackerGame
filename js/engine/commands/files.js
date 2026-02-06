function copyTree(fs, srcPath, destPath) {
  const content = fs.readFile(srcPath);
  if (content !== null) {
    return fs.writeFile(destPath, content);
  }
  const entries = fs.listDir(srcPath);
  if (!entries) return false;
  if (!fs.createDir(destPath)) return false;
  for (const entry of entries) {
    if (!copyTree(fs, srcPath + '/' + entry.name, destPath + '/' + entry.name)) return false;
  }
  return true;
}

export const commands = {
  cat(args, stdin, fs) {
    if (args.length === 0) {
      return { stdout: stdin, stderr: '', exitCode: 0 };
    }

    const outputs = [];

    for (const path of args) {
      const node = fs.resolvePath(path);

      if (!node) {
        return {
          stdout: '',
          stderr: `cat: ${path}: No such file or directory`,
          exitCode: 1,
        };
      }

      if (node.type === 'dir') {
        return {
          stdout: '',
          stderr: `cat: ${path}: Is a directory`,
          exitCode: 1,
        };
      }

      outputs.push(node.content);
    }

    return {
      stdout: outputs.join('\n'),
      stderr: '',
      exitCode: 0,
    };
  },

  echo(args, stdin, fs) {
    return {
      stdout: args.join(' '),
      stderr: '',
      exitCode: 0,
    };
  },

  mkdir(args, stdin, fs) {
    if (args.length === 0) {
      return { stdout: '', stderr: 'mkdir: missing operand', exitCode: 1 };
    }
    for (const dir of args) {
      if (!fs.createDir(dir)) {
        return { stdout: '', stderr: `mkdir: cannot create directory '${dir}'`, exitCode: 1 };
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },

  cp(args, stdin, fs) {
    if (args.length < 2) {
      return { stdout: '', stderr: 'cp: missing operand', exitCode: 1 };
    }
    const flags = args.filter(a => a.startsWith('-')).join('').replace(/-/g, '');
    const recursive = flags.includes('r');
    const paths = args.filter(a => !a.startsWith('-'));
    if (paths.length < 2) {
      return { stdout: '', stderr: 'cp: missing operand', exitCode: 1 };
    }

    const dest = paths[paths.length - 1];
    const sources = paths.slice(0, -1);
    const destNode = fs.resolvePath(dest.replace(/\/$/, ''));
    const destIsDir = destNode && destNode.type === 'dir';

    for (const src of sources) {
      const srcNode = fs.resolvePath(src);
      if (!srcNode) {
        return { stdout: '', stderr: `cp: cannot stat '${src}': No such file or directory`, exitCode: 1 };
      }

      const targetPath = destIsDir
        ? dest.replace(/\/$/, '') + '/' + srcNode.name
        : dest;

      if (srcNode.type === 'dir') {
        if (!recursive) {
          return { stdout: '', stderr: `cp: -r not specified; omitting directory '${src}'`, exitCode: 1 };
        }
        if (!copyTree(fs, src, targetPath)) {
          return { stdout: '', stderr: `cp: cannot copy '${src}'`, exitCode: 1 };
        }
      } else {
        if (!fs.writeFile(targetPath, srcNode.content)) {
          return { stdout: '', stderr: `cp: cannot create '${targetPath}'`, exitCode: 1 };
        }
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },

  mv(args, stdin, fs) {
    if (args.length < 2) {
      return { stdout: '', stderr: 'mv: missing operand', exitCode: 1 };
    }

    const paths = args.filter(a => !a.startsWith('-'));
    if (paths.length < 2) {
      return { stdout: '', stderr: 'mv: missing operand', exitCode: 1 };
    }

    const dest = paths[paths.length - 1];
    const sources = paths.slice(0, -1);
    const destNode = fs.resolvePath(dest.replace(/\/$/, ''));
    const destIsDir = destNode && destNode.type === 'dir';

    for (const src of sources) {
      const srcNode = fs.resolvePath(src);
      if (!srcNode) {
        return { stdout: '', stderr: `mv: cannot stat '${src}': No such file or directory`, exitCode: 1 };
      }

      const targetPath = destIsDir
        ? dest.replace(/\/$/, '') + '/' + srcNode.name
        : dest;

      if (srcNode.type === 'dir') {
        if (!copyTree(fs, src, targetPath)) {
          return { stdout: '', stderr: `mv: cannot move '${src}'`, exitCode: 1 };
        }
      } else {
        if (!fs.writeFile(targetPath, srcNode.content)) {
          return { stdout: '', stderr: `mv: cannot move '${src}'`, exitCode: 1 };
        }
      }

      const srcPerms = fs.getPermissions(src);
      if (srcPerms.size > 0) {
        for (const p of srcPerms) {
          fs.setPermission(targetPath, '+' + p);
        }
      }

      if (!fs.deleteEntry(src)) {
        return { stdout: '', stderr: `mv: cannot remove '${src}'`, exitCode: 1 };
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },

  rm(args, stdin, fs) {
    if (args.length === 0) {
      return { stdout: '', stderr: 'rm: missing operand', exitCode: 1 };
    }
    const flags = args.filter(a => a.startsWith('-')).join('').replace(/-/g, '');
    const recursive = flags.includes('r');
    const force = flags.includes('f');
    const paths = args.filter(a => !a.startsWith('-'));

    if (paths.length === 0) {
      return { stdout: '', stderr: 'rm: missing operand', exitCode: 1 };
    }

    for (const path of paths) {
      const node = fs.resolvePath(path);
      if (!node) {
        if (!force) {
          return { stdout: '', stderr: `rm: cannot remove '${path}': No such file or directory`, exitCode: 1 };
        }
        continue;
      }
      if (node.type === 'dir' && !recursive) {
        return { stdout: '', stderr: `rm: cannot remove '${path}': Is a directory`, exitCode: 1 };
      }
      if (!fs.deleteEntry(path)) {
        return { stdout: '', stderr: `rm: cannot remove '${path}'`, exitCode: 1 };
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },
};
