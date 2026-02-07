// Base filesystem structure for the Umbrella Corp server
// This persists across most levels - levels can extend or override as needed
const BASE_FILESYSTEM = {
  home: {
    analyst: {
      '.bash_history': 'cd /var/log\ncat access.log\nexit',
      'welcome.txt': 'Welcome to the Umbrella Corporation Internal Server.\nAll activity is monitored.\nSharing disabled for internal directories.',
      documents: {
        'memo.txt': 'Team — remember to update your passwords this quarter. -Admin',
        'schedule.txt': 'Monday: Team standup\nTuesday: Server maintenance\nWednesday: Security audit',
      },
      internal: {
        'contacts.txt': 'Dick Cheney (deceased): dcheney@whitehouse.gov\nGeorge Wallace (deceased): gwallace@alabama.gov',
        projects: {
          'project_alpha.txt': 'Project Alpha: Status ACTIVE\nLead: dtrump@whitehouse.gov\nBudget: $9.1 trillion',
          'project_tango.txt': 'Project Tango: Status FAILED',
        },
        reports: {
          'q1_summary.txt': 'Q1 was strong. Revenue up 12%, Human deaths up 2000%',
          'activity_log.txt': 'analyst login: 02:14 UTC — suspicious activity detected',
        },
      },
    },
  },
};

// Protected lore files that trigger game over if deleted/moved
const PROTECTED_FILES = [
  '/home/analyst/welcome.txt',
  '/home/analyst/internal/contacts.txt',
  '/home/analyst/internal/projects/project_alpha.txt',
  '/home/analyst/internal/projects/project_tango.txt',
  '/home/analyst/internal/reports/q1_summary.txt',
];

