import React, { useState, useEffect } from 'react';
import { Song } from '../types';

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  repeatMode: 0 | 1 | 2;
  isShuffle: boolean;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  currentSong, 
  isPlaying, 
  onTogglePlay, 
  onNext, 
  onPrev,
  currentTime,
  duration,
  onSeek,
  repeatMode,
  isShuffle,
  onToggleRepeat,
  onToggleShuffle
}) => {
  const [localProgress, setLocalProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(currentTime);
    }
  }, [currentTime, isDragging]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProgress(Number(e.target.value));
  };

  const handleSeekStart = () => setIsDragging(true);
  
  const handleSeekEnd = () => {
    setIsDragging(false);
    onSeek(localProgress);
  };

  return (
    <div className="absolute bottom-6 left-0 right-0 z-50 px-4 md:px-8 flex justify-center pointer-events-none">
      <div className="w-full max-w-4xl bg-zinc-900/80 backdrop-blur-3xl saturate-150 border border-white/10 rounded-[2.5rem] p-4 shadow-2xl shadow-black/50 pointer-events-auto transition-all duration-500">
        
        {/* Progress Bar Row */}
        <div className="flex flex-col mb-4 w-full px-2">
            <div className="flex justify-between text-[10px] text-zinc-400 font-medium font-mono mb-1.5 px-1 tracking-wider">
                <span>{formatTime(localProgress)}</span>
                <span>{formatTime(duration)}</span>
            </div>
            <div className="relative group w-full h-4 flex items-center">
                 <input 
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={localProgress}
                    onChange={handleSeekChange}
                    onMouseDown={handleSeekStart}
                    onTouchStart={handleSeekStart}
                    onMouseUp={handleSeekEnd}
                    onTouchEnd={handleSeekEnd}
                    className="absolute z-20 w-full h-full opacity-0 cursor-pointer"
                 />
                 <div className="w-full h-1 bg-zinc-700/50 rounded-full overflow-hidden relative">
                    <div 
                        className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                        style={{ width: `${(localProgress / (duration || 1)) * 100}%` }}
                    ></div>
                 </div>
                 {/* Thumb indicator */}
                 <div 
                    className="absolute h-3 w-3 bg-white rounded-full shadow-md z-10 pointer-events-none transition-all duration-100"
                    style={{ left: `calc(${(localProgress / (duration || 1)) * 100}% - 6px)` }}
                 ></div>
            </div>
        </div>

        <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pl-1">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-zinc-800 shadow-lg flex-shrink-0 border border-white/5`}>
                {currentSong ? (
                <img 
                    src={currentSong.thumbnail} 
                    alt="Art" 
                    className="w-full h-full object-cover"
                />
                ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>
                </div>
                )}
            </div>
            <div className="flex flex-col overflow-hidden min-w-0 justify-center">
                <span className="text-white font-bold text-sm md:text-base truncate drop-shadow-md">
                {currentSong?.title || "Not Playing"}
                </span>
                <span className="text-zinc-400 text-xs md:text-sm truncate font-medium">
                {currentSong?.artist || "Select a song"}
                </span>
            </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 md:gap-6 flex-shrink-0 pr-2 md:pr-4">
            {/* Shuffle */}
            <button 
                onClick={onToggleShuffle}
                className={`hidden md:flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-95 ${isShuffle ? 'text-pink-500 bg-pink-500/10' : 'text-zinc-400 hover:text-white'}`}
                title="Shuffle"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
            </button>

            {/* Prev */}
            <button 
                onClick={onPrev}
                className="text-zinc-300 hover:text-white transition-colors active:scale-95 p-2"
            >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
            </button>

            {/* Play/Pause */}
            <button 
                onClick={onTogglePlay}
                className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center text-black shadow-lg shadow-white/20 hover:scale-105 active:scale-90 transition-all duration-300"
            >
                {isPlaying ? (
                <svg className="w-8 h-8 md:w-9 md:h-9" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
                ) : (
                <svg className="w-8 h-8 md:w-9 md:h-9 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                )}
            </button>

            {/* Next */}
            <button 
                onClick={onNext}
                className="text-zinc-300 hover:text-white transition-colors active:scale-95 p-2"
            >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
            </button>

            {/* Repeat */}
            <button 
                onClick={onToggleRepeat}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all active:scale-95 ${repeatMode !== 0 ? 'text-pink-500 bg-pink-500/10' : 'text-zinc-400 hover:text-white'}`}
                title="Repeat"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v6z"/>
                </svg>
                {repeatMode === 2 && (
                    <span className="absolute top-0 right-0 text-[8px] font-bold bg-pink-500 text-white w-3 h-3 rounded-full flex items-center justify-center ring-1 ring-black">1</span>
                )}
            </button>
            </div>
            
        </div>

      </div>
    </div>
  );
};