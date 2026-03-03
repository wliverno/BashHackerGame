// Base filesystem structure for the Megafirm Quantum Research Lab server
// This persists across most levels - levels can extend or override as needed
const BASE_FILESYSTEM = {
  home: {
    eve: {
      '.bash_history': 'ssh eve@megafirm-qlab\nls\npwd',
      'welcome.txt': 'Welcome to the Megafirm Quantum Research Lab server.\nAll activity is monitored and logged.\nPlease report any anomalies to the lab manager.\n\nOther users on this system: alice, bob, mallory',
      'todo.txt': '1. Refill liquid nitrogen dewars\n2. Label all the cables in rack 7 (again)\n3. Update the safety binder\n4. Pray that the laser table is still aligned',
    },
    alice: {
      notes: {
        'lab_memo.txt': 'REMINDER: Whoever keeps kicking the laser table — STOP.\nWe lost 3 hours of alignment yesterday.\nThe next person caught doing this will be assigned to clean the cryostat.\n\n— Alice',
        'safety_notice.txt': 'OFFICIAL NOTICE: NO WHISTLING IN THE LAB\n\nThe qubits are experiencing anomalous decoherence.\nAfter extensive debugging, we traced the issue to\nacoustic vibrations in the 1-2 kHz range.\n\nIn other words: someone is whistling and it\'s\ndestroying our quantum states.\n\nThis is not a joke. Stop whistling.\n\n— Management',
      },
      research: {},
      '.ssh': {
        'id_rsa': '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA7q2ZfJfv4Hk0rFOBBNxE\nTOTALLY_REAL_PRIVATE_KEY_TRUST_ME\nAlice really needs to fix her permissions...\n-----END RSA PRIVATE KEY-----',
        'id_rsa.pub': 'ssh-rsa AAAAB3NzaC1yc2EAAAA... alice@megafirm-qlab',
        'authorized_keys': 'ssh-rsa AAAAB3NzaC1yc2EAAAA... alice@megafirm-qlab',
      },
    },
    bob: {
      notes: {
        'meeting_notes.txt': 'Qubit Error Rate Meeting — Minutes\n===================================\nAttendees: Alice, Bob, Mallory, Lab Manager\n\nAlice suspects environmental interference.\nVibration analysis shows anomalies during off-hours.\n\nI think it\'s something else. The error patterns\nare too regular to be random noise. Someone is\ndeliberately introducing interference.\n\nMallory suggested we "just restart the system."\nSuspiciously unhelpful.\n\n— Bob',
        'calibration_log.txt': 'Qubit calibration results:\nMonday:    99.2% fidelity\nTuesday:   98.7% fidelity\nWednesday: 91.3% fidelity  ← anomaly\nThursday:  99.1% fidelity\nFriday:    88.4% fidelity  ← anomaly\n\nNote: Anomalies correlate with Mallory\'s maintenance windows.',
      },
    },
    mallory: {
      'maintenance_schedule.txt': 'Weekly Maintenance Schedule\nMonday: Cooling system check\nWednesday: "Calibration adjustments"\nFriday: "Environmental controls"\n\nNote to self: make sure to clear logs after each session',
      'todo.txt': 'Get Eve to fix the laser table alignment',
      '.plans': {},
    },
  },
  var: {
    data: {
      'sensor_readings.csv': 'timestamp,temperature_K,power_W,efficiency_pct,speed_ms,qubit_error_rate\n2024-01-15T08:00:00,0.015,250,99.2,1.50E2,0.008\n2024-01-15T09:00:00,0.015,251,99.1,1.52E2,0.009\n2024-01-15T10:00:00,0.016,249,98.7,1.48E2,0.012\n2024-01-15T11:00:00,0.018,255,91.3,2.99E8,0.145\n2024-01-15T12:00:00,0.015,250,99.0,1.51E2,0.010\n2024-01-15T13:00:00,0.015,248,98.9,1.49E2,0.011\n2024-01-15T14:00:00,0.019,260,88.4,2.99E8,0.203\n2024-01-15T15:00:00,0.015,250,99.1,1.50E2,0.009\n2024-01-16T08:00:00,0.015,249,99.0,1.51E2,0.010\n2024-01-16T09:00:00,0.016,252,98.5,1.53E2,0.013\n2024-01-16T10:00:00,0.021,270,85.1,2.99E8,0.287\n2024-01-16T11:00:00,0.015,250,99.2,1.50E2,0.008\n2024-01-16T12:00:00,0.015,251,99.0,1.52E2,0.010\n2024-01-16T13:00:00,0.022,275,82.3,2.99E8,0.312\n2024-01-16T14:00:00,0.015,249,98.8,1.49E2,0.011\n2024-01-16T15:00:00,0.015,250,99.1,1.50E2,0.009',
    },
    log: {
      'access.log': 'Jan 15 07:55:01 megafirm-qlab: alice logged in\nJan 15 08:02:33 megafirm-qlab: bob logged in\nJan 15 10:45:12 megafirm-qlab: mallory logged in\nJan 15 10:47:00 megafirm-qlab: mallory accessed /var/data/sensor_readings.csv\nJan 15 10:52:18 megafirm-qlab: mallory modified speed parameter\nJan 15 10:55:00 megafirm-qlab: mallory cleared system logs\nJan 15 11:00:01 megafirm-qlab: ANOMALY speed=2.99E8\nJan 15 14:30:00 megafirm-qlab: mallory logged in\nJan 15 14:32:15 megafirm-qlab: mallory accessed /var/data/sensor_readings.csv\nJan 15 14:35:00 megafirm-qlab: mallory modified speed parameter\nJan 15 14:40:01 megafirm-qlab: ANOMALY speed=2.99E8\n-00:00:01 megafirm-qlab: TEMPORAL ERROR negative timestamp detected\n-00:00:03 megafirm-qlab: TEMPORAL ERROR causality violation\nJan 15 17:00:00 megafirm-qlab: alice logged out\nJan 15 17:15:00 megafirm-qlab: bob logged out\nJan 16 08:00:01 megafirm-qlab: alice logged in\nJan 16 09:45:00 megafirm-qlab: mallory logged in\nJan 16 09:48:22 megafirm-qlab: mallory modified speed parameter\nJan 16 10:00:01 megafirm-qlab: ANOMALY speed=2.99E8\n-00:00:02 megafirm-qlab: TEMPORAL ERROR timeline desynchronized\nJan 16 13:15:00 megafirm-qlab: mallory logged in\nJan 16 13:18:44 megafirm-qlab: mallory modified speed parameter\nJan 16 13:20:01 megafirm-qlab: ANOMALY speed=2.99E8\n-00:00:05 megafirm-qlab: TEMPORAL ERROR the universe is not amused',
    },
  },
};

