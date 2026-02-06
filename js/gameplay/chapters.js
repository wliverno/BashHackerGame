export const chapters = [
  {
    id: 1,
    title: 'Getting In',
    description: 'You\'re in. The server is quiet. Figure out where you are and what\'s here.',
    commands: ['ls', 'cd', 'pwd'],
  },
  {
    id: 2,
    title: 'Reading the Server',
    description: 'Data is everywhere on this thing. You need to read it — and sometimes write to it.',
    commands: ['cat', 'echo', '>', '>>'],
  },
  {
    id: 3,
    title: 'Moving Pieces',
    description: 'You need to organize what you\'ve found — and cover your tracks.',
    commands: ['mkdir', 'cp', 'mv', 'rm', 'chmod'],
  },
  {
    id: 4,
    title: 'The Data Pipeline',
    description: 'The server is full of noise. You need to filter signal from static.',
    commands: ['|', 'wc', 'sort'],
  },
  // Chapters 5-7 to be implemented
];

export function getChapter(chapterId) {
  return chapters.find(ch => ch.id === chapterId);
}

export function getChapterForLevel(levelId) {
  // Levels 1-3 = Chapter 1, 4-6 = Chapter 2, etc.
  const chapterNum = Math.ceil(levelId / 3);
  return getChapter(chapterNum);
}
