import React from 'react';
import { QuizQuestion, GameState } from '../types';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface QuestionListProps {
  questions: QuizQuestion[];
  userAnswers: Record<number, string>;
  activeQuestionId: number | null;
  onQuestionFocus: (id: number) => void;
  gameState: GameState;
}

const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  userAnswers,
  activeQuestionId,
  onQuestionFocus,
  gameState,
}) => {
  const isReview = gameState === GameState.REVIEW;

  return (
    <div className="space-y-4">
      {questions.map((q, index) => {
        const userAnswer = userAnswers[q.id];
        const isActive = activeQuestionId === q.id;
        const isFilled = !!userAnswer;
        const isCorrect = isReview && userAnswer === q.answer;
        
        return (
          <div
            key={q.id}
            onClick={() => !isReview && onQuestionFocus(q.id)}
            className={`
              relative p-4 md:p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
              ${isActive && !isReview
                ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-200 ring-offset-1' 
                : 'border-white bg-white shadow-sm hover:border-blue-200'
              }
              ${isReview 
                ? isCorrect 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
                : ''
              }
            `}
          >
            {/* Question Number Badge */}
            <div className="absolute top-4 left-4 md:left-6">
              <span className={`
                flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full
                ${isReview
                   ? isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                   : 'bg-slate-100 text-slate-500'
                }
              `}>
                {index + 1}
              </span>
            </div>

            <div className="ml-8 md:ml-10 text-base md:text-lg leading-loose text-slate-800">
              <span>{q.sentenceParts[0]}</span>
              
              {/* The Blank Slot */}
              <span 
                className={`
                  inline-flex items-center justify-center min-w-[80px] px-3 mx-1.5 py-0.5 border-b-2 rounded-t-md transition-colors
                  font-medium text-center select-none
                  ${isReview 
                    ? isCorrect 
                      ? 'border-green-500 text-green-700 bg-green-100/50' 
                      : 'border-red-500 text-red-700 bg-red-100/50 line-through decoration-2'
                    : isActive 
                      ? 'border-blue-600 bg-blue-100 text-blue-700' 
                      : isFilled
                        ? 'border-slate-400 bg-slate-100 text-slate-800'
                        : 'border-slate-300 bg-slate-50 text-transparent'
                  }
                `}
              >
                {userAnswer || "（ 　 ）"}
              </span>

              <span>{q.sentenceParts[1]}</span>
            </div>

            {/* Feedback & Explanation Section (Review Mode) */}
            {isReview && (
              <div className="mt-4 ml-8 md:ml-10 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-200/50 pt-3">
                <div className="flex flex-col gap-3">
                  {/* Result Status */}
                  <div className="flex flex-wrap items-center gap-3">
                    {isCorrect ? (
                      <div className="flex items-center gap-2 text-green-700 text-sm font-bold bg-green-100 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        <span>答對了！</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-red-700 text-sm font-bold bg-red-100 px-3 py-1 rounded-full">
                          <XCircle className="w-4 h-4" />
                          <span>答錯了</span>
                        </div>
                        <div className="text-sm text-slate-500">
                          你的答案：<span className="line-through decoration-red-400 decoration-2">{userAnswer || "未作答"}</span>
                        </div>
                        <div className="text-sm font-bold text-blue-600">
                          正確答案：{q.answer}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Explanation Card */}
                  <div className="bg-white/60 p-3 rounded-lg border border-slate-200/60 text-sm text-slate-700 flex gap-3">
                     <div className="mt-0.5 flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-100" />
                     </div>
                     <div className="leading-relaxed">
                        <span className="font-bold text-slate-900 block mb-1">解析：</span>
                        {q.explanation}
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QuestionList;