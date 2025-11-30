import React, { useState, useEffect } from 'react';
import { PlaylistCategory } from '../types';

interface SidebarProps {
  categories: PlaylistCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
  userEmail: string;
  onSearch: (query: string) => void;
  onClose?: () => void;
  onOpenArtistSettings: () => void;
}

const POPULAR_KEYWORDS = [
  "NewJeans", "BTS", "Blackpink", "Jay Chou", "Eric Chou", "GEM", 
  "Taylor Swift", "The Weeknd", "Justin Bieber", "Ariana Grande",
  "Lo-Fi Hip Hop", "Jazz Vibes", "Piano Focus"
];

const MAX_HISTORY_ITEMS = 5;

export const Sidebar: React.FC<SidebarProps> = ({ categories, selectedId, onSelect, userEmail, onSearch, onClose, onOpenArtistSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('music_dashboard_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuggestions([]);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const matches = POPULAR_KEYWORDS.filter(k => 
      k.toLowerCase().includes(lowerQuery)
    ).slice(0, 5); 
    setFilteredSuggestions(matches);
  }, [searchQuery]);

  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, MAX_HISTORY_ITEMS);
    setSearchHistory(newHistory);
    localStorage.setItem('music_dashboard_search_history', JSON.stringify(newHistory));
  };

  const executeSearch = (query: string) => {
    setSearchQuery(query);
    saveToHistory(query);
    onSearch(query);
    setIsFocused(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      executeSearch(searchQuery);
    }
  };

  const handleHistoryDelete = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(newHistory);
    localStorage.setItem('music_dashboard_search_history', JSON.stringify(newHistory));
  };

  return (
    <div className="w-full md:w-[280px] bg-zinc-900/95 backdrop-blur-2xl flex flex-col h-full border-r border-white/5 flex-shrink-0 relative">
      <div className="p-6 pt-safe-top flex flex-col h-full">
        {/* Logo Area */}
        <div className="flex items-center justify-between mb-8 px-2 mt-4 md:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Music</span>
          </div>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8 px-1 relative z-50">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-zinc-500 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-zinc-800 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-zinc-700 focus:text-white focus:border-white/30 sm:text-sm transition-all shadow-inner"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)} 
            />
          </form>

          {isFocused && (searchHistory.length > 0 || filteredSuggestions.length > 0) && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {filteredSuggestions.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Suggestions</div>
                    {filteredSuggestions.map((item, idx) => (
                      <div 
                        key={`sug-${idx}`}
                        className="px-4 py-2 hover:bg-white/10 cursor-pointer flex items-center gap-3 text-sm text-zinc-200"
                        onMouseDown={() => executeSearch(item)} 
                      >
                         <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                         {item}
                      </div>
                    ))}
                    {searchHistory.length > 0 && <div className="h-px bg-white/5 mx-2 my-1"></div>}
                  </div>
                )}
                {searchHistory.length > 0 && (
                  <div className="py-2">
                     <div className="px-3 py-1 text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex justify-between">
                       <span>Recent</span>
                       <span 
                          className="cursor-pointer hover:text-white transition-colors"
                          onMouseDown={(e) => { e.stopPropagation(); localStorage.removeItem('music_dashboard_search_history'); setSearchHistory([]); }}
                       >Clear</span>
                     </div>
                     {searchHistory.map((item, idx) => (
                       <div 
                         key={`hist-${idx}`}
                         className="px-4 py-2 hover:bg-white/10 cursor-pointer flex items-center justify-between group text-sm text-zinc-300"
                         onMouseDown={() => executeSearch(item)}
                       >
                          <div className="flex items-center gap-3">
                             <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             {item}
                          </div>
                          <div 
                            className="p-1 rounded-full hover:bg-white/20 text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                            onMouseDown={(e) => handleHistoryDelete(e, item)}
                          >
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                       </div>
                     ))}
                  </div>
                )}
             </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
          <p className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Your Library</p>
          {categories.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`w-full text-left px-4 py-4 rounded-xl text-[15px] font-semibold transition-all duration-300 flex items-center gap-4 group border border-transparent ${
                selectedId === cat.id
                  ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border-white/5'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {/* Index indicator removed as requested */}
              {cat.name}
            </button>
          ))}
        </nav>

        {/* Artist Customization Button */}
        <div className="mt-4 pt-4 border-t border-white/5">
            <button 
                onClick={onOpenArtistSettings}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 hover:from-indigo-800 hover:to-purple-800 border border-indigo-500/20 text-indigo-100 transition-all group"
            >
                <div className="p-1.5 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </div>
                <div className="text-left">
                    <div className="text-sm font-bold">Preferences</div>
                    <div className="text-[10px] text-indigo-300 opacity-80">Customize Artists</div>
                </div>
            </button>
        </div>

      </div>
    </div>
  );
};