// Deep merge utility for extending base filesystem
function mergeFilesystem(base, override) {
  if (!override) return JSON.parse(JSON.stringify(base));

  const result = JSON.parse(JSON.stringify(base));

  function merge(target, source) {
    for (const key in source) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  merge(result, override);
  return result;
}

export const levels = [
  {
    id: 1,
    chapter: 1,
    title: 'First Contact',
    story: `You're in. The SSH connection is live.

The server is quiet. You're in someone's home directory — probably an analyst account they forgot to disable.

First things first: figure out where you are and what's around you.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      var: {
        messages: 'System Notice: Scheduled maintenance on Saturday.\nSystem Notice: New security policies in effect.\nSystem Notice: Report any suspicious activity.',
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Use `pwd` to see where you are on the server.',
        hints: [
          'pwd stands for "print working directory"',
          'Just type: pwd',
        ],
        winCondition: (cmd, output, fs) => cmd.trim() === 'pwd',
      },
      {
        objective: 'Use `ls` to see what files and folders are here.',
        hints: [
          'ls lists the contents of a directory',
          'Just type: ls',
        ],
        winCondition: (cmd, output, fs) => cmd.trim().startsWith('ls'),
      },
      {
        objective: "There's a file called `welcome.txt`. Print the contents of the file to the terminal (type 'hint' for a hint).",
        hints: [
          'cat displays the contents of a file',
          'Syntax: cat [filename]',
        ],
        winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('welcome.txt'),
      },
    ],
  },

  {
    id: 2,
    chapter: 1,
    title: 'Going Deeper',
    story: `Good. You've got your bearings.

The welcome message mentioned "internal" directories. You noticed a folder called "internal" in the directory listing.

Time to explore. You need to learn to move around this filesystem.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        analyst: {
          '.bash_history': 'ls\ncd internal\nls\nexit',
          internal: {
            'readme.txt': 'Internal Resources Directory\n\nProjects are stored in /home/analyst/internal/projects\nReports go in /home/analyst/internal/reports',
          },
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Change into the `internal` directory using `cd internal`.',
        hints: [
          'cd stands for "change directory"',
          'Type: cd internal',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/analyst/internal',
      },
      {
        objective: 'List the contents of this directory with `ls`.',
        hints: [
          'You know this one!',
          'Type: ls',
        ],
        winCondition: (cmd, output, fs) => cmd.trim().startsWith('ls') && fs.cwd === '/home/analyst/internal',
      },
      {
        objective: "There's a `projects` folder. Go into it with `cd projects`.",
        hints: [
          'Same as before — use cd to change directory',
          'Type: cd projects',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/analyst/internal/projects',
      },
    ],
  },

  {
    id: 3,
    chapter: 1,
    title: 'Finding Your Way Back',
    story: `You've gone deep into the directory structure. But sometimes you need to go back up.

In Linux, \`.\` means "current directory" and \`..\` means "parent directory".

You're currently in /home/analyst/internal/projects. Time to learn to navigate back.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        analyst: {
          '.bash_history': 'cd ..\nls\npwd',
          documents: {
            'important.txt': 'You found the important file! Well done.',
          },
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/analyst/internal/projects',
    subSteps: [
      {
        objective: 'Go back to the /home/analyst directory',
        hints: [
          'Use the cd command to change directory',
          'Type: cd ..',
          'Type: cd /home/analyst to go there directly',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/analyst',
      },
      {
        objective: "There's a `documents` folder. Navigate into it and read `important.txt`.",
        hints: [
          'First cd into documents, then use cat',
          'Type: cd documents',
          'Then: cat important.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('cat') && cmd.includes('important.txt') && output.includes('You found');
        },
      },
    ],
  },

  {
    id: 4,
    chapter: 2,
    title: 'Gathering Intel',
    story: `You've explored the basics. Now it's time to dig deeper.

The reports directory might have something interesting. Time to start reading files properly.

cat is your best friend here — it dumps file contents straight to the terminal.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        analyst: {
          reports: {
            'budget.txt': 'Q3 Budget Report\nProject "Kill All Humans": $2.4B approved\nProject "Puppy Love": $800K pending',
            'staffing.txt': 'Recent Personnel Changes\nJ. T-virus hired — Project "Kill All Humans" lead\nJ. Bond transferred — Project "Puppy Love"',
          },
          internal: {
            'memo.txt': 'All personnel: report to Lab 3 immediately.',
          },
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Read the budget report.',
        hints: [
          'cat can read files in subdirectories: cat path/to/file',
          'Syntax: cat path/to/filename',
          'Try: cat reports/budget.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('Kill All Humans') || output.includes('Puppy Love'),
      },
      {
        objective: 'Now read the staffing report.',
        hints: [
          'Same idea — different file in the same directory',
          'Syntax: cat path/to/filename',
          'Try: cat reports/staffing.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('T-virus') || output.includes('Bond'),
      },
      {
        objective: 'Read both reports in a single command.',
        hints: [
          'cat can take multiple files: cat file1 file2',
          'Try: cat reports/budget.txt reports/staffing.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('budget.txt') && cmd.includes('staffing.txt');
        },
      },
    ],
  },
  {
    id: 5,
    chapter: 2,
    title: 'Leaving a Trail',
    story: `You've been reading files. But what if you need to write one?

In Linux, you can redirect output into a file using >.
echo "hello" > file.txt creates file.txt with the text "hello".

If the file already exists, > overwrites it completely.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        analyst: {
          reports: {
            'budget.txt': 'Project "Kill All Humans": $2.4B approved',
            'staffing.txt': 'J. T-virus — Project lead',
          },
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Create a file called `notes.txt` using echo and `>`.',
        hints: [
          'echo outputs text, > redirects it to a file',
          'Syntax: echo "text" > filename',
          'Try: echo "started investigating" > notes.txt',
        ],
        winCondition: (cmd, output, fs) => fs.readFile('notes.txt') !== null,
      },
      {
        objective: 'Read your notes back with cat.',
        hints: [
          'You know how to do this one already',
          'Syntax: cat filename',
          'Try: cat notes.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('cat') && cmd.includes('notes.txt') && output.length > 0;
        },
      },
      {
        objective: 'Overwrite your notes with new intel using `>` again.',
        hints: [
          '> replaces the entire file contents — try it again on notes.txt',
          'Syntax: echo "text" > filename',
          'Try: echo "found something suspicious" > notes.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('>') && !cmd.includes('>>') && cmd.includes('notes.txt');
        },
      },
    ],
  },
  {
    id: 6,
    chapter: 2,
    title: 'Building the Dossier',
    story: `You've been writing notes, but > keeps wiping them out.

There's another redirect operator: >>.
It appends to a file instead of overwriting.

echo "new line" >> file.txt adds to the end of file.txt.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        analyst: {
          'dossier.txt': 'Investigation Log\n- Server access: confirmed\n- Suspicious projects detected\n',
          reports: {
            'budget.txt': 'Project "Kill All Humans": $2.4B approved',
          },
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Read the existing dossier.',
        hints: [
          'There is a file called dossier.txt right here',
          'Syntax: cat filename',
          'Try: cat dossier.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('Investigation Log'),
      },
      {
        objective: 'Append a new finding to the dossier using `>>`.',
        hints: [
          '>> appends to a file without erasing it',
          'Syntax: echo "text" >> filename',
          'Try: echo "- New finding: suspicious budgets detected" >> dossier.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const content = fs.readFile('dossier.txt');
          return cmd.includes('>> dossier.txt') && content && content.includes('Investigation Log');
        },
      },
      {
        objective: 'Read the dossier again to confirm your addition.',
        hints: [
          'cat displays file contents',
          'You should see both the original and your new line',
          'Try: cat dossier.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.trim().startsWith('cat') && cmd.includes('dossier.txt');
        },
      },
    ],
  },
  {
    id: 7,
    chapter: 3,
    title: 'Organizing the Evidence',
    story: `Your notes are scattered across the server. Time to get organized.

mkdir creates new directories. cp copies files.

A good analyst keeps their evidence in one place.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        analyst: {
          reports: {
            'budget.txt': 'Project "Kill All Humans": $2.4B approved\nProject Alpha: $9.1 trillion approved',
            'staffing.txt': 'J. T-virus — Project "Kill All Humans" lead\nHuman deaths up 2000% this quarter',
          },
          internal: {
            'memo.txt': 'All personnel: report to Lab 3 immediately. Bring protective equipment.',
          },
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Create a directory called `evidence` to hold your findings.',
        hints: [
          'mkdir creates a new directory',
          'Syntax: mkdir dirname',
          'Try: mkdir evidence',
        ],
        winCondition: (cmd, output, fs) => fs.listDir('evidence') !== null,
      },
      {
        objective: 'Copy the budget report into your evidence directory.',
        hints: [
          'cp copies files',
          'Syntax: cp source destination',
          'Try: cp reports/budget.txt evidence/',
        ],
        winCondition: (cmd, output, fs) => fs.readFile('evidence/budget.txt') !== null,
      },
      {
        objective: 'Copy the staffing report into evidence as well.',
        hints: [
          'Same idea — different source file',
          'Syntax: cp source destination',
          'Try: cp reports/staffing.txt evidence/',
        ],
        winCondition: (cmd, output, fs) => fs.readFile('evidence/staffing.txt') !== null,
      },
    ],
  },
  {
    id: 8,
    chapter: 3,
    title: 'Covering Tracks',
    story: `Footprints everywhere. If someone checks these directories, they'll know you were here.

mv moves (or renames) files. rm removes them entirely.

Be careful with rm — there's no undo.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        analyst: {
          evidence: {
            'budget.txt': 'Project "Kill All Humans": $2.4B',
            'staffing.txt': 'J. T-virus — Project lead',
          },
          classified: {},
          'temp.log': 'debug output from 02:14 — analyst session',
          old_logs: {
            'access.log': 'Feb 03 22:41 analyst login',
            'auth.log': 'Feb 03 22:41 ssh auth success',
          },
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Move the budget report into the `classified` directory.',
        hints: [
          'mv moves files (like cp but removes the original)',
          'Syntax: mv source destination',
          'Try: mv evidence/budget.txt classified/',
        ],
        winCondition: (cmd, output, fs) => {
          return fs.readFile('classified/budget.txt') !== null && fs.readFile('evidence/budget.txt') === null;
        },
      },
      {
        objective: "Delete the temp log — it's evidence you were here.",
        hints: [
          'rm removes a file permanently (no undo!)',
          'Syntax: rm filename',
          'Try: rm temp.log',
        ],
        winCondition: (cmd, output, fs) => fs.readFile('temp.log') === null,
      },
      {
        objective: 'Delete the entire old_logs directory.',
        hints: [
          'rm -r removes directories and everything inside',
          'Syntax: rm -r dirname',
          'Try: rm -r old_logs',
        ],
        winCondition: (cmd, output, fs) => fs.listDir('old_logs') === null,
      },
    ],
  },
  {
    id: 9,
    chapter: 3,
    title: 'The Antidote',
    story: `Deep in the server you found a script called antidote.sh.

The T-virus is spreading. This script should contain the cure formula.

But it won't run. Something's wrong with the permissions.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        analyst: {
          'antidote.sh': 'T-VIRUS ANTIDOTE DATABASE\nAccessing cure formula...\n\nERROR: NO KNOWN CURE\n\nSystem status: The Cheat is not dead.',
          'readme.txt': 'The script needs to be executable. Use chmod +x, then run it with ./antidote.sh',
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Read the readme to understand what needs to be done.',
        hints: [
          'cat can read files',
          'Syntax: cat filename',
          'Try: cat readme.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('chmod'),
      },
      {
        objective: 'Make antidote.sh executable with chmod.',
        hints: [
          'chmod changes file permissions',
          'Syntax: chmod +x filename',
          'Try: chmod +x antidote.sh',
        ],
        winCondition: (cmd, output, fs) => fs.getPermissions('antidote.sh').has('x'),
      },
      {
        objective: 'Run the script to find the cure.',
        hints: [
          './ runs a script in the current directory',
          'Syntax: ./scriptname',
          'Try: ./antidote.sh',
        ],
        winCondition: (cmd, output, fs) => output.includes('NO KNOWN CURE'),
      },
    ],
  },
];