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

    // Check restricted directory access
    if (fs.restrictedDirs) {
      const absPath = fs.getAbsolutePath(target);
      const requiredUser = fs.restrictedDirs[absPath];
      if (requiredUser && fs.currentUser !== requiredUser) {
        return {
          stdout: '',
          stderr: `cd: ${target}: Permission denied`,
          exitCode: 1,
        };
      }
    }

    fs.changeDir(target);
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
    };
  },
};
