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
  ls [path]      - List directory contents (-a for hidden files)
  cd [path]      - Change directory (~ for home, .. for parent)
  pwd            - Print working directory
  cat <file>     - Display file contents
  echo <text>    - Print text
  clear          - Clear the terminal
  help           - Show this help message
  hint           - Get a hint for the current objective

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
};
