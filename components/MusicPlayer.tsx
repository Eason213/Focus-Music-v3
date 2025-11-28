import React, { useState } from 'react';
import { Song } from '../types';

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ currentSong, isPlaying, onTogglePlay, onNext, onPrev }) => {
  // State for Repeat Mode: 0 = Off, 1 = All, 2 = One
  const [repeatMode, setRepeatMode] = useState<0 | 1 | 2>(0);
  const [isShuffle, setIsShuffle] = useState(false);

  const toggleRepeat = () => setRepeatMode((prev) => (prev + 1) % 3 as 0 | 1 | 2);

  return (
    <div className="absolute bottom-6 left-0 right-0 z-50 px-2 md:px-8 flex justify-center pointer-events-none">
      <div className="w-full max-w-4xl bg-zinc-900/60 backdrop-blur-3xl saturate-150 border border-white/10 rounded-[2.5rem] p-3 shadow-2xl shadow-black/50 flex items-center justify-between gap-2 md:gap-4 pointer-events-auto transition-all duration-500 hover:bg-zinc-900/70">
        
        {/* Track Info */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pl-1 md:pl-2">
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full md:rounded-2xl overflow-hidden bg-zinc-800 shadow-lg flex-shrink-0 ${isPlaying ? 'animate-[spin_10s_linear_infinite] md:animate-none' : ''}`}>
             {currentSong ? (
               <img 
                 src={currentSong.thumbnail} 
                 alt="Art" 
                 className="w-full h-full object-cover"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                   <path fillRule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017c0-.57.599-1.006 1.138-.853l10.329-2.951a.75.75 0 01.969.853V2.25H4.498a.75.75 0 00-.75.75v.005l.001.002.002.005.004.009.012.022.03.051.086.136.257.375a9.38 9.38 0 012.603 6.398v.005a.75.75 0 00.75.75h.005v.005a9.376 9.376 0 012.604-6.398l.257-.375.086-.136.03-.05.012-.023.004-.009.002-.005.001-.002A.75.75 0 009.746 2.25H19.5a.75.75 0 01.452.151z" clipRule="evenodd" />
                 </svg>
               </div>
             )}
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
             <span className="text-white font-bold text-sm md:text-base truncate drop-shadow-md">
               {currentSong?.title || "Not Playing"}
             </span>
             <span className="text-zinc-400 text-xs md:text-sm truncate font-medium">
               {currentSong?.artist || "Select a song"}
             </span>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-4 md:gap-8 flex-shrink-0">
           {/* Shuffle (Desktop only) */}
           <button 
             onClick={() => setIsShuffle(!isShuffle)}
             className={`hidden md:block transition-colors active:scale-95 ${isShuffle ? 'text-pink-500' : 'text-zinc-400 hover:text-white'}`}
             title="Shuffle"
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path fillRule="evenodd" d="M19.5 2.47a.75.75 0 0 1 0 1.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06l4.72-4.72a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                <path d="M18.97 18.47a.75.75 0 0 1 0 1.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06l4.72-4.72a.75.75 0 0 1 1.06 0Z" />
                <path fillRule="evenodd" d="M1.5 5.25a.75.75 0 0 1 .75-.75h2.648a4.5 4.5 0 0 1 3.182 1.318l8.47 8.47a2.25 2.25 0 0 0 1.59.659h3.61a.75.75 0 0 1 0 1.5h-3.61a3.75 3.75 0 0 1-2.651-1.098l-8.47-8.47A3 3 0 0 0 4.898 6H2.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M20.25 6h-3.61a3.75 3.75 0 0 0-2.652 1.099l-.865.865a.75.75 0 0 0 1.06 1.061l.865-.865A2.25 2.25 0 0 1 16.64 7.5h3.61a.75.75 0 0 0 0-1.5Z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M1.5 18.75a.75.75 0 0 0 .75.75h2.648a3 3 0 0 0 2.122-.879l.865-.865a.75.75 0 0 0-1.061-1.06l-.865.865a1.5 1.5 0 0 1-1.06.439H2.25a.75.75 0 0 0-.75.75Z" clipRule="evenodd" />
             </svg>
           </button>

           {/* Previous */}
           <button 
             onClick={onPrev}
             className="text-zinc-400 hover:text-white transition-colors active:scale-95"
            >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-8 md:h-8">
                <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.925l5.99-3.424c1.25-.712 1.25-2.518 0-3.23L12 3.808V.883c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061Z" />
             </svg>
           </button>

           {/* Play / Pause */}
           <button 
             onClick={onTogglePlay}
             className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center text-black shadow-lg shadow-white/20 hover:scale-105 active:scale-90 transition-all duration-300"
           >
             {isPlaying ? (
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-6 md:h-6">
                 <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
               </svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-6 md:h-6 translate-x-0.5">
                 <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
               </svg>
             )}
           </button>

           {/* Next */}
           <button 
             onClick={onNext}
             className="text-zinc-400 hover:text-white transition-colors active:scale-95"
            >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-8 md:h-8">
               <path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v8.122c0 1.44 1.555 2.343 2.805 1.629l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L5.055 7.061ZM17.055 7.06c-1.25-.713-2.805.19-2.805 1.629v8.122c0 1.44 1.555 2.343 2.805 1.629l7.108-4.061c1.26-.72 1.26-2.536 0-3.256l-7.108-4.061Z" />
             </svg>
           </button>

           {/* Repeat (Desktop only) */}
           <button 
             onClick={toggleRepeat}
             className={`hidden md:block transition-colors active:scale-95 relative ${repeatMode !== 0 ? 'text-pink-500' : 'text-zinc-400 hover:text-white'}`}
             title="Repeat"
           >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
               <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h5.5a.75.75 0 0 0 .75-.75v-5.5a.75.75 0 0 0-1.5 0v2.627l-2.417-2.418a9.003 9.003 0 0 0-13.616 3.977c-.114.312.082.657.415.657h1.6zM2.25 12c0-.415.364-.75.75-.75h5.5a.75.75 0 0 0 .75-.75v-5.5a.75.75 0 0 0-1.5 0v2.627l-2.417-2.418a9.003 9.003 0 0 0-13.616 3.977c.333 0 .529.345.415.657l-1.6 4.831a.75.75 0 0 0 .713.985h1.618a7.5 7.5 0 0 1-5.263-12.01l-1.903-1.903h3.183a.75.75 0 1 0 0-1.5z" clipRule="evenodd" />
               <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h5.5a.75.75 0 0 0 .75-.75v-5.5a.75.75 0 0 0-1.5 0v2.627l-2.417-2.418a9.003 9.003 0 0 0-13.616 3.977c-.114.312.082.657.415.657h1.6zM19.245 13.941a7.5 7.5 0 0 1-12.548 3.364l-1.903-1.903h3.183a.75.75 0 1 0 0-1.5h-5.5a.75.75 0 0 0-.75.75v5.5a.75.75 0 0 0 1.5 0v-2.627l2.417 2.418a9.003 9.003 0 0 0 13.616-3.977c.114-.312-.082-.657-.415-.657h-1.6z" clipRule="evenodd" />
             </svg>
             {repeatMode === 2 && (
               <span className="absolute -top-1 -right-1.5 text-[8px] font-bold bg-pink-500 text-white w-3 h-3 rounded-full flex items-center justify-center">1</span>
             )}
           </button>
        </div>

        {/* Volume / Time (Hidden on Mobile) */}
        <div className="hidden md:flex flex-1 justify-end items-center gap-4 pr-4">
           <div className="flex flex-col items-end gap-1 w-32">
              <div className="w-full h-1.5 bg-zinc-700/50 rounded-full overflow-hidden relative group cursor-pointer">
                  <div className={`absolute left-0 top-0 h-full bg-white rounded-full ${isPlaying ? 'w-1/3' : 'w-0'} transition-all duration-1000`}></div>
              </div>
              <div className="flex justify-between w-full text-[10px] text-zinc-400 font-bold tracking-wider">
                 <span>{isPlaying ? "PLAYING" : "PAUSED"}</span>
                 <span></span>
              </div>
           </div>
           
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-zinc-400 hover:text-white cursor-pointer">
             <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
             <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
           </svg>
        </div>

      </div>
    </div>
  );
};