import { explainSuccessfulCommand } from '../js/gameplay/command-explanations.js';

describe('explainSuccessfulCommand', () => {
  describe('wc with flags', () => {
    test('wc -l counts only lines', () => {
      expect(explainSuccessfulCommand('wc -l')).toContain('counted lines.');
    });

    test('wc -w counts only words', () => {
      expect(explainSuccessfulCommand('wc -w')).toContain('counted words.');
    });

    test('wc -c counts only characters', () => {
      expect(explainSuccessfulCommand('wc -c')).toContain('counted characters.');
    });

    test('wc with no flags counts lines, words, and characters', () => {
      expect(explainSuccessfulCommand('wc')).toContain('counted lines, words, and characters.');
    });
  });

  describe('ssh with user and host', () => {
    test('ssh user@host mentions both user and host', () => {
      const result = explainSuccessfulCommand('ssh eve@alice-lab');
      expect(result).toContain('`eve`');
      expect(result).toContain('`alice-lab`');
    });

    test('ssh with only host (no @) still works', () => {
      const result = explainSuccessfulCommand('ssh alice-lab');
      expect(result).toContain('`alice-lab`');
    });
  });

  describe('chmod', () => {
    test('chmod numeric mode gives generic description', () => {
      expect(explainSuccessfulCommand('chmod 755 script.sh')).toContain('changed permissions on `script.sh`');
    });

    test('chmod 644 gives generic description', () => {
      expect(explainSuccessfulCommand('chmod 644 file.txt')).toContain('changed permissions on `file.txt`');
    });
  });
});
