// Base filesystem structure for the Megafirm Quantum Research Lab server
// This persists across most levels - levels can extend or override as needed
const BASE_FILESYSTEM = {
  home: {
    eve: {
      '.bash_history': 'ssh eve@megafirm-qlab\nls\npwd',
      'welcome.txt': 'Welcome to the Megafirm Quantum Research Lab server.\nAll activity is monitored and logged.\nPlease report any anomalies to the lab manager.\n\nOther users on this system: alice, bob, mallory',
      'todo.txt': '1. Review access logs for anomalies\n2. Check qubit calibration status\n3. Investigate reported equipment tampering',
    },
    alice: {
      notes: {
        'lab_memo.txt': 'REMINDER: Whoever keeps kicking the laser table — STOP.\nWe lost 3 hours of alignment yesterday.\nThe next person caught doing this will be assigned to clean the cryostat.\n\n— Alice',
        'safety_notice.txt': 'OFFICIAL NOTICE: NO WHISTLING IN THE LAB\n\nThe qubits are experiencing anomalous decoherence.\nAfter extensive debugging, we traced the issue to\nacoustic vibrations in the 1-2 kHz range.\n\nIn other words: someone is whistling and it\'s\ndestroying our quantum states.\n\nThis is not a joke. Stop whistling.\n\n— Management',
      },
      research: {
        'measure.sh': '#!/bin/bash\n# Quantum Measurement Script v2.3\n# WARNING: Running this script will collapse all qubit superpositions\n\necho "Initializing measurement apparatus..."\necho "Calibrating detectors..."\necho "Collapsing wavefunctions..."\necho ""\necho "Results:"\necho "  alice.qubit: SPIN_UP"\necho "  bob.qubit:   SPIN_DOWN"\necho ""\necho "Entanglement verified. Bell inequality violated."\necho "Spooky action at a distance confirmed."',
        'alice.qubit': 'SUPERPOSITION',
        'bob.qubit': 'SUPERPOSITION',
        'README.txt': 'Quantum Measurement Procedure\n==============================\n1. Ensure qubit files (alice.qubit, bob.qubit) are readable and writable\n   Use: chmod +rw alice.qubit bob.qubit\n2. Make the measurement script executable\n   Use: chmod +x measure.sh\n3. Run the measurement\n   Use: ./measure.sh\n\nWARNING: Measurement collapses superposition. This cannot be undone.\nSchrödinger sends his regards.',
      },
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
      '.plans': {
        'sabotage_notes.txt': 'Phase 1: Introduce subtle interference during maintenance windows\nPhase 2: Gradually increase speed parameter toward c\nPhase 3: When the timestamps go negative, blame it on "quantum effects"\nPhase 4: ???\nPhase 5: Profit\n\nRemember: if anyone asks, the decoherence is from "acoustic vibrations"',
        'speed_hack.sh': '#!/bin/bash\n# Speed parameter injection script\n# Target: 2.99E8 m/s (just under speed of light)\n# Side effects: time dilation in log timestamps\n# "It\'s not a bug, it\'s a feature" — Mallory',
      },
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

You're logged in as Eve — a security auditor brought in to investigate
reports of equipment tampering. Something is wrong with their quantum computer.

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
in /home too. Time to see who else is on this server.

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

Her directory has some interesting subdirectories. But be careful —
some areas might be restricted.

You can also use cd with full paths, like cd /home/eve, to jump
directly to a location.`,
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
        objective: 'Read your `todo.txt` to see what you need to investigate.',
        hints: [
          'cat displays the contents of a file',
          'Try: cat todo.txt',
        ],
        winCondition: (cmd, output, fs) => cmd.includes('cat') && cmd.includes('todo.txt') && output.includes('anomalies'),
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
    story: `Time to dig into the lab communications. Alice and Bob have notes
in their home directories that might reveal what's going on.

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
        objective: 'Read both of Alice\'s notes in a single command. cat can take multiple files.',
        hints: [
          'cat can display multiple files: cat file1 file2',
          'Try: cat /home/alice/notes/lab_memo.txt /home/alice/notes/safety_notice.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('lab_memo.txt') && cmd.includes('safety_notice.txt');
        },
      },
    ],
  },

  {
    id: 5,
    chapter: 2,
    title: 'Rewriting History',
    story: `There's a tasks.txt file in your home directory — assigned by the lab manager.

In Linux, you can redirect output into a file using >.
echo "text" > file.txt creates (or overwrites) a file.

Let's see what thankless tasks you've been assigned...`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        eve: {
          'tasks.txt': '1. Fix the laser table alignment (AGAIN)\n2. Recalibrate qubit sensors\n3. Update lab safety documentation\n4. Clean the cryostat\n5. Apologize to the laser table',
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/eve',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Read your assigned tasks with `cat tasks.txt`.',
        hints: [
          'cat displays file contents',
          'Try: cat tasks.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('Fix the laser table'),
      },
      {
        objective: 'Use echo and > to overwrite tasks.txt. Delegate the laser table to Alice.',
        hints: [
          'echo outputs text, > redirects it to a file',
          'Syntax: echo "text" > filename',
          'Try: echo "Tell Alice to fix laser table" > tasks.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const content = fs.readFile('tasks.txt');
          return cmd.includes('>') && !cmd.includes('>>') && content !== null && !content.includes('Fix the laser table alignment');
        },
      },
      {
        objective: 'Read tasks.txt again to see that > completely overwrites the file.',
        hints: [
          'cat displays file contents',
          'Notice: all the original tasks are gone!',
          'Try: cat tasks.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('cat') && cmd.includes('tasks.txt') && output.length > 0;
        },
      },
    ],
  },

  {
    id: 6,
    chapter: 2,
    title: 'Employee of the Month',
    story: `You overwrote the whole file — > replaces everything.

There's another redirect operator: >>
It appends to a file instead of overwriting.

echo "new line" >> file.txt adds to the end of file.txt.

Time to add one more item to your revised task list...`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        eve: {
          'tasks.txt': 'Tell Alice to fix laser table',
        },
      },
    }),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/eve',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Read your current tasks.txt.',
        hints: [
          'cat displays file contents',
          'Try: cat tasks.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('Alice') && output.includes('laser'),
      },
      {
        objective: 'Use >> to append a new line: recommend yourself for employee of the month.',
        hints: [
          '>> appends to a file without erasing it',
          'Syntax: echo "text" >> filename',
          'Try: echo "Recommend Eve for employee of the month" >> tasks.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const content = fs.readFile('tasks.txt');
          return cmd.includes('>>') && cmd.includes('tasks.txt') && content && content.includes('Alice');
        },
      },
      {
        objective: 'Read tasks.txt again to admire your handiwork.',
        hints: [
          'cat displays file contents',
          'You should see both lines now',
          'Try: cat tasks.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.trim().startsWith('cat') && cmd.includes('tasks.txt');
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
    story: `You noticed Alice has a .ssh directory with her private keys.

Normally, you'd NEVER be able to just copy someone's SSH keys like this.
Alice really needs to fix her file permissions. But hey, you're a
security auditor — finding these vulnerabilities is literally your job.

mkdir creates directories. cp copies files. cp -r copies directories.`,
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
        objective: "Copy Alice's .ssh directory to your home. Use `cp -r` for directories.",
        hints: [
          'cp -r copies directories recursively',
          'Syntax: cp -r source destination',
          'Try: cp -r /home/alice/.ssh /home/eve/.ssh',
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
    story: `You're logged in as Alice now. Her research directory is accessible.

Inside is a quantum measurement script (measure.sh) and two qubit files.
The qubits are in superposition — both SPIN_UP and SPIN_DOWN simultaneously.

To run the measurement, the qubit files need to be readable/writable
and the script needs to be executable. Read the README for instructions.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
    protectedFiles: PROTECTED_FILES,
    startDir: '/home/alice/research',
    restrictedDirs: {
      '/home/mallory/.plans': 'mallory',
    },
    subSteps: [
      {
        objective: 'Read the README.txt for measurement instructions.',
        hints: [
          'cat displays file contents',
          'Try: cat README.txt',
        ],
        winCondition: (cmd, output, fs) => output.includes('chmod'),
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
    story: `The quantum measurement worked. The qubits collapsed exactly as predicted —
alice.qubit is SPIN_UP, bob.qubit is SPIN_DOWN. Entanglement confirmed.

But you've been leaving traces everywhere. Before Mallory notices someone's
been poking around, you need to move evidence to safety and clean up.

mv moves files (or renames them). rm removes files permanently.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
        alice: {
          'temp_results.txt': 'Measurement results: entanglement verified\nBell inequality: violated (S = 2.73 > 2)\nQuantum state fidelity: 99.7%\nTimestamp: 2024-01-16T14:30:00',
          old_logs: {
            'debug_jan14.log': 'DEBUG: qubit initialization sequence started\nDEBUG: cooling system nominal\nDEBUG: measurement apparatus calibrated',
            'debug_jan15.log': 'DEBUG: anomalous speed reading detected\nDEBUG: timestamp synchronization error\nDEBUG: this is fine. everything is fine.',
          },
        },
        eve: {
          evidence: {},
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
        objective: 'Move the measurement results to Eve\'s evidence folder.',
        hints: [
          'mv moves files from one location to another',
          'Syntax: mv source destination',
          'Try: mv temp_results.txt /home/eve/evidence/',
        ],
        winCondition: (cmd, output, fs) => {
          return fs.readFile('/home/eve/evidence/temp_results.txt') !== null && fs.readFile('temp_results.txt') === null;
        },
      },
      {
        objective: 'Delete the old debug logs — they show you were here.',
        hints: [
          'rm -r removes directories and everything inside',
          'Try: rm -r old_logs',
        ],
        winCondition: (cmd, output, fs) => fs.listDir('old_logs') === null,
      },
      {
        objective: 'Navigate to Mallory\'s home directory to investigate.',
        hints: [
          'Use cd with a full path',
          'Try: cd /home/mallory',
        ],
        winCondition: (cmd, output, fs) => fs.cwd === '/home/mallory',
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
    story: `You're in Mallory's home directory. Suspicious maintenance schedule...

But the real evidence is in the server's data logs. The sensor readings
in /var/data/ and access logs in /var/log/ should tell the whole story.

Pipes let you chain commands together with |. The output of one command
becomes the input of the next.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
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
    story: `The data is revealing patterns. Mallory's been accessing the lab at odd hours.

And those speed readings — 2.99E8 m/s? That's the speed of light!
No wonder the timestamps went negative. When you approach c, time dilation
kicks in. Einstein would not be amused.

Chain multiple pipes to narrow down the evidence.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {}),
    protectedFiles: PROTECTED_FILES,
    startDir: '/var/data',
    restrictedDirs: STANDARD_RESTRICTED,
    subSteps: [
      {
        objective: 'Count how many readings hit near light-speed: `cat sensor_readings.csv | grep "2.99E" | wc`',
        hints: [
          'Chain: cat → grep → wc',
          'grep filters for lines containing a pattern',
          'Type: cat sensor_readings.csv | grep "2.99E" | wc',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('grep') && cmd.includes('2.99E') && cmd.includes('wc') && cmd.match(/\|/g)?.length >= 2;
        },
      },
      {
        objective: 'Find the earliest access log entries (negative timestamps!): `cat /var/log/access.log | sort | head -n 5`',
        hints: [
          'sort orders lines, head -n 5 shows the first 5',
          'The negative timestamps should sort to the top',
          'Type: cat /var/log/access.log | sort | head -n 5',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('sort') && cmd.includes('head') && output.includes('TEMPORAL ERROR');
        },
      },
      {
        objective: 'Find the worst speed anomalies: `cat sensor_readings.csv | grep "2.99E" | sort -n | tail -n 3`',
        hints: [
          'sort -n sorts numerically, tail -n 3 shows last 3 lines',
          'Type: cat sensor_readings.csv | grep "2.99E" | sort -n | tail -n 3',
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
    story: `Time to compile the evidence. Pipes and redirects work together — you can
process data with pipelines, then save the results to files.

Build your final dossier. The quantum computer — and the integrity
of spacetime itself — depends on it.`,
    filesystem: mergeFilesystem(BASE_FILESYSTEM, {
      home: {
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
        objective: 'Extract Mallory\'s access records into evidence: `cat /var/log/access.log | grep mallory > evidence/access_proof.txt`',
        hints: [
          'grep filters lines, > redirects to a file',
          'Type: cat /var/log/access.log | grep mallory > evidence/access_proof.txt',
        ],
        winCondition: (cmd, output, fs) => {
          return cmd.includes('grep') && cmd.includes('mallory') && cmd.includes('>') && fs.readFile('evidence/access_proof.txt')?.includes('mallory');
        },
      },
      {
        objective: 'Extract the speed anomalies: `cat /var/data/sensor_readings.csv | grep "2.99E" > evidence/speed_anomalies.txt`',
        hints: [
          'Same idea — grep for the anomalous speed, redirect to file',
          'Type: cat /var/data/sensor_readings.csv | grep "2.99E" > evidence/speed_anomalies.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const content = fs.readFile('evidence/speed_anomalies.txt');
          return cmd.includes('grep') && cmd.includes('2.99E') && cmd.includes('>') && content && content.includes('2.99E');
        },
      },
      {
        objective: 'Compile the final dossier: combine and sort all evidence into evidence/final_dossier.txt',
        hints: [
          'cat can combine multiple files, sort orders them',
          'Use >> to append to the dossier',
          'Type: cat evidence/access_proof.txt evidence/speed_anomalies.txt | sort >> evidence/final_dossier.txt',
        ],
        winCondition: (cmd, output, fs) => {
          const dossier = fs.readFile('evidence/final_dossier.txt');
          return cmd.includes('sort') && cmd.includes('>>') && cmd.includes('dossier.txt') && dossier && dossier.length > 0;
        },
      },
    ],
  },
];
