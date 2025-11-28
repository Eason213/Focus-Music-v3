import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { SongList } from './components/SongList';
import { MusicPlayer } from './components/MusicPlayer';
import { fetchPlaylistByContext } from './services/youtubeService';
import { PlaylistCategory, Song, LoadingState } from './types';

// Declare global YT interface for IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Updated categories with specific YouTube search queries and correct names
// Reordered as requested: K-Pop -> Similar -> New -> Old -> Intro -> MV
const CATEGORIES: PlaylistCategory[] = [
  { id: 'kpop', name: '韓國流行音樂熱門歌曲', query: 'K-Pop top hits 2024 official audio', description: 'Latest K-Pop Hits', icon: '🕺' },
  { id: 'sim_kpop', name: '風格近似 kpop', query: 'Songs similar to K-Pop style upbeat pop', description: 'Similar to K-Pop', icon: '✨' },
  { id: 'new', name: '最新發行', query: 'New music releases 2024 official audio', description: 'New Releases', icon: '🔥' },
  { id: 'old', name: '重溫舊愛', query: 'Throwback hits 2000s 2010s music', description: 'Relive Old Favorites', icon: '⏪' },
  { id: 'rec', name: '入門推薦音樂', query: 'Best pop music starter playlist', description: 'Intro to Recommended Music', icon: '🎧' },
  { id: 'mv', name: '專屬推薦音樂影片', query: 'Official Music Video hits 4k', description: 'Recommended Music Videos', icon: '🎬' },
];

const USER_EMAIL = "kaco0213@gmail.com";

