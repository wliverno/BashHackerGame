import { levels } from '../gameplay/levels.js';
import { createFilesystem } from '../engine/filesystem.js';
import { executePipeline } from '../engine/executor.js';

export function createGame() {
  let currentLevel = 0;
  let currentSubStep = 0;
  let hintIndex = 0;
  let won = false;

  const loadLevel = (levelIndex) => {
    const level = levels[levelIndex];
    const fs = createFilesystem(level.filesystem);
    fs.cwd = level.startDir;
    return fs;
  };

  let fs = loadLevel(0);

  const game = {
    get currentLevel() { return currentLevel; },
    get currentSubStep() { return currentSubStep; },
    get fs() { return fs; },
    get won() { return won; },

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

    runCommand(input) {
      if (input.trim() === 'hint') {
        const hint = this.getNextHint();
        return {
          output: `Hint: ${hint}`,
          exitCode: 0,
        };
      }

      const result = executePipeline(input, fs);

      const level = levels[currentLevel];
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
