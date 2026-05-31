import { parse } from '../engine/parser.js';

function formatShellArg(arg) {
  if (arg === '') return '""';
  if (/^[A-Za-z0-9_@%+=:,./*?+-]+$/.test(arg)) return arg;
  return `"${arg.replace(/(["\\$`])/g, '\\$1')}"`;
}

function formatCommand({ cmd, args }) {
  return [cmd, ...args.map(formatShellArg)].join(' ');
}

function codeList(items) {
  if (items.length === 0) return '';
  const formatted = items.map(item => `\`${item}\``);
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
}

function splitFlags(args) {
  return {
    flags: args.filter(arg => arg.startsWith('-')),
    operands: args.filter(arg => !arg.startsWith('-')),
  };
}

function firstTarget(operands, fallback = 'the current directory') {
  if (operands.length === 0 || operands[0] === '.') return fallback;
  return `\`${operands[0]}\``;
}

function describeList(args) {
  const { flags, operands } = splitFlags(args);
  const location = operands.length === 0 || operands[0] === '.'
    ? 'the current directory'
    : codeList(operands);
  const hidden = flags.join('').includes('a') ? ', including hidden entries' : '';
  return `listed files and folders in ${location}${hidden}.`;
}

function describeCat(args) {
  if (args.length === 0) return 'printed the text it received from the previous command.';
  return `printed the contents of ${codeList(args)}.`;
}

function describeEcho(args) {
  const text = args.join(' ');
  return text ? `produced the text "${text}".` : 'produced a blank line.';
}

function describeCopy(args) {
  const { flags, operands } = splitFlags(args);
  const recursive = flags.join('').includes('r');
  if (operands.length < 2) return 'copied files or directories.';

  const sources = operands.slice(0, -1);
  const destination = operands[operands.length - 1];
  const thing = recursive ? 'copied a directory and its contents' : 'copied';
  return `${thing} from ${codeList(sources)} to \`${destination}\`.`;
}

function describeMove(args) {
  const { operands } = splitFlags(args);
  if (operands.length < 2) return 'moved or renamed a file.';

  const sources = operands.slice(0, -1);
  const destination = operands[operands.length - 1];
  return `moved or renamed ${codeList(sources)} to \`${destination}\`.`;
}

function describeRemove(args) {
  const { flags, operands } = splitFlags(args);
  const recursive = flags.join('').includes('r');
  const force = flags.join('').includes('f');
  const target = operands.length > 0 ? codeList(operands) : 'the requested path';
  const recursiveText = recursive ? ' and anything inside it' : '';
  const forceText = force ? ' without complaining if it was already gone' : '';
  return `removed ${target}${recursiveText}${forceText}.`;
}

function describeChmod(args) {
  const mode = args[0] || '';
  const targets = args.slice(1);
  const targetText = targets.length > 0 ? codeList(targets) : 'the target file';

  if (mode.includes('rw')) return `made ${targetText} readable and writable.`;
  if (mode.includes('x')) return `made ${targetText} executable.`;
  return `changed permissions on ${targetText}.`;
}

function describeGrep(args) {
  const { flags, operands } = splitFlags(args);
  const flagText = flags.join('');
  const pattern = operands[0] || 'the pattern';
  const quotedPattern = `"${pattern}"`;

  if (flagText.includes('v')) {
    return `kept all lines that do not contain ${quotedPattern}.`;
  }

  if (flagText.includes('o')) {
    return `printed only the matching text for ${quotedPattern}.`;
  }

  if (flagText.includes('i')) {
    return `searched case-insensitively for all lines containing ${quotedPattern}.`;
  }

  return `searched for all lines containing ${quotedPattern}.`;
}

function lineCountFromFlag(args) {
  const nIndex = args.indexOf('-n');
  if (nIndex !== -1 && args[nIndex + 1]) return args[nIndex + 1];
  return '10';
}

function describeSort(args) {
  const { flags } = splitFlags(args);
  const flagText = flags.join('');
  if (flagText.includes('n') && flagText.includes('r')) {
    return 'sorted the lines numerically in reverse order.';
  }
  if (flagText.includes('n')) return 'sorted the lines numerically.';
  if (flagText.includes('r')) return 'sorted the lines in reverse order.';
  return 'sorted the lines alphabetically.';
}

function describeWc(args) {
  const { flags } = splitFlags(args);
  const flagText = flags.join('');
  if (flagText.includes('l') && !flagText.includes('w') && !flagText.includes('c')) {
    return 'counted lines.';
  }
  if (flagText.includes('w') && !flagText.includes('l') && !flagText.includes('c')) {
    return 'counted words.';
  }
  if (flagText.includes('c') && !flagText.includes('l') && !flagText.includes('w')) {
    return 'counted characters.';
  }
  return 'counted lines, words, and characters.';
}

function describeSsh(args) {
  const target = args[0] || 'the remote host';
  if (target.includes('@')) {
    const [user, host] = target.split('@');
    return `started a remote shell as \`${user}\` on \`${host}\`.`;
  }
  return `started a remote shell on \`${target}\`.`;
}

function describeCommand({ cmd, args }) {
  if (cmd.startsWith('./')) return `ran the executable script \`${cmd}\`.`;

  switch (cmd) {
    case 'pwd':
      return 'showed your current directory.';
    case 'ls':
      return describeList(args);
    case 'cd':
      return `changed your current directory to ${firstTarget(args, 'your home directory')}.`;
    case 'cat':
      return describeCat(args);
    case 'echo':
      return describeEcho(args);
    case 'mkdir':
      return `created ${args.length === 1 ? 'a directory' : 'directories'} named ${codeList(args)}.`;
    case 'cp':
      return describeCopy(args);
    case 'mv':
      return describeMove(args);
    case 'rm':
      return describeRemove(args);
    case 'chmod':
      return describeChmod(args);
    case 'ssh':
      return describeSsh(args);
    case 'quit':
    case 'exit':
    case 'logout':
      return 'ended the current shell session.';
    case 'wc':
      return describeWc(args);
    case 'sort':
      return describeSort(args);
    case 'grep':
      return describeGrep(args);
    case 'head':
      return `kept only the first ${lineCountFromFlag(args)} lines.`;
    case 'tail':
      return `kept only the last ${lineCountFromFlag(args)} lines.`;
    default:
      return 'ran successfully.';
  }
}

function redirectDescription(redirect) {
  if (redirect.type === 'append') {
    return `appended the results to \`${redirect.file}\` without replacing what was already there.`;
  }

  return `redirected the results into \`${redirect.file}\`, replacing anything already there.`;
}

export function explainSuccessfulCommand(input) {
  const ast = parse(input);
  const pieces = [];

  ast.pipeline.forEach((stage, index) => {
    pieces.push({
      snippet: formatCommand(stage),
      description: describeCommand(stage),
    });

    if (index < ast.pipeline.length - 1) {
      pieces.push({
        snippet: '|',
        description: 'sent the output into the next command.',
      });
    }
  });

  if (ast.redirect) {
    pieces.push({
      snippet: ast.redirect.type === 'append' ? '>>' : '>',
      description: redirectDescription(ast.redirect),
    });
  }

  return pieces
    .map(({ snippet, description }) => `\`${snippet}\`\n${description}`)
    .join('\n\n');
}
