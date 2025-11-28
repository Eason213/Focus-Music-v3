import React from 'react';
import { PlaylistCategory } from '../types';

interface SidebarProps {
  categories: PlaylistCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  userEmail: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ categories, selectedId, onSelect, userEmail }) => {
  return (
    <div className="w-full md:w-[280px] bg-zinc-900/40 backdrop-blur-2xl flex flex-col h-full border-r border-white/5 flex-shrink-0 relative">
      <div className="p-6 pt-10 flex flex-col h-full">
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Music</span>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          <p className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Your Library</p>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-300 flex items-center gap-4 group ${
                selectedId === cat.id
                  ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`text-xl transition-transform duration-300 ${selectedId === cat.id ? 'scale-110' : 'group-hover:scale-110'}`}>{cat.icon}</span>
              {cat.name}
              {selectedId === cat.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>
              )}
            </button>
          ))}
        </nav>
        
        {/* User Profile */}
        <div className="mt-auto">
             <div className="p-4 bg-gradient-to-r from-zinc-800/40 to-zinc-900/40 rounded-2xl border border-white/5 flex items-center gap-3 backdrop-blur-md">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                    {userEmail.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Signed in as</p>
                    <p className="text-sm text-white truncate font-medium">{userEmail.split('@')[0]}</p>
                </div>
            </div>
            <p className="text-[10px] text-zinc-600 font-medium text-center mt-4 tracking-wide uppercase">
                Powered by Gemini • iOS 26 Concept
            </p>
        </div>
      </div>
    </div>
  );
};