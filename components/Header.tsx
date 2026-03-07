import React from 'react';
import { GraduationCap } from 'lucide-react';
import { APP_TITLE, APP_SUBTITLE } from '../constants';

// Header component
const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg shadow-md">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{APP_TITLE}</h1>
          <p className="text-xs md:text-sm text-slate-500 hidden sm:block">{APP_SUBTITLE}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
