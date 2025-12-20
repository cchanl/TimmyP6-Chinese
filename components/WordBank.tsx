import React from 'react';

interface WordBankProps {
  words: string[];
  selectedWord: string | null;
  onSelectWord: (word: string) => void;
  usedWords: string[]; // Words that have been placed (optional visual cue)
}

const WordBank: React.FC<WordBankProps> = ({ words, selectedWord, onSelectWord, usedWords }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 md:p-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>詞語庫</span>
        <span className="text-xs font-normal normal-case bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
          點擊詞語後填入空格
        </span>
      </h3>
      <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
        {words.map((word) => {
          const isSelected = selectedWord === word;
          
          return (
            <button
              key={word}
              onClick={() => onSelectWord(word)}
              className={`
                px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all duration-200
                border
                ${isSelected 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WordBank;
