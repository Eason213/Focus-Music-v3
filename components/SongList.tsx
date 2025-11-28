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

  // Handle Play All / Play Button click
  const handlePlayFirst = () => {
    if (songs.length > 0) {
      onPlay(songs[0]);
    }
  };

  // Get hero image from first song or fallback
  const heroImage = songs.length > 0 ? songs[0].thumbnail : `https://picsum.photos/seed/${categoryName.replace(/\s/g, '')}/600/600`;

  return (
    <div className="flex-1 overflow-y-auto pb-40 scroll-smooth no-scrollbar">
      
      {/* iOS 26 Aesthetic Header */}
      <div className="relative pt-20 pb-10 px-6 md:px-12 overflow-hidden">
        {/* Dynamic Background Mesh */}
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
           <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-pink-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
           <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-end gap-10 max-w-7xl mx-auto">
            {/* Album Art with Glass Reflection */}
            <div className="group w-52 h-52 md:w-72 md:h-72 bg-zinc-800 shadow-2xl rounded-[2rem] overflow-hidden flex-shrink-0 relative transition-transform duration-500 hover:scale-[1.02] border border-white/10">
                <img 
                    src={heroImage} 
                    alt={categoryName}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div className="flex flex-col gap-2 w-full pb-2">
                <span className="uppercase text-xs font-bold tracking-[0.2em] text-pink-300 mb-1">YouTube Playlist</span>
                <h1 className="text-4xl md:text-7xl font-bold text-white tracking-tighter leading-none drop-shadow-xl line-clamp-2">
                    {categoryName}
                </h1>
                <div className="mt-6 flex items-center gap-4 text-zinc-300 font-medium text-sm">
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-500">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
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
                    className="flex items-center gap-3 bg-white text-black hover:scale-105 active:scale-95 px-8 py-4 rounded-full font-bold shadow-lg shadow-white/10 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">Play All</span>
                </button>
                <button 
                    className="w-12 h-12 rounded-full bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-white/5"
                    title="Shuffle"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M19.5 2.47a.75.75 0 0 1 0 1.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06l4.72-4.72a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                        <path d="M18.97 18.47a.75.75 0 0 1 0 1.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06l4.72-4.72a.75.75 0 0 1 1.06 0Z" />
                        <path fillRule="evenodd" d="M1.5 5.25a.75.75 0 0 1 .75-.75h2.648a4.5 4.5 0 0 1 3.182 1.318l8.47 8.47a2.25 2.25 0 0 0 1.59.659h3.61a.75.75 0 0 1 0 1.5h-3.61a3.75 3.75 0 0 1-2.651-1.098l-8.47-8.47A3 3 0 0 0 4.898 6H2.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M20.25 6h-3.61a3.75 3.75 0 0 0-2.652 1.099l-.865.865a.75.75 0 0 0 1.06 1.061l.865-.865A2.25 2.25 0 0 1 16.64 7.5h3.61a.75.75 0 0 0 0-1.5Z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M1.5 18.75a.75.75 0 0 0 .75.75h2.648a3 3 0 0 0 2.122-.879l.865-.865a.75.75 0 0 0-1.061-1.06l-.865.865a1.5 1.5 0 0 1-1.06.439H2.25a.75.75 0 0 0-.75.75Z" clipRule="evenodd" />
                    </svg>
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
              className={`group flex items-center gap-4 px-4 py-4 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent ${
                isCurrent 
                  ? 'bg-white/10 backdrop-blur-md border-white/5 shadow-lg' 
                  : 'hover:bg-white/5 active:scale-[0.98]'
              }`}
            >
              <div className="w-8 text-center text-zinc-500 font-bold text-sm">
                {isCurrent && isPlaying ? (
                  <div className="flex gap-1 justify-center h-3 items-end">
                      <span className="w-1 bg-pink-500 rounded-full animate-[bounce_1s_infinite] h-2"></span>
                      <span className="w-1 bg-pink-500 rounded-full animate-[bounce_1.2s_infinite] h-3"></span>
                      <span className="w-1 bg-pink-500 rounded-full animate-[bounce_0.8s_infinite] h-1"></span>
                  </div>
                ) : (
                   <span className="group-hover:text-white transition-colors">{index + 1}</span>
                )}
              </div>

              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <img 
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-12 h-12 rounded-lg object-cover bg-zinc-800 shadow-sm group-hover:shadow-md transition-all flex-shrink-0"
                />
                <div className="flex flex-col min-w-0 pr-4">
                  <span className={`font-semibold truncate text-base leading-tight ${isCurrent ? 'text-pink-400' : 'text-white'}`}>
                    {song.title}
                  </span>
                  <span className="text-zinc-400 text-sm truncate mt-0.5">{song.artist}</span>
                </div>
              </div>

              <div className="hidden md:block flex-1 text-zinc-400 text-sm truncate px-4">
                {song.album}
              </div>

              {/* Mobile Duration / Hidden on small screens if too tight */}
              <div className="hidden sm:block w-16 text-right text-zinc-500 text-sm font-medium font-mono">
                {/* Duration requires another API call, mocking for list view */}
                {/* song.duration */} 
              </div>
              
              <div className="w-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-zinc-400 hover:text-white">
                  <path fillRule="evenodd" d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
};