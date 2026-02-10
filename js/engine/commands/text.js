// Text processing commands: wc, sort, head, tail, grep

export const commands = {
  wc(args, stdin, fs) {
    let content = '';

    // If no args, use stdin
    if (args.length === 0) {
      content = stdin;
    } else {
      // Read from files
      const outputs = [];
      for (const path of args) {
        const fileContent = fs.readFile(path);
        if (fileContent === null) {
          return {
            stdout: '',
            stderr: `wc: ${path}: No such file or directory`,
            exitCode: 1,
          };
        }
        outputs.push(fileContent);
      }
      content = outputs.join('\n');
    }

    // Count lines, words, and characters
    const lines = content.split('\n').length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;

    return {
      stdout: `${lines} ${words} ${chars}`,
      stderr: '',
      exitCode: 0,
    };
  },

  sort(args, stdin, fs) {
    // Parse flags
    const flags = args.filter(a => a.startsWith('-')).join('');
    const reverse = flags.includes('r');
    const numeric = flags.includes('n');

    // Get file args (non-flag args)
    const fileArgs = args.filter(a => !a.startsWith('-'));

    let content = '';

    // If no file args, use stdin
    if (fileArgs.length === 0) {
      content = stdin;
    } else {
      // Read from files
      const outputs = [];
      for (const path of fileArgs) {
        const fileContent = fs.readFile(path);
        if (fileContent === null) {
          return {
            stdout: '',
            stderr: `sort: ${path}: No such file or directory`,
            exitCode: 1,
          };
        }
        outputs.push(fileContent);
      }
      content = outputs.join('\n');
    }

    // Sort lines
    const lines = content.split('\n');

    if (numeric) {
      lines.sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        return reverse ? numB - numA : numA - numB;
      });
    } else {
      lines.sort((a, b) => {
        if (reverse) return b.localeCompare(a);
        return a.localeCompare(b);
      });
    }

    return {
      stdout: lines.join('\n'),
      stderr: '',
      exitCode: 0,
    };
  },

  head(args, stdin, fs) {
    let content = '';
    let numLines = 10; // default

    // Parse -n flag
    const nIndex = args.indexOf('-n');
    if (nIndex !== -1 && args[nIndex + 1]) {
      numLines = parseInt(args[nIndex + 1]);
      args = args.filter((_, i) => i !== nIndex && i !== nIndex + 1);
    }

    // Get content from file or stdin
    if (args.length === 0) {
      content = stdin;
    } else {
      const fileContent = fs.readFile(args[0]);
      if (fileContent === null) {
        return {
          stdout: '',
          stderr: `head: ${args[0]}: No such file or directory`,
          exitCode: 1,
        };
      }
      content = fileContent;
    }

    // Get first N lines
    const lines = content.split('\n');
    const output = lines.slice(0, numLines).join('\n');

    return {
      stdout: output,
      stderr: '',
      exitCode: 0,
    };
  },

  tail(args, stdin, fs) {
    let content = '';
    let numLines = 10; // default

    // Parse -n flag
    const nIndex = args.indexOf('-n');
    if (nIndex !== -1 && args[nIndex + 1]) {
      numLines = parseInt(args[nIndex + 1]);
      args = args.filter((_, i) => i !== nIndex && i !== nIndex + 1);
    }

    // Get content from file or stdin
    if (args.length === 0) {
      content = stdin;
    } else {
      const fileContent = fs.readFile(args[0]);
      if (fileContent === null) {
        return {
          stdout: '',
          stderr: `tail: ${args[0]}: No such file or directory`,
          exitCode: 1,
        };
      }
      content = fileContent;
    }

    // Get last N lines
    const lines = content.split('\n');
    const output = lines.slice(-numLines).join('\n');

    return {
      stdout: output,
      stderr: '',
      exitCode: 0,
    };
  },

  grep(args, stdin, fs) {
    if (args.length === 0) {
      return {
        stdout: '',
        stderr: 'grep: missing pattern',
        exitCode: 2,
      };
    }

    // Parse flags
    const flags = args.filter(a => a.startsWith('-')).join('');
    const caseInsensitive = flags.includes('i');
    const invert = flags.includes('v');
    const onlyMatching = flags.includes('o');

    // Get pattern and files
    const nonFlagArgs = args.filter(a => !a.startsWith('-'));
    const pattern = nonFlagArgs[0];
    const files = nonFlagArgs.slice(1);

    // Create regex
    const regexFlags = caseInsensitive ? 'gi' : 'g';
    let regex;
    try {
      regex = new RegExp(pattern, regexFlags);
    } catch (e) {
      return {
        stdout: '',
        stderr: `grep: invalid pattern`,
        exitCode: 2,
      };
    }

    let content = '';

    // Get content from file or stdin
    if (files.length === 0) {
      content = stdin;
    } else {
      const outputs = [];
      for (const path of files) {
        const fileContent = fs.readFile(path);
        if (fileContent === null) {
          return {
            stdout: '',
            stderr: `grep: ${path}: No such file or directory`,
            exitCode: 2,
          };
        }
        outputs.push(fileContent);
      }
      content = outputs.join('\n');
    }

    // Filter lines
    const lines = content.split('\n');
    const matchingLines = [];

    for (const line of lines) {
      const matches = regex.test(line);

      if (invert) {
        if (!matches) matchingLines.push(line);
      } else {
        if (matches) matchingLines.push(line);
      }

      // Reset regex lastIndex for next test
      regex.lastIndex = 0;
    }

    return {
      stdout: matchingLines.join('\n'),
      stderr: '',
      exitCode: matchingLines.length === 0 ? 1 : 0,
    };
  },
};
