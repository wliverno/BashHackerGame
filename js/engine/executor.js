import { parse } from './parser.js';
import { commands } from './commands/index.js';

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
  };
}
