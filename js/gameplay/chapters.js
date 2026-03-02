export const chapters = [
  {
    id: 1,
    title: 'Logging In',
    description: 'You\'ve SSH\'d into the Megafirm quantum lab server. Figure out where you are and who else is here.',
    commands: ['ls', 'cd', 'pwd', 'cat'],
  },
  {
    id: 2,
    title: 'Reading the Lab',
    description: 'The lab is full of memos, notes, and warnings. Read everything you can get your hands on.',
    commands: ['cat', 'echo', '>', '>>'],
  },
  {
    id: 3,
    title: 'Inside the Lab',
    description: 'Time to get your hands dirty. Copy keys, run experiments, and cover your tracks.',
    commands: ['mkdir', 'cp', 'mv', 'rm', 'chmod', 'ssh'],
  },
  {
    id: 4,
    title: 'The Data Pipeline',
    description: 'The sensor data tells a story. Use pipelines to extract the truth from the noise.',
    commands: ['|', 'wc', 'sort', 'grep', 'head', 'tail'],
  },
];

export function getChapter(chapterId) {
  return chapters.find(ch => ch.id === chapterId);
}

export function getChapterForLevel(levelId) {
  // Levels 1-3 = Chapter 1, 4-6 = Chapter 2, etc.
  const chapterNum = Math.ceil(levelId / 3);
  return getChapter(chapterNum);
}
