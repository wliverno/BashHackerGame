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
  pwd(args, stdin, fs) {
    return {
      stdout: fs.cwd,
      stderr: '',
      exitCode: 0,
    };
  },

  ls(args, stdin, fs) {
    let showHidden = false;
    const paths = [];

    for (const arg of args) {
      if (arg === '-a' || arg === '-la' || arg === '-al') {
        showHidden = true;
      } else if (!arg.startsWith('-')) {
        paths.push(arg);
      }
    }

    if (paths.length === 0) {
      paths.push('.');
    }

    const outputs = [];

    for (const path of paths) {
      const node = fs.resolvePath(path);

      if (!node) {
        return {
          stdout: '',
          stderr: `ls: cannot access '${path}': No such file or directory`,
          exitCode: 1,
        };
      }

      if (node.type === 'file') {
        outputs.push(node.name);
      } else {
        const entries = fs.listDir(path, { showHidden });
        outputs.push(entries.map(e => e.name).join('  '));
      }
    }

    return {
      stdout: outputs.join('\n'),
      stderr: '',
      exitCode: 0,
    };
  },

  cd(args, stdin, fs) {
    const target = args[0] || '~';

    const node = fs.resolvePath(target);
    if (!node) {
      return {
        stdout: '',
        stderr: `cd: ${target}: No such file or directory`,
        exitCode: 1,
      };
    }

    if (node.type !== 'dir') {
      return {
        stdout: '',
        stderr: `cd: ${target}: Not a directory`,
        exitCode: 1,
      };
    }

    fs.changeDir(target);
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
    };
  },

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

  help(args, stdin, fs) {
    const helpText = `Available commands:
  ls [path]           - List directory contents (-a for hidden files)
  cd [path]           - Change directory (~ for home, .. for parent)
  pwd                 - Print working directory
  cat <file>          - Display file contents
  echo <text>         - Print text
  mkdir <dir>         - Create a directory
  cp <src> <dst>      - Copy files (-r for directories)
  mv <src> <dst>      - Move or rename files
  rm <file>           - Remove files (-r directories, -f force)
  chmod <mode> <file> - Change permissions (e.g. +x)
  clear               - Clear the terminal
  help                - Show this help message
  hint                - Get a hint for the current objective

Type 'hint' if you're stuck!`;

    return {
      stdout: helpText,
      stderr: '',
      exitCode: 0,
    };
  },

  clear(args, stdin, fs) {
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
      clear: true,
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

  chmod(args, stdin, fs) {
    if (args.length < 2) {
      return { stdout: '', stderr: 'chmod: missing operand', exitCode: 1 };
    }
    const mode = args[0];
    const paths = args.slice(1);

    for (const path of paths) {
      if (!fs.setPermission(path, mode)) {
        return { stdout: '', stderr: `chmod: cannot access '${path}': No such file or directory`, exitCode: 1 };
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },
};
