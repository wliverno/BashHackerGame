export const commands = {
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
};
