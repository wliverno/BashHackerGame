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
];
