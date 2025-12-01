
import React, { useState, useEffect, useRef } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const progressBarRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

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
  
  const handleSeekEnd = (e: any) => {
    setIsDragging(false);
    onSeek(Number(e.target.value));
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, x / width));
    const newTime = percentage * duration;
    setLocalProgress(newTime);
    onSeek(newTime);
  };

  const handleExpand = () => setIsExpanded(true);
  const handleCollapse = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded(false);
  };

  const withStop = (fn: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      fn();
  };

  // Fullscreen Swipe Gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Optional: Add rubber banding or transform visual feedback here
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const diff = e.changedTouches[0].clientY - startYRef.current;
    
    // Swipe Down Threshold
    if (diff > 80) {
        setIsExpanded(false);
    }
    startYRef.current = null;
  };

  return (
    <>
      {/* FULL SCREEN PLAYER */}
      <div 
        className={`fixed inset-0 z-50 bg-black flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] touch-none ${
            isExpanded ? 'translate-y-0' : 'translate-y-[100%]'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
            {currentSong && (
                <img 
                    src={currentSong.thumbnail} 
                    className="w-full h-full object-cover blur-[80px] scale-150" 
                    alt="bg"
                />
            )}
            <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full w-full max-w-lg mx-auto p-6 pt-safe-top pb-safe-bottom">
            <div className="flex items-center justify-center h-12 mb-4 shrink-0 cursor-pointer w-full" onClick={handleCollapse}>
                <div className="w-12 h-1.5 bg-white/30 rounded-full hover:bg-white/50 transition-colors"></div>
            </div>

            <div className="flex-1 flex items-center justify-center w-full aspect-square max-h-[50vh] min-h-[300px] mb-8">
                <div className="w-full h-full max-w-[90%] max-h-[90%] aspect-square rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
                    {currentSong ? (
                        <img src={currentSong.thumbnail} className="w-full h-full object-cover" alt="Album Art" />
                    ) : (
                         <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <svg className="w-20 h-20 text-zinc-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>
                         </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-end mb-8 px-2">
                <div className="flex flex-col gap-1 overflow-hidden mr-4">
                    <h2 className="text-2xl font-bold text-white truncate leading-tight">{currentSong?.title || "Not Playing"}</h2>
                    <p className="text-lg text-zinc-400 font-medium truncate">{currentSong?.artist || "Select a song"}</p>
                </div>
                <button className="p-2 text-zinc-400 hover:text-white" onClick={handleCollapse}>
                     <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>

            <div className="mb-10 px-2" onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                <div 
                    ref={progressBarRef}
                    className="relative w-full h-8 flex items-center cursor-pointer group"
                    onClick={handleTrackClick}
                >
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
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative pointer-events-none">
                        <div className="h-full bg-white rounded-full" style={{ width: `${(localProgress / (duration || 1)) * 100}%` }}></div>
                    </div>
                    <div 
                        className="absolute w-4 h-4 bg-white rounded-full shadow-md z-10 pointer-events-none transition-transform"
                        style={{ left: `calc(${(localProgress / (duration || 1)) * 100}% - 8px)` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs font-medium text-zinc-400 mt-[-10px]">
                    <span>{formatTime(localProgress)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 mb-12">
                 <button onClick={withStop(onToggleShuffle)} className={`p-3 rounded-full ${isShuffle ? 'text-pink-500 bg-pink-500/10' : 'text-zinc-400'}`}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
                 </button>

                 <div className="flex items-center gap-8">
                    <button onClick={withStop(onPrev)} className="p-2 text-white hover:opacity-80 active:scale-95 transition-transform">
                         <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    
                    <button onClick={withStop(onTogglePlay)} className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl">
                        {isPlaying ? (
                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                            <svg className="w-10 h-10 translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                    </button>

                    <button onClick={withStop(onNext)} className="p-2 text-white hover:opacity-80 active:scale-95 transition-transform">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                 </div>

                 <button onClick={withStop(onToggleRepeat)} className={`p-3 rounded-full relative ${repeatMode !== 0 ? 'text-pink-500 bg-pink-500/10' : 'text-zinc-400'}`}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v6z"/></svg>
                    {repeatMode === 2 && <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>}
                 </button>
            </div>

            <div className="flex justify-center mt-auto pb-12">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-bold text-white/80">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                    AirPlay or Bluetooth
                </div>
            </div>
        </div>
      </div>

      {/* MINI PLAYER */}
      <div 
        className={`fixed bottom-6 left-0 right-0 z-40 px-4 md:px-8 flex justify-center transition-all duration-500 ${isExpanded ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}
        onClick={handleExpand} 
      >
        <div className="w-full max-w-4xl bg-zinc-900/90 backdrop-blur-2xl saturate-150 border border-white/10 rounded-[2rem] p-3 md:p-4 shadow-2xl shadow-black/50 cursor-pointer hover:bg-zinc-800/90 transition-colors">
            
            <div className="absolute top-0 left-6 right-6 h-[2px] bg-zinc-700/30 overflow-hidden">
                 <div className="h-full bg-white/50" style={{ width: `${(localProgress / (duration || 1)) * 100}%` }}></div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-1">
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-zinc-800 shadow-lg flex-shrink-0 border border-white/5`}>
                        {currentSong ? (
                        <img src={currentSong.thumbnail} alt="Art" className="w-full h-full object-cover" />
                        ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>
                        </div>
                        )}
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0 justify-center">
                        <span className="text-white font-bold text-sm md:text-base truncate">{currentSong?.title || "Not Playing"}</span>
                        <span className="text-zinc-400 text-xs md:text-sm truncate font-medium">{currentSong?.artist || "Select a song"}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                    <button onClick={withStop(onTogglePlay)} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg hover:scale-105 active:scale-90 transition-all">
                        {isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : (
                        <svg className="w-6 h-6 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                    </button>
                    <button onClick={withStop(onNext)} className="text-zinc-300 hover:text-white transition-colors active:scale-95">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};
