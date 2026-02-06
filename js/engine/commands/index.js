import { commands as navigationCommands } from './navigation.js';
import { commands as fileCommands } from './files.js';
import { commands as permissionCommands } from './permissions.js';
import { commands as metaCommands } from './meta.js';

export const commands = {
  ...navigationCommands,
  ...fileCommands,
  ...permissionCommands,
  ...metaCommands,
};
