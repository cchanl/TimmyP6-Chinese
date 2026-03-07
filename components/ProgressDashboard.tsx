import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Trophy, History, TrendingUp, ArrowLeft, Trash2, Award } from 'lucide-react';
import { QuizResult, MasteryStats } from '../types';
import { getQuizHistory, getMasteryStats, clearHistory } from '../services/progressService';
import { WORD_LISTS } from '../constants';

interface ProgressDashboardProps {
  onBack: () => void;
}

// Progress Dashboard component
const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onBack }) => {
  const history = useMemo(() => getQuizHistory(), []);
  const mastery = useMemo(() => getMasteryStats(), []);

  const chartData = useMemo(() => {
    return history.slice(-10).map((res, index) => ({
      name: `測驗 ${index + 1}`,
      score: Math.round((res.score / res.total) * 100),
      date: new Date(res.date).toLocaleDateString(),
      list: res.wordListName
    }));
  }, [history]);

  const masteryData = useMemo(() => {
    return mastery.map(m => {
      const list = WORD_LISTS.find(l => l.id === m.wordListId);
      return {
        name: list?.name || '自訂列表',
        mastery: Math.round(m.averageScore),
        best: Math.round(m.bestScore),
        attempts: m.attempts
      };
    });
  }, [mastery]);

  const totalAttempts = history.length;
  const averageAccuracy = history.length > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.score / curr.total), 0) / history.length * 100)
    : 0;
  const bestPerformance = history.length > 0
    ? Math.max(...history.map(h => (h.score / h.total) * 100))
    : 0;

  const handleClear = () => {
    if (window.confirm('確定要清除所有學習記錄嗎？此操作無法復原。')) {
      clearHistory();
      window.location.reload();
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <History className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">尚無學習記錄</h2>
        <p className="text-slate-500 mb-8 max-w-md">
          完成第一次測驗後，你就能在這裡查看你的學習進度、掌握度分析以及成績趨勢。
        </p>
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          返回首頁
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回首頁
        </button>
        <button 
          onClick={handleClear}
          className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          清除記錄
        </button>
      </div>

      <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-blue-600" />
        學習進度報告
      </h2>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">總測驗次數</p>
            <p className="text-2xl font-black text-slate-800">{totalAttempts} 次</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">平均正確率</p>
            <p className="text-2xl font-black text-slate-800">{averageAccuracy}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">最佳表現</p>
            <p className="text-2xl font-black text-slate-800">{Math.round(bestPerformance)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Performance Trend */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            最近 10 次成績趨勢
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}%`, '正確率']}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mastery by Category */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            詞彙集掌握度分析
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={masteryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={11} />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   formatter={(value) => [`${value}%`, '掌握度']}
                />
                <Bar dataKey="mastery" radius={[0, 4, 4, 0]} barSize={20}>
                  {masteryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.mastery >= 80 ? '#10b981' : entry.mastery >= 60 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed History */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">詳細測驗記錄</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">日期</th>
                <th className="px-6 py-4">詞彙集</th>
                <th className="px-6 py-4">得分</th>
                <th className="px-6 py-4">正確率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.slice().reverse().map((res) => (
                <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(res.date).toLocaleDateString()} {new Date(res.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">
                    {res.wordListName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {res.score} / {res.total}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${res.score/res.total >= 0.8 ? 'bg-emerald-500' : res.score/res.total >= 0.6 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${(res.score / res.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{Math.round((res.score / res.total) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
