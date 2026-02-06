export const commands = {
  chmod(args, stdin, fs) {
    if (args.length < 2) {
      return { stdout: '', stderr: 'chmod: missing operand', exitCode: 1 };
    }
    const mode = args[0];
    const paths = args.slice(1);

    for (const path of paths) {
      if (!fs.setPermission(path, mode)) {
        return { stdout: '', stderr: `chmod: cannot access '${path}': No such file or directory`, exitCode: 1 };
      }
    }
    return { stdout: '', stderr: '', exitCode: 0 };
  },
};
