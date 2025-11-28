import React, { useState } from 'react';
import { PlaylistCategory } from '../types';

interface SidebarProps {
  categories: PlaylistCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  userEmail: string;
  onSearch: (query: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ categories, selectedId, onSelect, userEmail, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="w-full md:w-[280px] bg-zinc-900/80 backdrop-blur-2xl flex flex-col h-full border-r border-white/5 flex-shrink-0 relative">
      <div className="p-6 pt-10 flex flex-col h-full">
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Music</span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-8 px-1">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-zinc-800 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-zinc-700 focus:text-white focus:border-white/30 sm:text-sm transition-all shadow-inner"
              placeholder="Search songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        
        {/* Navigation */}
        <nav className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
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
        
        {/* Footer Area Removed as requested */}
      </div>
    </div>
  );
};