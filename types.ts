export interface QuizQuestion {
  id: number;
  sentenceParts: [string, string]; // The parts before and after the blank
  answer: string;
  explanation: string;
}

export interface QuizConfig {
  wordList: string[];
  questionCount: number;
}

export enum GameState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  REVIEW = 'REVIEW',
  ERROR = 'ERROR',
}