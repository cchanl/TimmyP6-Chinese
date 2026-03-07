export interface QuizQuestion {
  id: number;
  sentenceParts: [string, string]; // The parts before and after the blank
  answer: string;
  explanation: string;
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface QuizConfig {
  wordList: string[];
  questionCount: number;
  difficulty: Difficulty;
}

export interface QuizResult {
  id: string;
  date: string;
  score: number;
  total: number;
  wordListId: string;
  wordListName: string;
}

export interface MasteryStats {
  wordListId: string;
  attempts: number;
  bestScore: number;
  averageScore: number;
}

export enum GameState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  REVIEW = 'REVIEW',
  ERROR = 'ERROR',
  PROGRESS = 'PROGRESS',
}