export default function App() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(CATEGORIES[0].id);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  
  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchQueryDisplay, setSearchQueryDisplay] = useState('');

  // Playback State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Player Logic State
  const [repeatMode, setRepeatMode] = useState<0 | 1 | 2>(0); // 0: Off, 1: All, 2: One
  const [isShuffle, setIsShuffle] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // YouTube Player Ref
  const playerRef = useRef<any>(null);
  // Interval Ref for polling progress
  const progressInterval = useRef<any>(null);
  
  // Refs to hold latest state/functions for the stable YT event listener
  const handleSongEndRef = useRef<() => void>(() => {});

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategoryId) || CATEGORIES[0];

  const loadSongs = useCallback(async (query: string, isSearch: boolean = false) => {
    setLoadingState(LoadingState.LOADING);
    setSongs([]);
    try {
      const data = await fetchPlaylistByContext(query);
      setSongs(data);
      setLoadingState(LoadingState.SUCCESS);
      if (isSearch) {
        setIsSearching(true);
        setSearchQueryDisplay(query);
      } else {
        setIsSearching(false);
      }
    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
    }
  }, []);

  // Handle Category Selection
  const handleCategorySelect = (id: string) => {
    setSelectedCategoryId(id);
    const cat = CATEGORIES.find(c => c.id === id);
    if (cat) {
      loadSongs(cat.query);
    }
  };

  // Handle Search
  const handleSearch = (query: string) => {
    setSelectedCategoryId(''); 
    loadSongs(query, true);
  };

  // Initial load
  useEffect(() => {
    loadSongs(currentCategory.query);
  }, []);

  // ==================== MEDIA SESSION API (iOS Control Center) ====================
  const updateMediaSession = useCallback((song: Song | null) => {
    if (!('mediaSession' in navigator) || !song) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album,
      artwork: [
        { src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    // Handlers
    navigator.mediaSession.setActionHandler('play', () => {
        handleTogglePlay();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        handleTogglePlay();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrev();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNext(false);
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && details.fastSeek === undefined) {
             handleSeek(details.seekTime);
        }
    });
  }, [songs, isShuffle, repeatMode]); // Deps needed for handlers to access latest state via closures if not refactored, but here we invoke functions that use refs or fresh state.

  // Update playback state in Media Session
  useEffect(() => {
      if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }
  }, [isPlaying]);


  // ==================== YOUTUBE PLAYER INIT ====================
  
  // Static Event Handler for YT Player that delegates to the Ref
  const onPlayerStateChangeStatic = (event: any) => {
    if (event.data === 0) { // ENDED
       handleSongEndRef.current();
    }
    if (event.data === 1) { // PLAYING
       setIsPlaying(true);
       if (event.target && event.target.getDuration) {
          setDuration(event.target.getDuration());
       }
    }
    if (event.data === 2) { // PAUSED
       setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        playerVars: {
          'playsinline': 1, // Crucial for iOS
          'controls': 0,
          'autoplay': 0, 
          'disablekb': 1,
          'fs': 0,
          'iv_load_policy': 3,
          'origin': window.location.origin
        },
        events: {
          'onReady': (event: any) => {
             setIsPlayerReady(true);
          },
          'onStateChange': onPlayerStateChangeStatic,
          'onError': (e: any) => console.error("Player Error:", e)
        }
      });
    };

    if (window.YT && window.YT.Player && !playerRef.current) {
        window.onYouTubeIframeAPIReady();
    }
  }, []);

  // Poll for Progress
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          setCurrentTime(curr);
          if (dur > 0) setDuration(dur);
          
          // Update Media Session Position State (Experimental but good for lock screen slider)
          if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
             navigator.mediaSession.setPositionState({
                 duration: dur,
                 playbackRate: 1,
                 position: curr
             });
          }
        }
      }, 500); 
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => clearInterval(progressInterval.current);
  }, [isPlaying]);


  // ==================== CONTROL HANDLERS ====================

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setCurrentTime(0);
    
    // Update iOS Media Center
    updateMediaSession(song);

    // CRITICAL for iOS: Call player methods synchronously in the event handler if possible.
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(song.id);
      playerRef.current.playVideo(); // Force play for iOS
    }
  };

  const handleTogglePlay = () => {
    if (!currentSong && songs.length > 0) {
      handlePlaySong(songs[0]);
      return;
    }

    if (isPlaying) {
      playerRef.current?.pauseVideo();
      setIsPlaying(false); 
    } else {
      playerRef.current?.playVideo();
      setIsPlaying(true); 
    }
  };

  const handleNext = (isAuto: boolean = false) => {
    if (!currentSong || songs.length === 0) return;
    
    let nextIndex = 0;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);

    if (isShuffle) {
        if (songs.length > 1) {
            do {
                nextIndex = Math.floor(Math.random() * songs.length);
            } while (nextIndex === currentIndex);
        }
    } else {
        if (currentIndex === songs.length - 1) {
            if (repeatMode === 0 && isAuto) {
                setIsPlaying(false);
                return; 
            }
            nextIndex = 0; 
        } else {
            nextIndex = currentIndex + 1;
        }
    }

    handlePlaySong(songs[nextIndex]);
  };

  const handleSongEnd = () => {
      if (repeatMode === 2) {
          // Single Loop
          if (playerRef.current) {
            playerRef.current.seekTo(0);
            playerRef.current.playVideo();
          }
      } else {
          // Play Next
          handleNext(true); 
      }
  };

  // Update the ref whenever handleSongEnd changes
  useEffect(() => {
    handleSongEndRef.current = handleSongEnd;
  });

  // Re-attach handlers to media session when dependencies change (like song list order for next/prev)
  useEffect(() => {
    if(currentSong) {
        updateMediaSession(currentSong);
    }
  }, [currentSong, updateMediaSession]);

  const handlePrev = () => {
    if (!currentSong || songs.length === 0) return;
    
    if (currentTime > 3) {
        playerRef.current?.seekTo(0);
        return;
    }

    let prevIndex = 0;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);

    if (isShuffle) {
         prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    } else {
        prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    }

    handlePlaySong(songs[prevIndex]);
  };

  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
      if (!isPlaying) {
          playerRef.current.playVideo();
          setIsPlaying(true);
      }
    }
  };

  const toggleRepeat = () => setRepeatMode((prev) => (prev + 1) % 3 as 0 | 1 | 2);
  const toggleShuffle = () => setIsShuffle(!isShuffle);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans selection:bg-pink-500/30 selection:text-white">
      
      {/* 
         iOS Optimization: 
         Keep player technically 'visible' (1x1 pixel) but invisible to user. 
         Completely off-screen (top: -1000px) causes iOS Safari to pause audio in background.
      */}
      <div 
        id="youtube-player" 
        className="absolute top-0 left-0 w-px h-px opacity-[0.01] pointer-events-none z-0 overflow-hidden"
      ></div>

      {/* Background Ambient Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 rounded-full blur-[150px] animate-pulse"></div>
      </div>

      <div className="hidden md:flex h-full z-20 relative">
        <Sidebar 
          categories={CATEGORIES} 
          selectedId={selectedCategoryId} 
          onSelect={handleCategorySelect}
          userEmail={USER_EMAIL}
          onSearch={handleSearch}
        />
      </div>

      <main className="flex-1 h-full overflow-hidden flex flex-col relative z-10">
        <div className="md:hidden bg-black/50 backdrop-blur-xl p-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-30">
           <span className="font-bold text-white text-lg tracking-tight">Music</span>
           <select 
              className="bg-zinc-800/50 text-sm p-2 rounded-lg text-white border-none outline-none backdrop-blur-md"
              value={selectedCategoryId}
              onChange={(e) => handleCategorySelect(e.target.value)}
           >
             {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>

        <SongList 
          songs={songs} 
          loadingState={loadingState} 
          categoryName={isSearching ? `Search: "${searchQueryDisplay}"` : currentCategory.name}
          onRefresh={() => loadSongs(isSearching ? searchQueryDisplay : currentCategory.query, isSearching)}
          onPlay={handlePlaySong}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
        
        <MusicPlayer 
          currentSong={currentSong}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={() => handleNext(false)}
          onPrev={handlePrev}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          repeatMode={repeatMode}
          isShuffle={isShuffle}
          onToggleRepeat={toggleRepeat}
          onToggleShuffle={toggleShuffle}
        />
      </main>
    </div>
  );
}