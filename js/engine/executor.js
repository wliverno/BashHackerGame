import { parse } from './parser.js';
import { commands } from './commands/index.js';

// Flags each command actually handles. '*' means flag takes a value arg.
const SUPPORTED_FLAGS = {
  ls:    { a: true },
  cp:    { r: true },
  rm:    { r: true, f: true },
  grep:  { i: true, v: true, o: true },
  sort:  { r: true, n: true },
  head:  { n: '*' },
  tail:  { n: '*' },
  // commands with no flag support:
  cat: {}, echo: {}, mkdir: {}, mv: {}, chmod: {}, pwd: {}, cd: {},
  wc: {}, ssh: {}, quit: {}, exit: {}, logout: {}, help: {}, clear: {},
};

function checkUnsupportedFlags(cmd, args) {
  const supported = SUPPORTED_FLAGS[cmd];
  if (supported === undefined) return null; // unknown command, let it fall through

  for (const arg of args) {
    if (!arg.startsWith('-')) continue;

    if (arg.startsWith('--')) {
      // Long flags are never supported
      return unsupportedMessage(cmd, arg);
    }

    // Short flags: split combined flags like -la into l, a
    const chars = arg.slice(1).split('');
    for (const ch of chars) {
      if (!supported[ch]) {
        return unsupportedMessage(cmd, '-' + ch);
      }
    }
  }

  // Special case: chmod with octal notation (e.g. chmod 755 file)
  if (cmd === 'chmod' && args.length >= 1 && /^\d+$/.test(args[0])) {
    return unsupportedMessage(cmd, args[0] + ' (octal notation)');
  }

  return null;
}

function unsupportedMessage(cmd, flag) {
  return {
    stdout: `${cmd} ${flag} — impressive, you know your flags!\nThis one's beyond what we built for the game, though.\nIf you want it to work, the repo could always use a pull request.`,
    stderr: '',
    exitCode: 0,
  };
}

// Expand wildcards in arguments
function expandWildcards(args, fs) {
  const expandedArgs = [];

  for (const arg of args) {
    // Skip if no wildcards
    if (!arg.includes('*') && !arg.includes('?')) {
      expandedArgs.push(arg);
      continue;
    }

    // Parse the path to get directory and pattern
    const lastSlash = arg.lastIndexOf('/');
    let dir = '.';
    let pattern = arg;

    if (lastSlash !== -1) {
      dir = arg.substring(0, lastSlash) || '/';
      pattern = arg.substring(lastSlash + 1);
    }

    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp('^' + regexPattern + '$');

    // Get directory listing
    const entries = fs.listDir(dir, { showHidden: false });

    if (!entries) {
      // Directory doesn't exist, leave the arg as-is
      expandedArgs.push(arg);
      continue;
    }

    // Filter entries that match the pattern
    const matches = entries
      .filter(entry => regex.test(entry.name))
      .map(entry => {
        if (dir === '.') {
          return entry.name;
        } else if (dir === '/') {
          return '/' + entry.name;
        } else {
          return dir + '/' + entry.name;
        }
      });

    if (matches.length === 0) {
      // No matches, leave the arg as-is
      expandedArgs.push(arg);
    } else {
      // Add all matches
      expandedArgs.push(...matches);
    }
  }

  return expandedArgs;
}

export function executePipeline(input, fs) {
  const ast = parse(input);

  if (ast.pipeline.length === 0) {
    return { output: '', exitCode: 0 };
  }

  // Script execution: ./path (single-command only; args and redirects are intentionally not forwarded)
  if (ast.pipeline.length === 1 && ast.pipeline[0].cmd.startsWith('./')) {
    const scriptPath = ast.pipeline[0].cmd;
    const content = fs.readFile(scriptPath);
    if (content === null) {
      return { output: `${scriptPath}: No such file or directory`, exitCode: 127 };
    }
    if (!fs.getPermissions(scriptPath).has('x')) {
      return { output: `${scriptPath}: Permission denied`, exitCode: 126 };
    }
    // Simulate script execution: if script has echo lines, extract their output
    const echoLines = content.split('\n')
      .filter(line => line.trim().startsWith('echo '));
    if (echoLines.length > 0) {
      const output = echoLines
        .map(line => {
          const arg = line.trim().slice(5);
          const match = arg.match(/^"(.*)"$/);
          return match ? match[1] : arg;
        })
        .join('\n');
      return { output, exitCode: 0 };
    }
    return { output: content, exitCode: 0 };
  }

  let stdin = '';
  let lastResult = { stdout: '', stderr: '', exitCode: 0 };

  for (const { cmd, args } of ast.pipeline) {
    if (!commands[cmd]) {
      return {
        output: `${cmd}: command not found`,
        exitCode: 127,
      };
    }

    // Expand wildcards in arguments
    const expandedArgs = expandWildcards(args, fs);

    // Check for unsupported flags before running the command
    const flagCheck = checkUnsupportedFlags(cmd, expandedArgs);
    if (flagCheck) {
      lastResult = flagCheck;
      break;
    }

    lastResult = commands[cmd](expandedArgs, stdin, fs);
    stdin = lastResult.stdout;

    if (lastResult.exitCode !== 0) {
      break;
    }
  }

  if (ast.redirect && lastResult.exitCode === 0) {
    const writeResult = fs.writeFile(
      ast.redirect.file,
      lastResult.stdout,
      { append: ast.redirect.type === 'append' }
    );

    if (!writeResult) {
      return {
        output: `Cannot write to ${ast.redirect.file}`,
        exitCode: 1,
      };
    }

    return { output: '', exitCode: 0 };
  }

  const output = lastResult.stderr || lastResult.stdout;
  return {
    output,
    exitCode: lastResult.exitCode,
    clear: lastResult.clear,
    switchUser: lastResult.switchUser,
    switchCwd: lastResult.switchCwd,
  };
}
