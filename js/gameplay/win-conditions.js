/**
 * Reusable win condition helpers for common patterns
 */

export const winConditions = {
  /**
   * Check if command matches exactly
   */
  exactCommand: (expectedCmd) => (cmd, output, fs) => {
    return cmd.trim() === expectedCmd;
  },

  /**
   * Check if command starts with given string
   */
  commandStartsWith: (prefix) => (cmd, output, fs) => {
    return cmd.trim().startsWith(prefix);
  },

  /**
   * Check if command includes specific substrings
   */
  commandIncludes: (...parts) => (cmd, output, fs) => {
    return parts.every(part => cmd.includes(part));
  },

  /**
   * Check if current directory changed to expected path
   */
  changedToDir: (expectedPath) => (cmd, output, fs) => {
    return fs.cwd === expectedPath;
  },

  /**
   * Check if file exists at path
   */
  fileExists: (path) => (cmd, output, fs) => {
    return fs.readFile(path) !== null;
  },

  /**
   * Check if file contains expected content
   */
  fileContains: (path, expectedContent) => (cmd, output, fs) => {
    const content = fs.readFile(path);
    return content !== null && content.includes(expectedContent);
  },

  /**
   * Check if file content matches exactly
   */
  fileMatches: (path, expectedContent) => (cmd, output, fs) => {
    return fs.readFile(path) === expectedContent;
  },

  /**
   * Check if directory exists
   */
  dirExists: (path) => (cmd, output, fs) => {
    const node = fs.resolvePath(path);
    return node !== null && node.type === 'dir';
  },

  /**
   * Check if file has specific permission
   */
  hasPermission: (path, permission) => (cmd, output, fs) => {
    const perms = fs.getPermissions(path);
    return perms.has(permission);
  },

  /**
   * Combine multiple conditions with AND logic
   */
  all: (...conditions) => (cmd, output, fs) => {
    return conditions.every(condition => condition(cmd, output, fs));
  },

  /**
   * Combine multiple conditions with OR logic
   */
  any: (...conditions) => (cmd, output, fs) => {
    return conditions.some(condition => condition(cmd, output, fs));
  },
};
