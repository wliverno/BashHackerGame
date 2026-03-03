import { levels } from '../gameplay/levels.js';
import { createFilesystem } from '../engine/filesystem.js';
import { executePipeline } from '../engine/executor.js';

function checkProtectedFiles(fs, activeProtectedFiles) {
  for (const filepath of activeProtectedFiles) {
    if (fs.readFile(filepath) === null) {
      return filepath;
    }
  }
  return null;
}

function snapshotProtectedFiles(fs, protectedFiles) {
  // Only track files that actually exist at level start
  return (protectedFiles || []).filter(f => fs.readFile(f) !== null);
}

export function createGame({ startLevel = 0, startUser = 'eve' } = {}) {
  let currentLevel = startLevel;
  let currentSubStep = 0;
  let hintIndex = 0;
  let won = false;
  let currentUser = startUser;

  let activeProtectedFiles = [];

  const loadLevel = (levelIndex, preservedCwd = null) => {
    const level = levels[levelIndex];
    const fs = createFilesystem(level.filesystem);
    fs.cwd = preservedCwd ?? level.startDir;
    fs.restrictedDirs = level.restrictedDirs || {};
    fs.currentUser = currentUser;
    activeProtectedFiles = snapshotProtectedFiles(fs, level.protectedFiles);
    return fs;
  };

  let fs = loadLevel(startLevel);

  const game = {
    get currentLevel() { return currentLevel; },
    get currentSubStep() { return currentSubStep; },
    get fs() { return fs; },
    get won() { return won; },
    get currentUser() { return currentUser; },

    switchUser(user) {
      currentUser = user;
      fs.currentUser = user;
    },

    getObjective() {
      return levels[currentLevel].subSteps[currentSubStep].objective;
    },

    getHint(index) {
      const hints = levels[currentLevel].subSteps[currentSubStep].hints;
      if (index < hints.length) {
        return hints[index];
      }
      return hints[hints.length - 1];
    },

    getNextHint() {
      const hint = this.getHint(hintIndex);
      hintIndex++;
      return hint;
    },

    getStory() {
      return levels[currentLevel].story;
    },

    getLevelTitle() {
      return levels[currentLevel].title;
    },

    restartLevel() {
      hintIndex = 0;
      currentSubStep = 0;
      fs = loadLevel(currentLevel);
      return {
        restarted: true,
        story: this.getStory(),
        levelTitle: this.getLevelTitle(),
        objective: this.getObjective(),
      };
    },

    runCommand(input) {
      if (input.trim() === 'hint') {
        const hint = this.getNextHint();
        return {
          output: `Hint: ${hint}`,
          exitCode: 0,
        };
      }

      const result = executePipeline(input, fs);

      // Handle user switching (e.g., from ssh command)
      if (result.switchUser) {
        currentUser = result.switchUser;
        fs.currentUser = result.switchUser;
        fs.homePath = '/home/' + result.switchUser;
      }

      if (result.switchCwd) {
        fs.cwd = result.switchCwd;
      }

      const level = levels[currentLevel];

      // Check if any protected files were deleted/moved
      if (activeProtectedFiles.length > 0) {
        const missingFile = checkProtectedFiles(fs, activeProtectedFiles);
        if (missingFile) {
          result.gameOver = true;
          result.missingFile = missingFile;
          result.output = `\nSYSTEM ALERT: Critical file destroyed.\nSecurity breach detected.\nConnection terminated.\n\nPress any key to restart level...`;
          return result;
        }
      }

      const step = level.subSteps[currentSubStep];

      if (step.winCondition(input, result.output, fs)) {
        result.advanced = true;
        hintIndex = 0;

        if (currentSubStep < level.subSteps.length - 1) {
          currentSubStep++;
          result.newObjective = this.getObjective();
        } else if (currentLevel < levels.length - 1) {
          const prevCwd = fs.cwd;
          currentLevel++;
          currentSubStep = 0;
          fs = loadLevel(currentLevel, prevCwd);
          if (levels[currentLevel].chapter !== levels[currentLevel - 1].chapter) {
            result.chapterComplete = true;
            result.completedChapter = levels[currentLevel - 1].chapter;
          }
          result.newLevel = true;
          result.newObjective = this.getObjective();
          result.story = this.getStory();
          result.levelTitle = this.getLevelTitle();
        } else {
          won = true;
          result.won = true;
        }
      }

      return result;
    },
  };

  return game;
}
