export const commands = {
  ssh(args, stdin, fs) {
    if (args.length === 0) {
      return { stdout: '', stderr: 'usage: ssh user@hostname', exitCode: 1 };
    }

    const target = args[0];
    const match = target.match(/^(\w+)@(.+)$/);
    if (!match) {
      return { stdout: '', stderr: `ssh: invalid target '${target}'`, exitCode: 1 };
    }

    const [, user, host] = match;

    // Check if SSH key exists in current user's home
    const keyPath = fs.homePath + '/.ssh/id_rsa';
    const key = fs.readFile(keyPath);

    if (!key) {
      return {
        stdout: '',
        stderr: `${target}: Permission denied (publickey).`,
        exitCode: 1,
      };
    }

    return {
      stdout: `Welcome to ${host}!\nLogged in as ${user}.`,
      stderr: '',
      exitCode: 0,
      switchUser: user,
    };
  },
};
