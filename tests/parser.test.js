import { tokenize, parse } from '../js/engine/parser.js';

describe('tokenize', () => {
  test('tokenizes simple command', () => {
    expect(tokenize('ls')).toEqual(['ls']);
  });

  test('tokenizes command with arguments', () => {
    expect(tokenize('ls -la /home')).toEqual(['ls', '-la', '/home']);
  });

  test('tokenizes pipe operator', () => {
    expect(tokenize('cat file | grep pattern')).toEqual(['cat', 'file', '|', 'grep', 'pattern']);
  });

  test('tokenizes redirect operator', () => {
    expect(tokenize('echo hello > file.txt')).toEqual(['echo', 'hello', '>', 'file.txt']);
  });

  test('tokenizes append operator', () => {
    expect(tokenize('echo hello >> file.txt')).toEqual(['echo', 'hello', '>>', 'file.txt']);
  });

  test('handles double-quoted strings', () => {
    expect(tokenize('echo "hello world"')).toEqual(['echo', 'hello world']);
  });

  test('handles single-quoted strings', () => {
    expect(tokenize("echo 'hello world'")).toEqual(['echo', 'hello world']);
  });

  test('handles adjacent operators', () => {
    expect(tokenize('cat file|grep x')).toEqual(['cat', 'file', '|', 'grep', 'x']);
  });

  test('handles multiple pipes', () => {
    expect(tokenize('cat file | sort | head')).toEqual(['cat', 'file', '|', 'sort', '|', 'head']);
  });
});

describe('parse', () => {
  test('parses simple command', () => {
    expect(parse('ls -la')).toEqual({
      pipeline: [{ cmd: 'ls', args: ['-la'] }],
      redirect: null,
    });
  });

  test('parses pipe chain', () => {
    expect(parse('cat file | grep pattern | sort')).toEqual({
      pipeline: [
        { cmd: 'cat', args: ['file'] },
        { cmd: 'grep', args: ['pattern'] },
        { cmd: 'sort', args: [] },
      ],
      redirect: null,
    });
  });

  test('parses output redirect', () => {
    expect(parse('echo hello > out.txt')).toEqual({
      pipeline: [{ cmd: 'echo', args: ['hello'] }],
      redirect: { type: 'write', file: 'out.txt' },
    });
  });

  test('parses append redirect', () => {
    expect(parse('echo hello >> out.txt')).toEqual({
      pipeline: [{ cmd: 'echo', args: ['hello'] }],
      redirect: { type: 'append', file: 'out.txt' },
    });
  });

  test('parses pipe with redirect', () => {
    expect(parse('cat file | sort > sorted.txt')).toEqual({
      pipeline: [
        { cmd: 'cat', args: ['file'] },
        { cmd: 'sort', args: [] },
      ],
      redirect: { type: 'write', file: 'sorted.txt' },
    });
  });

  test('parses command with no args', () => {
    expect(parse('pwd')).toEqual({
      pipeline: [{ cmd: 'pwd', args: [] }],
      redirect: null,
    });
  });
});
