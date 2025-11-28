import React from 'react';
import { Song, LoadingState } from '../types';

interface SongListProps {
  songs: Song[];
  loadingState: LoadingState;
  categoryName: string;
  onRefresh: () => void;
  onPlay: (song: Song) => void;
  currentSong?: Song | null;
  isPlaying?: boolean;
}

export const SongList: React.FC<SongListProps> = ({ songs, loadingState, categoryName, onRefresh, onPlay, currentSong, isPlaying }) => {
  
  if (loadingState === LoadingState.LOADING) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full space-y-6">
        <div className="relative w-20 h-20">
            <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping"></div>
            <div className="relative w-full h-full border-4 border-white/20 rounded-full border-t-white animate-spin"></div>
        </div>
        <p className="text-zinc-400 font-medium tracking-wide animate-pulse uppercase text-xs">Fetching from YouTube...</p>
      </div>
    );
  }

  if (loadingState === LoadingState.ERROR) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-red-400 mb-6 font-medium text-lg">Unable to load playlist from YouTube.</p>
        <p className="text-zinc-500 mb-6 text-sm max-w-md">Please check if your API Key is valid and inserted in <code>services/youtubeService.ts</code></p>
        <button 
          onClick={onRefresh}
          className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-full text-sm transition font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  const handlePlayFirst = () => {
    if (songs.length > 0) {
      onPlay(songs[0]);
    }
  };

  const heroImage = songs.length > 0 ? songs[0].thumbnail : `https://picsum.photos/seed/music/600/600`;

  return (
    <div className="flex-1 overflow-y-auto pb-48 scroll-smooth no-scrollbar">
      
      {/* iOS 26 Aesthetic Header */}
      <div className="relative pt-20 pb-10 px-6 md:px-12 overflow-hidden">
        {/* Dynamic Background Mesh */}
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
           <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-pink-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
           <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-end gap-10 max-w-7xl mx-auto">
            {/* Album Art */}
            <div className="group w-40 h-40 md:w-64 md:h-64 bg-zinc-800 shadow-2xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex-shrink-0 relative transition-transform duration-500 hover:scale-[1.02] border border-white/10">
                <img 
                    src={heroImage} 
                    alt={categoryName}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div className="flex flex-col gap-2 w-full pb-2">
                <span className="uppercase text-xs font-bold tracking-[0.2em] text-pink-300 mb-1">Playlist</span>
                <h1 className="text-3xl md:text-6xl font-bold text-white tracking-tighter leading-none drop-shadow-xl line-clamp-2">
                    {categoryName}
                </h1>
                <div className="mt-4 md:mt-6 flex items-center gap-4 text-zinc-300 font-medium text-sm">
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                        YouTube Music
                    </span>
                    <span>•</span>
                    <span>{songs.length} tracks</span>
                </div>
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 px-6 md:px-12 py-4 pointer-events-none">
         <div className="absolute inset-0 bg-black/80 backdrop-blur-xl border-b border-white/5 -z-10"></div>
         <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-4">
                <button 
                    onClick={handlePlayFirst}
                    className="flex items-center gap-3 bg-white text-black hover:scale-105 active:scale-95 px-8 py-3 md:py-4 rounded-full font-bold shadow-lg shadow-white/10 transition-all"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    <span className="text-base md:text-lg">Play All</span>
                </button>
                <button 
                    onClick={onRefresh}
                    className="w-12 h-12 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-white/5"
                    title="Refresh Playlist"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                </button>
            </div>
         </div>
      </div>

      {/* List */}
      <div className="px-4 md:px-12 mt-4 max-w-7xl mx-auto">
        <div className="flex flex-col space-y-2">
          {songs.map((song, index) => {
             const isCurrent = currentSong?.id === song.id;
             return (
            <div 
              key={`${song.id}-${index}`}
              onClick={() => onPlay(song)}
              className={`group flex items-center gap-4 px-4 py-3 md:py-4 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent ${
                isCurrent 
                  ? 'bg-white/10 backdrop-blur-md border-white/5 shadow-lg' 
                  : 'hover:bg-white/5 active:scale-[0.98]'
              }`}
            >
              <div className="w-6 md:w-8 text-center text-zinc-500 font-bold text-sm">
                {isCurrent && isPlaying ? (
                  <div className="flex gap-0.5 md:gap-1 justify-center h-3 items-end">
                      <span className="w-0.5 md:w-1 bg-pink-500 rounded-full animate-[bounce_1s_infinite] h-2"></span>
                      <span className="w-0.5 md:w-1 bg-pink-500 rounded-full animate-[bounce_1.2s_infinite] h-3"></span>
                      <span className="w-0.5 md:w-1 bg-pink-500 rounded-full animate-[bounce_0.8s_infinite] h-1"></span>
                  </div>
                ) : (
                   <span className="group-hover:text-white transition-colors">{index + 1}</span>
                )}
              </div>

              <div className="flex items-center gap-3 md:gap-4 flex-1 overflow-hidden">
                <img 
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover bg-zinc-800 shadow-sm group-hover:shadow-md transition-all flex-shrink-0"
                />
                <div className="flex flex-col min-w-0 pr-2">
                  <span className={`font-semibold truncate text-sm md:text-base leading-tight ${isCurrent ? 'text-pink-400' : 'text-white'}`}>
                    {song.title}
                  </span>
                  <span className="text-zinc-400 text-xs md:text-sm truncate mt-0.5">{song.artist}</span>
                </div>
              </div>

              <div className="hidden md:block flex-1 text-zinc-400 text-sm truncate px-4">
                {song.album}
              </div>
              
              <div className="w-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-zinc-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
};