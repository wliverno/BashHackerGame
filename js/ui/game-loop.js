import { levels } from '../gameplay/levels.js';
import { createFilesystem } from '../engine/filesystem.js';
import { executePipeline } from '../engine/executor.js';

function checkProtectedFiles(fs, protectedFiles) {
  for (const filepath of protectedFiles) {
    const file = fs.readFile(filepath);
    if (file === null) {
      return filepath; // Return the missing file path
    }
  }
  return null; // All protected files present
}

export function createGame() {
  let currentLevel = 0;
  let currentSubStep = 0;
  let hintIndex = 0;
  let won = false;
  let currentUser = 'eve';

  const loadLevel = (levelIndex) => {
    const level = levels[levelIndex];
    const fs = createFilesystem(level.filesystem);
    fs.cwd = level.startDir;
    fs.restrictedDirs = level.restrictedDirs || {};
    fs.currentUser = currentUser;
    return fs;
  };

  let fs = loadLevel(0);

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

      const level = levels[currentLevel];

      // Check if any protected files were deleted/moved
      if (level.protectedFiles) {
        const missingFile = checkProtectedFiles(fs, level.protectedFiles);
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
          currentLevel++;
          currentSubStep = 0;
          fs = loadLevel(currentLevel);
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