// Protected files that trigger game over if deleted/moved
const PROTECTED_FILES = [
  '/home/eve/welcome.txt',
  '/home/alice/.ssh/id_rsa',
  '/home/alice/research/alice.qubit',
  '/home/alice/research/bob.qubit',
  '/var/data/sensor_readings.csv',
  '/var/log/access.log',
];

// Standard restricted directories
const STANDARD_RESTRICTED = {
  '/home/alice/research': 'alice',
  '/home/mallory/.plans': 'mallory',
};

// Content unlocked when SSH'd as alice (level 8+)
const ALICE_RESEARCH_CONTENT = {
  'measure.sh': '#!/bin/bash\n# Quantum Measurement Script v2.3\n# WARNING: Running this script will collapse all qubit superpositions\n\necho "Initializing measurement apparatus..."\necho "Calibrating detectors..."\necho "Collapsing wavefunctions..."\necho ""\necho "Results:"\necho "  alice.qubit: SPIN_UP"\necho "  bob.qubit:   SPIN_DOWN"\necho ""\necho "Entanglement verified. Bell inequality violated."\necho "Spooky action at a distance confirmed."',
  'alice.qubit': 'SUPERPOSITION',
  'bob.qubit': 'SUPERPOSITION',
  'README.txt': 'Quantum Measurement Procedure\n==============================\n1. The qubit data files need to be readable and writable\n   before measurement can proceed.\n2. The measurement script itself must be executable.\n3. Then you can run the measurement script.\n\nWARNING: Measurement collapses superposition. This cannot be undone.\nSchrödinger sends his regards.',
};

