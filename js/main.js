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

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

function setupMobileInput(term, game) {
  document.body.classList.add('is-mobile');

  const bar   = document.getElementById('mobile-input-bar');
  const input = document.getElementById('mobile-input');
  const btn   = document.getElementById('mobile-send');
  const promptEl = document.getElementById('mobile-prompt');

  bar.style.display = 'flex';

  function refreshPrompt() {
    const user = game.fs.currentUser || 'eve';
    const homePath = game.fs.homePath || '/home/eve';
    const path = game.fs.cwd === homePath
      ? '~'
      : game.fs.cwd.startsWith(homePath)
        ? game.fs.cwd.replace(homePath, '~')
        : game.fs.cwd;
    promptEl.textContent = `${user}@megafirm-qlab:${path}$ `;
  }

  function submit() {
    const cmd = input.value;
    input.value = '';
    if (!cmd.trim()) return;
    term.exec(cmd);
    refreshPrompt();
    // Scroll terminal to bottom after a tick so output renders first
    setTimeout(() => term.scroll_to_bottom(), 50);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });

  btn.addEventListener('click', submit);

  refreshPrompt();

  // Keep prompt in sync after every command
  const origExec = term.exec.bind(term);
  term.exec = function(...args) {
    const result = origExec(...args);
    // exec may return a promise
    Promise.resolve(result).then(() => refreshPrompt());
    return result;
  };
}

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

      if (isMobile) {
        // On mobile, use a simple tap-to-restart via the input bar
        const input = document.getElementById('mobile-input');
        input.placeholder = 'Press Enter to restart...';
        const restartHandler = (e) => {
          if (e.key === 'Enter') {
            input.removeEventListener('keydown', restartHandler);
            input.placeholder = '';
            termInstance.clear();
            const restartResult = game.restartLevel();
            printLevelHeader(termInstance, game.currentLevel, restartResult.levelTitle);
            printStory(termInstance, restartResult.story);
            printObjective(termInstance, restartResult.objective);
          }
        };
        input.addEventListener('keydown', restartHandler);
        return;
      }

      // Desktop: use push to create a temporary handler that accepts any input
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
      localStorage.setItem('savedUser', game.currentUser);
      this.clear();
      printLevelHeader(this, game.currentLevel, result.levelTitle);
      printStory(this, result.story);
      printObjective(this, result.newObjective);
    }
  }, {
    greetings: false,
    prompt: () => formatPrompt(game.fs),
    completion: isMobile ? false : function(word) {
      return getCompletions(word, this.get_command(), game.fs);
    },
    completionEscape: false,
    mobileDelete: true,
    keydown: function(e) {
      // Ctrl+D = logout/exit (like real bash)
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.exec('exit');
        return false;
      }
    },
    onInit: function() {
      printLevelHeader(this, game.currentLevel, game.getLevelTitle());
      printStory(this, game.getStory());
      printObjective(this, game.getObjective());

      if (isMobile) {
        setupMobileInput(this, game);
      }
    },
  });
});