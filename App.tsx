import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import QuestionList from './components/QuestionList';
import WordBank from './components/WordBank';
import { generateQuizQuestions } from './services/geminiService';
import { saveQuizResult } from './services/progressService';
import { WORD_LISTS } from './constants';
import { QuizQuestion, GameState, QuizResult, Difficulty } from './types';
import ProgressDashboard from './components/ProgressDashboard';
import { Loader2, RefreshCw, Check, AlertCircle, Edit3, BookOpen, Eye, EyeOff, SlidersHorizontal, Eraser, BarChart2 } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [currentSelectedWord, setCurrentSelectedWord] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showWordBank, setShowWordBank] = useState(true);

  // Configuration State
  const [selectedListId, setSelectedListId] = useState<string>(WORD_LISTS[0].id);
  // Initialize with the first list by default so it can be edited immediately
  const [customWordsInput, setCustomWordsInput] = useState<string>(WORD_LISTS[0].words.join('、'));
  const [currentWordList, setCurrentWordList] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);

  // Initialize Quiz
  const startQuiz = useCallback(async () => {
    // Always parse words from the text area input
    const words = customWordsInput
        .split(/[,，、\n\s]+/) // Added 、 to the split regex
        .map(w => w.trim())
        .filter(w => w.length > 0);
    
    if (words.length < 3) {
        alert("請至少輸入 3 個詞語以開始測驗。");
        return;
    }

    setGameState(GameState.LOADING);
    setCurrentWordList(words);
    // Reset word bank visibility to true when starting new game
    setShowWordBank(true);
    
    try {
      const generatedQuestions = await generateQuizQuestions(words, questionCount, difficulty);
      setQuestions(generatedQuestions);
      setUserAnswers({});
      setScore(0);
      setCurrentSelectedWord(null);
      setGameState(GameState.PLAYING);
      
      if (generatedQuestions.length > 0) {
        setActiveQuestionId(generatedQuestions[0].id);
      }
    } catch (error) {
      console.error(error);
      setGameState(GameState.ERROR);
    }
  }, [customWordsInput, questionCount]);

  const handlePresetSelect = (listId: string) => {
    setSelectedListId(listId);
    if (listId === 'custom') {
        setCustomWordsInput(''); // Clear the input
    } else {
        const list = WORD_LISTS.find(l => l.id === listId);
        if (list) {
            setCustomWordsInput(list.words.join('、'));
        }
    }
  };

  // Handle Word Selection
  const handleSelectWord = (word: string) => {
    if (gameState !== GameState.PLAYING) return;

    setCurrentSelectedWord(word);

    if (activeQuestionId !== null) {
      setUserAnswers(prev => ({
        ...prev,
        [activeQuestionId]: word
      }));
      
      const currentIndex = questions.findIndex(q => q.id === activeQuestionId);
      if (currentIndex !== -1 && currentIndex < questions.length - 1) {
        const nextUnfilled = questions.slice(currentIndex + 1).find(q => !userAnswers[q.id]);
        if (nextUnfilled) {
          setActiveQuestionId(nextUnfilled.id);
        } else {
             setActiveQuestionId(questions[currentIndex + 1].id);
        }
      } else {
           const firstUnfilled = questions.find(q => !userAnswers[q.id] && q.id !== activeQuestionId);
           if(firstUnfilled) setActiveQuestionId(firstUnfilled.id);
      }
    }
  };

  const handleQuestionFocus = (id: number) => {
     if(gameState === GameState.PLAYING) {
        setActiveQuestionId(id);
     }
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach(q => {
      if (userAnswers[q.id] === q.answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setGameState(GameState.REVIEW);
    setActiveQuestionId(null);
    setShowWordBank(true); // Always show word bank in review to see what was available
    
    // Save Result
    const listName = selectedListId === 'custom' 
      ? '自訂列表' 
      : WORD_LISTS.find(l => l.id === selectedListId)?.name || '未知列表';
      
    const result: QuizResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      score: correctCount,
      total: questions.length,
      wordListId: selectedListId || 'custom',
      wordListName: listName
    };
    saveQuizResult(result);

    // Celebration for high scores
    if (correctCount === questions.length) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#f59e0b']
      });
    } else if (correctCount >= questions.length * 0.8) {
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#10b981']
      });
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = questions.length;
  const isAllAnswered = totalQuestions > 0 && answeredCount === totalQuestions;
  const wordCount = customWordsInput.split(/[,，、\n\s]+/).filter(w => w.trim().length > 0).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6 max-w-6xl">
        <AnimatePresence mode="wait">
          {gameState === GameState.PROGRESS && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ProgressDashboard onBack={() => setGameState(GameState.IDLE)} />
            </motion.div>
          )}

          {gameState === GameState.IDLE && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh] py-10"
            >
              <div className="w-full max-w-2xl flex justify-end mb-4">
                 <button 
                   onClick={() => setGameState(GameState.PROGRESS)}
                   className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
                 >
                   <BarChart2 className="w-5 h-5" />
                   查看學習進度
                 </button>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-2xl w-full border border-slate-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="text-3xl">📝</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">開始測驗</h2>
              <p className="text-slate-500 mb-8 text-center">
                請選擇預設詞彙表或直接編輯下方詞語列表。
              </p>

              {/* Preset Selection Cards */}
              <div className="space-y-4 mb-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {WORD_LISTS.map((list) => (
                        <div 
                            key={list.id}
                            onClick={() => handlePresetSelect(list.id)}
                            className={`
                                cursor-pointer p-4 rounded-xl border-2 transition-all relative overflow-hidden group
                                ${selectedListId === list.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-white'
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <BookOpen className={`w-5 h-5 mt-0.5 ${selectedListId === list.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-400'}`} />
                                <div>
                                    <h3 className={`font-bold ${selectedListId === list.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                        {list.name}
                                    </h3>
                                    {list.description && (
                                        <p className="text-xs text-slate-500 mt-1">{list.description}</p>
                                    )}
                                </div>
                            </div>
                            {selectedListId === list.id && (
                                <div className="absolute top-2 right-2 text-blue-600">
                                    <Check className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                    ))}
                    
                    <div 
                        onClick={() => handlePresetSelect('custom')}
                        className={`
                            cursor-pointer p-4 rounded-xl border-2 transition-all relative group
                            ${selectedListId === 'custom' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-white'
                            }
                        `}
                    >
                         <div className="flex items-start gap-3">
                                <Eraser className={`w-5 h-5 mt-0.5 ${selectedListId === 'custom' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-400'}`} />
                                <div>
                                    <h3 className={`font-bold ${selectedListId === 'custom' ? 'text-blue-700' : 'text-slate-700'}`}>
                                        清空 / 自訂
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">清空列表重新輸入</p>
                                </div>
                         </div>
                         {selectedListId === 'custom' && (
                                <div className="absolute top-2 right-2 text-blue-600">
                                    <Check className="w-5 h-5" />
                                </div>
                         )}
                    </div>
                 </div>

                 {/* Text Area for Words - Always Visible */}
                 <div className="animate-in fade-in slide-in-from-top-2 duration-200 pt-2">
                     <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between items-center">
                        <span className="flex items-center gap-2"><Edit3 className="w-4 h-4"/> 編輯詞語列表</span>
                        <span className="text-xs font-normal text-slate-500">可用 [、] [，] [空格] 或 [換行] 分隔</span>
                     </label>
                     <textarea
                        value={customWordsInput}
                        onChange={(e) => {
                            setCustomWordsInput(e.target.value);
                            if(selectedListId !== 'custom') setSelectedListId(''); // Deselect presets if user edits manually
                        }}
                        placeholder={"請輸入詞語，例如：\n開心、興奮、難過"}
                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] text-base leading-relaxed bg-white shadow-sm"
                     />
                     <div className="flex justify-between items-center mt-2">
                        <p className={`text-xs ${wordCount < 3 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                             {wordCount < 3 ? '⚠️ 請至少輸入 3 個詞語' : `已輸入 ${wordCount} 個詞語`}
                        </p>
                     </div>
                 </div>
              </div>

              {/* Question Count Setting */}
              <div className="mb-8 p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                          設定題目數量
                      </label>
                      <span className="text-lg font-bold text-blue-600 bg-white px-3 py-0.5 rounded-md border border-slate-200 shadow-sm">{questionCount} 題</span>
                  </div>
                  <input 
                      type="range" 
                      min="5" 
                      max="30" 
                      step="1"
                      value={questionCount} 
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                      <span>5 題</span>
                      <span>30 題</span>
                  </div>
              </div>

              {/* Difficulty Setting */}
              <div className="mb-8 p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
                      <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                      設定難易度
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(Difficulty) as Array<keyof typeof Difficulty>).map((key) => (
                          <button
                              key={key}
                              onClick={() => setDifficulty(Difficulty[key])}
                              className={`py-2 px-3 rounded-lg text-sm font-bold transition-all border ${
                                  difficulty === Difficulty[key]
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                          >
                              {key === 'EASY' ? '基礎' : key === 'MEDIUM' ? '進階' : '挑戰'}
                          </button>
                      ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 text-center">
                      {difficulty === Difficulty.EASY ? '適合初學者，句子簡單直白' : 
                       difficulty === Difficulty.MEDIUM ? '適合一般練習，符合六年級程度' : 
                       '適合追求卓越，句子更具文學性與深度'}
                  </p>
              </div>

              <button 
                onClick={startQuiz}
                disabled={wordCount < 3}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                開始生成測驗
              </button>
            </div>
          </motion.div>
        )}

        {gameState === GameState.LOADING && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
          >
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <h3 className="text-xl font-medium text-slate-700 animate-pulse">
              老師正在出題中，請稍候...
            </h3>
            <p className="text-slate-400 text-sm">正在運用 AI 根據您的詞彙表生成 {questionCount} 道情境題</p>
          </motion.div>
        )}

        {gameState === GameState.ERROR && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
          >
            <div className="bg-red-100 p-4 rounded-full">
                <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">出題失敗</h3>
            <p className="text-slate-600">無法連接到題目生成系統，請檢查網絡或 API 設定。</p>
            <button 
                onClick={() => setGameState(GameState.IDLE)}
                className="mt-4 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium"
            >
                返回首頁
            </button>
          </motion.div>
        )}

        {(gameState === GameState.PLAYING || gameState === GameState.REVIEW) && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className={`${showWordBank ? 'lg:col-span-8' : 'lg:col-span-12'} order-2 lg:order-1 pb-32 lg:pb-0 transition-all duration-300`}>
              {gameState === GameState.REVIEW && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center"
                >
                   <p className="text-slate-500 font-medium uppercase tracking-widest text-xs mb-2">測驗結果</p>
                   <motion.div 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-5xl font-black text-blue-600 mb-2"
                   >
                     {score} <span className="text-2xl text-slate-400 font-normal">/ {totalQuestions}</span>
                   </motion.div>
                   <p className="text-slate-600">
                     {score === totalQuestions ? "太棒了！全對！🎉" : score >= (totalQuestions * 0.8) ? "表現很棒！繼續保持！🌟" : "再接再厲，多練習幾次就會了！💪"}
                   </p>
                   <button 
                     onClick={() => setGameState(GameState.IDLE)}
                     className="mt-6 px-6 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full font-medium flex items-center gap-2 mx-auto transition-colors"
                   >
                     <RefreshCw className="w-4 h-4" />
                     試試其他題目
                   </button>
                </motion.div>
              )}

              <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-lg font-bold text-slate-700">
                    題目列表 
                    <span className="ml-2 text-sm font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        {gameState === GameState.PLAYING ? `進度: ${answeredCount}/${totalQuestions}` : "答案解析"}
                    </span>
                  </h2>

                  <button 
                    onClick={() => setShowWordBank(prev => !prev)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200/50"
                  >
                     {showWordBank ? (
                       <>
                         <EyeOff className="w-4 h-4"/>
                         <span className="hidden sm:inline">隱藏詞庫</span>
                       </>
                     ) : (
                        <>
                          <Eye className="w-4 h-4"/>
                          <span className="hidden sm:inline">顯示詞庫</span>
                        </>
                     )}
                  </button>
              </div>

              <QuestionList 
                questions={questions}
                userAnswers={userAnswers}
                activeQuestionId={activeQuestionId}
                onQuestionFocus={handleQuestionFocus}
                gameState={gameState}
              />

              {/* Backup Submit Button for Desktop when Sidebar is Hidden */}
              {!showWordBank && gameState === GameState.PLAYING && (
                  <div className="hidden lg:flex justify-end mt-8">
                     <button
                         onClick={handleSubmit}
                         disabled={!isAllAnswered}
                         className={`
                            px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all transform
                            flex items-center justify-center gap-2
                            ${isAllAnswered 
                                ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-[1.02] hover:shadow-green-200' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }
                         `}
                       >
                         <Check className="w-5 h-5" />
                         提交答案
                       </button>
                  </div>
              )}
            </div>

            {showWordBank && (
              <div className="lg:col-span-4 order-1 lg:order-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="sticky top-24 space-y-6">
                  <WordBank 
                    words={currentWordList}
                    selectedWord={currentSelectedWord}
                    onSelectWord={handleSelectWord}
                    usedWords={Object.values(userAnswers)}
                  />

                  <div className="hidden lg:block">
                    {gameState === GameState.PLAYING && (
                        <button
                          onClick={handleSubmit}
                          disabled={!isAllAnswered}
                          className={`
                              w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform
                              flex items-center justify-center gap-2
                              ${isAllAnswered 
                                  ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-[1.02] hover:shadow-green-200' 
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }
                          `}
                        >
                          <Check className="w-5 h-5" />
                          提交答案
                        </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {gameState === GameState.PLAYING && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-2xl z-30 safe-area-pb">
            <button
                onClick={handleSubmit}
                disabled={!isAllAnswered}
                className={`
                w-full py-3 rounded-xl font-bold text-lg shadow-md transition-all
                flex items-center justify-center gap-2
                ${isAllAnswered 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-slate-100 text-slate-400'
                }
                `}
            >
                {isAllAnswered ? (
                    <>
                     <Check className="w-5 h-5" />
                     提交答案
                    </>
                ) : (
                    <span>還有 {totalQuestions - answeredCount} 題未完成</span>
                )}
            </button>
        </div>
      )}
    </div>
  );
};

export default App;