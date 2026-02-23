import { QuizResult, MasteryStats } from '../types';

const STORAGE_KEY = 'chinese_quiz_progress';

export const saveQuizResult = (result: QuizResult): void => {
  const history = getQuizHistory();
  history.push(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const getQuizHistory = (): QuizResult[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse progress data', e);
    return [];
  }
};

export const getMasteryStats = (): MasteryStats[] => {
  const history = getQuizHistory();
  const statsMap: Record<string, { attempts: number; totalScore: number; bestScore: number }> = {};

  history.forEach((res) => {
    if (!statsMap[res.wordListId]) {
      statsMap[res.wordListId] = { attempts: 0, totalScore: 0, bestScore: 0 };
    }
    const stats = statsMap[res.wordListId];
    stats.attempts += 1;
    stats.totalScore += (res.score / res.total) * 100;
    stats.bestScore = Math.max(stats.bestScore, (res.score / res.total) * 100);
  });

  return Object.entries(statsMap).map(([id, data]) => ({
    wordListId: id,
    attempts: data.attempts,
    bestScore: data.bestScore,
    averageScore: data.totalScore / data.attempts,
  }));
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
