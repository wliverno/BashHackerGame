import { createGame } from './ui/game-loop.js';
import {
  formatPrompt,
  printStory,
  printObjective,
  printLevelHeader,
  printWinScreen,
  printChapterComplete,
  getCompletions,
} from './ui/terminal.js';

$(function() {
  const savedLevel = parseInt(localStorage.getItem('savedLevel') || '0');
  const savedUser = localStorage.getItem('savedUser') || 'eve';
  const game = createGame({ startLevel: savedLevel, startUser: savedUser });
  const term = $('#terminal').terminal(function(command) {
    if (!command.trim()) return;

    const result = game.runCommand(command);

    if (result.clear) {
      this.clear();
      return;
    }

    // Handle game over
    if (result.gameOver) {
      const termInstance = this;
      this.echo(`[[;#f44;]${result.output}]`);

      // Use push to create a temporary handler that accepts any input
      this.push(function(command) {
        termInstance.pop(); // Remove this temporary handler
        termInstance.clear();

        const restartResult = game.restartLevel();
        printLevelHeader(termInstance, game.currentLevel, restartResult.levelTitle);
        printStory(termInstance, restartResult.story);
        printObjective(termInstance, restartResult.objective);
      }, {
        prompt: '',
        keydown: function(e) {
          // Any keypress restarts
          termInstance.pop();
          termInstance.clear();

          const restartResult = game.restartLevel();
          printLevelHeader(termInstance, game.currentLevel, restartResult.levelTitle);
          printStory(termInstance, restartResult.story);
          printObjective(termInstance, restartResult.objective);

          return false; // Prevent key from being processed
        }
      });
      return;
    }

    if (result.output) {
      if (result.exitCode !== 0) {
        this.echo(`[[;#f44;]${result.output}]`);
      } else if (result.output.startsWith('Hint:')) {
        this.echo(`[[;#fa0;]${result.output}]`);
      } else {
        this.echo(result.output);
      }
    }

    if (result.advanced) {
      this.echo('[[;#0f0;]✓ Nice work!]');

      if (result.won) {
        printWinScreen(this);
        return;
      }

      if (result.chapterComplete) {
        printChapterComplete(this, result.completedChapter);
      }

      if (result.newLevel) {
        localStorage.setItem('savedLevel', game.currentLevel);
        localStorage.setItem('savedUser', game.currentUser);
        printLevelHeader(this, game.currentLevel, result.levelTitle);
        printStory(this, result.story);
      }

      printObjective(this, result.newObjective);
    }

    if (result.gotoLevel) {
      localStorage.setItem('savedLevel', game.currentLevel);
      localStorage.setItem('savedUser', 'eve');
      this.clear();
      printLevelHeader(this, game.currentLevel, result.levelTitle);
      printStory(this, result.story);
      printObjective(this, result.newObjective);
    }
  }, {
    greetings: false,
    prompt: () => formatPrompt(game.fs),
    completion: (str) => getCompletions(str, game.fs),
    wordAutocomplete: false,
    completionEscape: false,
    onInit: function() {
      printLevelHeader(this, game.currentLevel, game.getLevelTitle());
      printStory(this, game.getStory());
      printObjective(this, game.getObjective());
    },
  });
});