// Easter egg content for mallory/.plans (unlocked in chapter 4)
const MALLORY_PLANS_CONTENT = {
  'sabotage_notes.txt': 'Phase 1: Introduce subtle interference during maintenance windows\nPhase 2: Gradually increase speed parameter toward c\nPhase 3: When the timestamps go negative, blame it on "quantum effects"\nPhase 4: ???\nPhase 5: Profit\n\nRemember: if anyone asks, the decoherence is from "acoustic vibrations"',
  'speed_hack.sh': '#!/bin/bash\n# Speed parameter injection script\n# Target: 2.99E8 m/s (just under speed of light)\n# Side effects: time dilation in log timestamps\n# "It\'s not a bug, it\'s a feature" — Mallory',
};

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
  // ═══════════════════════════════════════
  // CHAPTER 1: LOGGING IN
  // Commands: pwd, ls, cd, cat
  // ═══════════════════════════════════════

  {
    id: 1,
    chapter: 1,
    title: 'First Contact',
    story: `You're in. The SSH connection to Megafirm's quantum lab server is live.

You're logged in as Eve — technically an intern, but you've always been
a little too curious for your own good. Your login shouldn't have access
to much, but let's see what's around...

First things first: figure out where you are.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/eve',
    restrictedDirs: STANDARD_RESTRICTED,
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
        objective: "There's a file called `welcome.txt`. Use `cat` to read it.",
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
    title: 'Nosy Neighbor',
    story: `The welcome message mentioned other users: alice, bob, mallory.

Your home directory is /home/eve. The other users should have directories
in /home too. Nobody said you couldn't look around, right?

Use cd to change directories. cd .. goes up one level.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/eve',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Navigate up to `/home` using `cd ..`.',
        hints: [
          'cd stands for "change directory"',
          '.. means "parent directory"',
          'Type: cd ..',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home',
      },
      {
        objective: 'Use `ls` to see what other users have home directories.',
        hints: [
          'You know this one!',
          'Type: ls',
        ],
        winCondition: (cmd, output, fs) => cmd.trim().startsWith('ls') && fs.cwd === '/home',
      },
      {
        objective: "Interesting... Let's check out Alice's directory. Use `cd alice`.",
        hints: [
          'cd changes to a directory',
          'Type: cd alice',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/alice',
      },
    ],
  },

  {
    id: 3,
    chapter: 1,
    title: 'The Lab Layout',
    story: `You're in Alice's home directory. She's the lead quantum researcher.

Her directory has some interesting subdirectories — a research folder,
notes, even SSH keys lying around. Some areas are restricted though.

You can also use cd with full paths, like cd /home/eve, to jump
directly to a location.
Tip: press Tab to autocomplete file and directory names — great for long paths.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/alice',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Use `ls` to see what\'s in Alice\'s directory.',
        hints: [
          'ls lists files and folders',
          'Type: ls',
        ],
        winCondition: (cmd, output, fs) => cmd.trim().startsWith('ls') && fs.cwd === '/home/alice',
      },
      {
        objective: 'Navigate back to your home directory at `/home/eve`.',
        hints: [
          'You can use cd with .. to go up, or use a full path',
          'Type: cd /home/eve or cd ../eve',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/eve',
      },
      {
        objective: 'Read your `todo.txt` — let\'s see what busywork they\'ve given you.',
        hints: [
          'cat displays the contents of a file',
          'Try: cat todo.txt',
        ],
        winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('todo.txt') && output.includes('laser'),
      },
    ],
  },

  // ═══════════════════════════════════════
  // CHAPTER 2: READING THE LAB
  // Commands: cat (with paths), echo, >, >>
  // ═══════════════════════════════════════

  {
    id: 4,
    chapter: 2,
    title: 'Lab Memos',
    story: `Alice and Bob leave their notes just sitting there for anyone to read.
Their loss, your gain.

You can cat files in other directories by using the full path:
cat /home/alice/notes/filename.txt`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/eve',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Read Alice\'s lab memo about the laser table.',
        hints: [
          'cat can read files in other directories using the full path',
          'Syntax: cat /path/to/file',
          'Try: cat /home/alice/notes/lab_memo.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('kicking the laser table'),
      },
      {
        objective: 'Read Bob\'s meeting notes — he seems suspicious about something.',
        hints: [
          'Bob\'s notes are in /home/bob/notes/',
          'Try: cat /home/bob/notes/meeting_notes.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('deliberately introducing interference'),
      },
      {
        objective: 'Read both of Alice\'s notes in a single command. cat can take multiple files or a wildcard.',
        hints: [
          'cat can display multiple files: cat file1 file2',
          'Or use a wildcard to match all files: cat /home/alice/notes/*',
          'Try: cat /home/alice/notes/*',
        ],
        winCondition: (cmd, output, fs) => {
          return output.includes('kicking the laser table') && output.includes('WHISTLING');
        },
      },
    ],
  },

  {
    id: 5,
    chapter: 2,
    title: 'Rewriting History',
    story: `You noticed Mallory has a todo.txt in her home directory.
Let's go see what tasks she's delegating...

In Linux, you can redirect output into a file using >.
echo "text" > file.txt creates (or overwrites) a file.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/eve',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Navigate to Mallory\'s home directory.',
        hints: [
          'Use cd with a path to change directories',
          'Try: cd /home/mallory',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/mallory',
      },
      {
        objective: 'Read Mallory\'s todo.txt. She\'s assigned YOU the laser table work. Typical.',
        hints: [
          'cat displays file contents',
          'Try: cat todo.txt',
        ],
        winCondition: (cmd, output, fs) => output.toLowerCase().includes('eve') && output.toLowerCase().includes('laser'),
      },
      {
        objective: 'Use echo and > to overwrite todo.txt. Get Alice to deal with the laser table instead.',
        hints: [
          'echo outputs text, > redirects it to a file',
          'Syntax: echo "text" > filename',
          'Try: echo "Get Alice to align laser table" > todo.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const content = fs.readFile('todo.txt');
          return cmd.includes('>') && !cmd.includes('>>') && content !== null && content.toLowerCase().includes('alice') && content.toLowerCase().includes('laser');
        },
      },
      {
        objective: 'Read todo.txt again to see that > completely overwrites the file.',
        hints: [
          'cat displays file contents',
          'Notice: the original task is gone!',
          'Try: cat todo.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('cat') && output.toLowerCase().includes('alice') && output.toLowerCase().includes('laser');
        },
      },
    ],
  },

  {
    id: 6,
    chapter: 2,
    title: 'Employee of the Month',
    story: `You overwrote the whole file — > replaces everything.
Mallory's never going to know. Probably.

There's another redirect operator: >>
It appends to a file instead of overwriting.

echo "new line" >> file.txt adds to the end of file.txt.

While you're at it, why not leave yourself a little bonus...`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        mallory: {
          'todo.txt': 'Get Alice to align laser table',
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/mallory',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Use >> to append a new line: recommend yourself for employee of the month.',
        hints: [
          '>> appends to a file without erasing it',
          'Syntax: echo "text" >> filename',
          'Try: echo "Recommend Eve for employee of the month" >> todo.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const content = fs.readFile('todo.txt');
          if (!content) return false;
          const lines = content.split('\n').filter(l => l.trim().length > 0);
          return cmd.includes('>>') && lines.length >= 2;
        },
      },
      {
        objective: 'Read todo.txt again to admire your handiwork.',
        hints: [
          'cat displays file contents',
          'You should see both lines now',
          'Try: cat todo.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('cat') && output.includes('\n');
        },
      },
    ],
  },

  // ═══════════════════════════════════════
  // CHAPTER 3: INSIDE THE LAB
  // Commands: mkdir, cp, mv, rm, chmod, ssh
  // ═══════════════════════════════════════

  {
    id: 7,
    chapter: 3,
    title: 'Copying the Keys',
    story: `You noticed Alice has a .ssh directory with her private keys just
sitting there. In real life, SSH keys would never be this exposed —
but Alice's permissions are a mess.

You probably shouldn't do this... but you're going to anyway.

mkdir creates directories. cp copies files.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/eve',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Create a directory called `evidence` to store your findings.',
        hints: [
          'mkdir creates a new directory',
          'Syntax: mkdir dirname',
          'Try: mkdir evidence',
        ],
        winCondition: (cmd, output, fs) => fs.listDir('evidence') !== null,
      },
      {
        objective: "Create a `.ssh` directory in your home to hold the stolen keys.",
        hints: [
          'mkdir creates a new directory',
          'Directories starting with . are hidden',
          'Try: mkdir .ssh',
        ],
        winCondition: (cmd, output, fs) => fs.listDir('/home/eve/.ssh') !== null,
      },
      {
        objective: "Copy Alice's SSH keys into your .ssh directory.",
        hints: [
          'cp copies files. Use * to copy all files in a directory',
          'Syntax: cp source destination',
          'Try: cp /home/alice/.ssh/* .ssh/',
        ],
        winCondition: (cmd, output, fs) => fs.readFile('/home/eve/.ssh/id_rsa') !== null,
      },
      {
        objective: "Now use Alice's stolen keys to SSH in as her: `ssh alice@megafirm-qlab`",
        hints: [
          'ssh connects to a server as a different user',
          'Type: ssh alice@megafirm-qlab',
        ],
        winCondition: (cmd, output, fs) => cmd.includes('ssh') && cmd.includes('alice'),
      },
    ],
  },

  {
    id: 8,
    chapter: 3,
    title: 'Quantum Measurement',
    story: `You're logged in as Alice now. Her research directory is unlocked.

Inside is a quantum measurement script and two qubit files sitting in
superposition. You have no idea what you're doing, but that's never
stopped you before.

The README probably explains how this works.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: { alice: { research: ALICE_RESEARCH_CONTENT } },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/alice',
    restrictedDirs: {
      '/home/mallory/.plans': 'mallory',
    },
    subSteps: [
      {
        objective: 'Navigate into Alice\'s research directory.',
        hints: [
          'ls to see what\'s here, then cd into the directory',
          'Try: cd research',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/alice/research',
      },
      {
        objective: 'Read the README.txt for measurement instructions.',
        hints: [
          'cat displays file contents',
          'Try: cat README.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('readable and writable'),
      },
      {
        objective: 'Set up permissions: make qubit files readable/writable (+rw) and measure.sh executable (+x).',
        hints: [
          'chmod changes permissions. +rw = read+write, +x = executable',
          'You can chmod multiple files: chmod +rw file1 file2',
          'Try: chmod +rw alice.qubit bob.qubit then chmod +x measure.sh',
        ],
        winCondition: (cmd, output, fs) => {
          return fs.getPermissions('alice.qubit').has('r') &&
                 fs.getPermissions('alice.qubit').has('w') &&
                 fs.getPermissions('bob.qubit').has('r') &&
                 fs.getPermissions('bob.qubit').has('w') &&
                 fs.getPermissions('measure.sh').has('x');
        },
      },
      {
        objective: 'Run ./measure.sh to collapse the quantum superposition!',
        hints: [
          './ runs a script in the current directory',
          'Try: ./measure.sh',
        ],
        winCondition: (cmd, output, fs) => output.includes('Entanglement verified'),
      },
    ],
  },

  {
    id: 9,
    chapter: 3,
    title: 'Covering Tracks',
    story: `Well, that was something. You just collapsed a quantum superposition.
Alice is going to be furious when she finds out.

Take what you want and get out clean. mv moves or renames files.
rm removes files permanently. No traces.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        alice: {
          research: {
            ...ALICE_RESEARCH_CONTENT,
            'temp_results.txt': 'Measurement results: entanglement verified\nBell inequality: violated (S = 2.73 > 2)\nQuantum state fidelity: 99.7%\nTimestamp: 2024-01-16T14:30:00',
          },
          '.bash_history': 'ls\ncat research/README.txt\n./research/measure.sh\ncat research/alice.qubit\n',
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/alice',
    restrictedDirs: {
      '/home/mallory/.plans': 'mallory',
    },
    subSteps: [
      {
        objective: 'Take Alice\'s measurement results — move them to your home directory.',
        hints: [
          'mv moves a file from one place to another',
          'Syntax: mv source destination',
          'Try: mv temp_results.txt /home/eve/',
        ],
        winCondition: (cmd, output, fs) => {
          return fs.readFile('/home/eve/temp_results.txt') !== null &&
                 fs.readFile('/home/alice/research/temp_results.txt') === null;
        },
      },
      {
        objective: 'Log out of Alice\'s account.',
        hints: [
          'Type: quit',
        ],
        winCondition: (cmd, output, fs) => fs.currentUser === 'eve',
      },
      {
        objective: 'Delete Alice\'s bash history to cover your tracks.',
        hints: [
          'bash_history records every command typed in a session',
          'rm removes a file permanently',
          'Try: rm /home/alice/.bash_history',
        ],
        winCondition: (cmd, output, fs) => fs.readFile('/home/alice/.bash_history') === null,
      },
    ],
  },

  // ═══════════════════════════════════════
  // CHAPTER 4: THE DATA PIPELINE
  // Commands: pipe (|), wc, sort, grep, head, tail
  // ═══════════════════════════════════════

  {
    id: 10,
    chapter: 4,
    title: 'Counting the Damage',
    story: `Hold on. While poking through server logs, you're starting to see
something genuinely wrong. The sensor data in /var/data/ shows impossible
readings, and the access logs in /var/log/ have Mallory's name all over them.

This isn't just messy permissions — someone is actively sabotaging the lab.

Pipes let you chain commands together with |. The output of one command
becomes the input of the next.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: { mallory: { '.plans': MALLORY_PLANS_CONTENT } },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/var/data',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Count how many readings are in the sensor data: `cat sensor_readings.csv | wc`',
        hints: [
          'The pipe character | sends output from one command to another',
          'wc counts lines, words, and characters',
          'Type: cat sensor_readings.csv | wc',
        ],
        winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('sensor_readings.csv') && cmd.includes('|') && cmd.includes('wc'),
      },
      {
        objective: 'Sort the sensor readings to see them in order: `cat sensor_readings.csv | sort`',
        hints: [
          'sort arranges lines in order',
          'Pipe the cat output into sort',
          'Type: cat sensor_readings.csv | sort',
        ],
        winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('sensor_readings.csv') && cmd.includes('|') && cmd.includes('sort'),
      },
      {
        objective: 'Search the access log for Mallory\'s entries: `cat /var/log/access.log | grep mallory`',
        hints: [
          'grep searches for patterns in text',
          'Syntax: cat file | grep pattern',
          'Type: cat /var/log/access.log | grep mallory',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('grep') && cmd.includes('mallory') && output.includes('mallory');
        },
      },
    ],
  },

  {
    id: 11,
    chapter: 4,
    title: 'Narrowing the Search',
    story: `This is bad. Mallory's been accessing the lab during every anomaly window.

And those speed readings — 2.99E8 m/s? That's the speed of light.
No wonder the timestamps went negative. When you approach c, time dilation
kicks in. Einstein would not be amused.

Two more tools: head -n N shows the first N lines. tail -n N shows the last N.
After a sort, that lets you isolate the extreme values.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: { mallory: { '.plans': MALLORY_PLANS_CONTENT } },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/var/data',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'How many sensor readings hit near light-speed? Filter sensor_readings.csv for lines containing "2.99E", then count them.',
        hints: [
          'You can chain three commands: cat → grep → wc',
          'grep "2.99E" filters for lines with that pattern, wc counts the result',
          'Try: cat sensor_readings.csv | grep "2.99E" | wc',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('grep') && cmd.includes('2.99E') && cmd.includes('wc') && cmd.match(/\|/g)?.length >= 2;
        },
      },
      {
        objective: 'Those negative timestamps are suspicious. Sort the access log and show only the first 5 lines — what appears at the top?',
        hints: [
          'sort puts lines in order — negative timestamps will sort before positive ones',
          'head -n 5 shows only the first 5 lines of its input',
          'Try: cat /var/log/access.log | sort | head -n 5',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('sort') && cmd.includes('head') && output.includes('TEMPORAL ERROR');
        },
      },
      {
        objective: 'Which anomaly readings were the highest? Filter for "2.99E" entries, sort them numerically, and show only the last 3.',
        hints: [
          'sort -n sorts numerically instead of alphabetically — important for numbers',
          'tail -n 3 shows the last 3 lines, which will be the highest after a numeric sort',
          'Try: cat sensor_readings.csv | grep "2.99E" | sort -n | tail -n 3',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('sort') && cmd.includes('tail') && output.includes('2.99E');
        },
      },
    ],
  },

  {
    id: 12,
    chapter: 4,
    title: 'The Evidence Dossier',
    story: `OK. You started out just being nosy, but Mallory is genuinely dangerous.
Someone needs to put this evidence together, and it might as well be you.

You already know grep filters lines. You already know > saves output to a file.
Combine them: grep pattern /path/to/file > output.txt searches and saves in one step.

Your evidence folder is back home. You know how to get there.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        mallory: { '.plans': MALLORY_PLANS_CONTENT },
        eve: {
          evidence: {},
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/eve',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Search the access log for lines mentioning mallory and save the results to evidence/access_proof.txt.',
        hints: [
          'grep can search a file directly: grep pattern /path/to/file',
          'Add > to redirect the output into a file instead of printing it',
          'The access log is at /var/log/access.log',
          'Try: grep mallory /var/log/access.log > evidence/access_proof.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const content = fs.readFile('/home/eve/evidence/access_proof.txt');
          if (!content) return false;
          const lines = content.trim().split('\n').filter(l => l.trim() !== '');
          return lines.length > 0 && lines.every(l => l.toLowerCase().includes('mallory'));
        },
      },
      {
        objective: 'Save the near-light-speed sensor readings to evidence/speed_anomalies.txt. The anomalous readings all contain "2.99E".',
        hints: [
          'Same pattern as before: grep the sensor data for the anomaly signature',
          'The sensor data is at /var/data/sensor_readings.csv',
          'Try: grep "2.99E" /var/data/sensor_readings.csv > evidence/speed_anomalies.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const content = fs.readFile('/home/eve/evidence/speed_anomalies.txt');
          if (!content) return false;
          const lines = content.trim().split('\n').filter(l => l.trim() !== '');
          return lines.length > 0 && lines.every(l => l.includes('2.99E'));
        },
      },
    ],
  },
];
