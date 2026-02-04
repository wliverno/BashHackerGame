export function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    if (input[i] === ' ' || input[i] === '\t') {
      i++;
      continue;
    }

    if (input[i] === '>' && input[i + 1] === '>') {
      tokens.push('>>');
      i += 2;
      continue;
    }

    if (input[i] === '|' || input[i] === '>') {
      tokens.push(input[i]);
      i++;
      continue;
    }

    if (input[i] === '"' || input[i] === "'") {
      const quote = input[i];
      i++;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        str += input[i];
        i++;
      }
      i++; // skip closing quote
      tokens.push(str);
      continue;
    }

    let word = '';
    while (i < input.length &&
           input[i] !== ' ' &&
           input[i] !== '\t' &&
           input[i] !== '|' &&
           input[i] !== '>' &&
           input[i] !== '"' &&
           input[i] !== "'") {
      word += input[i];
      i++;
    }
    if (word) {
      tokens.push(word);
    }
  }

  return tokens;
}

export function parse(input) {
  const tokens = tokenize(input);
  const pipeline = [];
  let redirect = null;

  let i = 0;
  while (i < tokens.length) {
    if (tokens[i] === '>' || tokens[i] === '>>') {
      redirect = {
        type: tokens[i] === '>>' ? 'append' : 'write',
        file: tokens[i + 1],
      };
      break;
    }

    if (tokens[i] === '|') {
      i++;
      continue;
    }

    const cmd = tokens[i];
    const args = [];
    i++;

    while (i < tokens.length && tokens[i] !== '|' && tokens[i] !== '>' && tokens[i] !== '>>') {
      args.push(tokens[i]);
      i++;
    }

    pipeline.push({ cmd, args });
  }

  return { pipeline, redirect };
}
