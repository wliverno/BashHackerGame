import { commands as navigationCommands } from './navigation.js';
import { commands as fileCommands } from './files.js';
import { commands as permissionCommands } from './permissions.js';
import { commands as metaCommands } from './meta.js';
import { commands as textCommands } from './text.js';
import { commands as networkCommands } from './network.js';

export const commands = {
  ...navigationCommands,
  ...fileCommands,
  ...permissionCommands,
  ...metaCommands,
  ...textCommands,
  ...networkCommands,
};

export const COMMAND_NAMES = Object.keys(commands);
