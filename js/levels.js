export const levels = [
  {
    id: 1,
    chapter: 1,
    title: 'First Contact',
    story: `You're in. The SSH connection is live.

The server is quiet. You're in someone's home directory — probably an analyst account they forgot to disable.

First things first: figure out where you are and what's around you.`,
    filesystem: {
      home: {
        analyst: {
          '.bash_history': 'cd /var/log\ncat access.log\nexit',
          'welcome.txt': 'Welcome to NexusCorp Internal Server.\nAll activity is monitored.\nReport suspicious behavior to security@nexuscorp.internal',
          documents: {
            'memo.txt': 'Team — remember to update your passwords this quarter. -Admin',
            'schedule.txt': 'Monday: Team standup\nTuesday: Server maintenance\nWednesday: Security audit',
          },
          internal: {
            'contacts.txt': 'IT Support: ext 4357\nSecurity: ext 9111\nHR: ext 2200',
            projects: {},
          },
        },
      },
      var: {
        messages: 'System Notice: Scheduled maintenance on Saturday.\nSystem Notice: New security policies in effect.\nSystem Notice: Report any suspicious activity.',
      },
    },
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
        objective: "There's a file called `welcome.txt`. Read it with `cat welcome.txt`.",
        hints: [
          'cat displays the contents of a file',
          'Type: cat welcome.txt',
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

The welcome message mentioned "internal" resources. You noticed a folder called "internal" in the directory listing.

Time to explore. You need to learn to move around this filesystem.`,
    filesystem: {
      home: {
        analyst: {
          '.bash_history': 'ls\ncd internal\nls\nexit',
          'welcome.txt': 'Welcome to NexusCorp Internal Server.',
          documents: {
            'memo.txt': 'Team — remember to update your passwords.',
          },
          internal: {
            'readme.txt': 'Internal Resources Directory\n\nProjects are stored in /home/analyst/internal/projects\nReports go in /home/analyst/internal/reports',
            projects: {
              'project_alpha.txt': 'Project Alpha: Status ACTIVE\nLead: jsmith\nBudget: $2.4M',
              'project_beta.txt': 'Project Beta: Status PENDING\nLead: mwilson\nBudget: TBD',
            },
            reports: {
              'q1_summary.txt': 'Q1 was strong. Revenue up 12%.',
            },
          },
        },
      },
    },
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
    filesystem: {
      home: {
        analyst: {
          '.bash_history': 'cd ..\nls\npwd',
          'welcome.txt': 'Welcome to NexusCorp Internal Server.',
          documents: {
            'important.txt': 'You found the important file! Well done.',
          },
          internal: {
            'readme.txt': 'Internal directory',
            projects: {
              'project_alpha.txt': 'Project Alpha details',
            },
            reports: {
              'findings.txt': 'Security findings: None reported.',
            },
          },
        },
      },
    },
    startDir: '/home/analyst/internal/projects',
    subSteps: [
      {
        objective: 'Go up one directory using `cd ..`',
        hints: [
          '.. means "parent directory"',
          'Type: cd ..',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/analyst/internal',
      },
      {
        objective: 'Good! Now go up one more level with `cd ..`',
        hints: [
          'Same command again',
          'Type: cd ..',
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
    filesystem: {
      home: {
        analyst: {
          reports: {
            'budget.txt': 'Q3 Budget Report\nProject Helios: $2.4M approved\nProject Aurora: $800K pending',
            'staffing.txt': 'Recent Personnel Changes\nJ. Martinez hired — Project Helios lead\nK. Chen transferred — Project Aurora',
          },
          internal: {
            'memo.txt': 'All Helios personnel: report to Lab 3 immediately.',
          },
        },
      },
    },
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Read the budget report inside the `reports/` directory.',
        hints: [
          'cat can read files in subdirectories: cat path/to/file',
          'Try: cat reports/budget.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('Helios'),
      },
      {
        objective: 'Now read the staffing report.',
        hints: [
          'Same idea — different file in the same directory',
          'Try: cat reports/staffing.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('Martinez'),
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
    filesystem: {
      home: {
        analyst: {
          reports: {
            'budget.txt': 'Project Helios: $2.4M',
            'staffing.txt': 'J. Martinez — Helios lead',
          },
        },
      },
    },
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Create a file called `notes.txt` using echo and `>`.',
        hints: [
          'echo "text" > filename writes text to a new file',
          'Try: echo "started investigating" > notes.txt',
        ],
        winCondition: (cmd, output, fs) => fs.readFile('notes.txt') !== null,
      },
      {
        objective: 'Read your notes back with cat.',
        hints: [
          'You know how to do this one already',
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
          'Try: echo "Project Helios is the target" > notes.txt',
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
    filesystem: {
      home: {
        analyst: {
          'dossier.txt': 'Investigation Log\n- Server access: confirmed\n- Target: Project Helios\n',
          reports: {
            'budget.txt': 'Project Helios: $2.4M approved',
          },
        },
      },
    },
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Read the existing dossier.',
        hints: [
          'There is a file called dossier.txt right here',
          'Try: cat dossier.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('Project Helios'),
      },
      {
        objective: 'Append a new finding to the dossier using `>>`.',
        hints: [
          '>> adds to the end of a file without erasing it',
          'Try: echo "- New finding: budget is $2.4M" >> dossier.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const content = fs.readFile('dossier.txt');
          return cmd.includes('>> dossier.txt') && content && content.includes('Investigation Log');
        },
      },
      {
        objective: 'Read the dossier again to confirm your addition.',
        hints: [
          'cat it again — you should see both the original and your new line',
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
    filesystem: {
      home: {
        analyst: {
          reports: {
            'budget.txt': 'Project Helios: $2.4M approved',
            'staffing.txt': 'J. Martinez — Helios lead',
          },
          internal: {
            'memo.txt': 'All Helios personnel: report to Lab 3.',
          },
        },
      },
    },
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Create a directory called `evidence` to hold your findings.',
        hints: [
          'mkdir creates a new directory',
          'Try: mkdir evidence',
        ],
        winCondition: (cmd, output, fs) => fs.listDir('evidence') !== null,
      },
      {
        objective: 'Copy the budget report into your evidence directory.',
        hints: [
          'cp source destination — if dest is a directory, the file goes inside it',
          'Try: cp reports/budget.txt evidence/',
        ],
        winCondition: (cmd, output, fs) => fs.readFile('evidence/budget.txt') !== null,
      },
      {
        objective: 'Copy the staffing report into evidence as well.',
        hints: [
          'Same idea — different source file',
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
    filesystem: {
      home: {
        analyst: {
          evidence: {
            'budget.txt': 'Project Helios: $2.4M',
            'staffing.txt': 'J. Martinez — Helios lead',
          },
          classified: {},
          'temp.log': 'debug output from 02:14 — analyst session',
          old_logs: {
            'access.log': 'Feb 03 22:41 analyst login',
            'auth.log': 'Feb 03 22:41 ssh auth success',
          },
        },
      },
    },
    startDir: '/home/analyst',
    subSteps: [
      {
        objective: 'Move the budget report into the `classified` directory.',
        hints: [
          'mv source destination — works like cp but removes the original',
          'Try: mv evidence/budget.txt classified/',
        ],
        winCondition: (cmd, output, fs) => {
          return fs.readFile('classified/budget.txt') !== null && fs.readFile('evidence/budget.txt') === null;
        },
      },
      {
        objective: "Delete the temp log — it's evidence you were here.",
        hints: [
          'rm removes a file permanently',
          'Try: rm temp.log',
        ],
        winCondition: (cmd, output, fs) => fs.readFile('temp.log') === null,
      },
      {
        objective: 'Delete the entire old_logs directory.',
        hints: [
          'rm needs -r to remove directories (and everything inside)',
          'Try: rm -r old_logs',
        ],
        winCondition: (cmd, output, fs) => fs.listDir('old_logs') === null,
      },
    ],
  },
];