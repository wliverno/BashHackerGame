import { parse } from './parser.js';
import { commands } from './commands/index.js';

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

    lastResult = commands[cmd](args, stdin, fs);
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
