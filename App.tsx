import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { SongList } from './components/SongList';
import { MusicPlayer } from './components/MusicPlayer';
import { ArtistSelector } from './components/ArtistSelector';
import { fetchPlaylistByContext } from './services/youtubeService';
import { PlaylistCategory, Song, LoadingState } from './types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Updated Categories
const CATEGORIES: PlaylistCategory[] = [
  { id: 'quick_picks', name: '歌曲快選', query: 'Popular music mix', description: 'Quick Picks' },
  { id: 'kpop_hits', name: '韓國流行音樂熱門歌曲', query: 'K-Pop top hits 2024 official audio', description: 'K-Pop Hits' },
  { id: 'mandopop_hits', name: '華語流行音樂熱門歌曲', query: 'Top Mandopop hits 2024 official audio', description: 'Mandopop Hits' },
  { id: 'sim_kpop', name: '風格近似 kpop', query: 'Upbeat pop music similar to K-Pop', description: 'Similar to K-Pop' },
  { id: 'new_release', name: '最新發行', query: 'New music releases 2024 official audio', description: 'New Releases' },
];

const USER_EMAIL = "kaco0213@gmail.com";

export default function App() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(CATEGORIES[0].id);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  
  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchQueryDisplay, setSearchQueryDisplay] = useState('');

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Artist Selector State
  const [isArtistSelectorOpen, setIsArtistSelectorOpen] = useState(false);
  const [favoriteArtistsNames, setFavoriteArtistsNames] = useState<string[]>([]);

  // Playback State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Player Logic State
  const [repeatMode, setRepeatMode] = useState<0 | 1 | 2>(0); 
  const [isShuffle, setIsShuffle] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Swipe Gesture Refs
  const touchStartRef = useRef<number | null>(null);
  const touchCurrentRef = useRef<number | null>(null);

  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);
  const handleSongEndRef = useRef<() => void>(() => {});

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategoryId) || CATEGORIES[0];

  // Load favorite artists from local storage on mount
  useEffect(() => {
     const savedIds = localStorage.getItem('user_favorite_artists_ids');
     if (savedIds) {
         try {
             // Logic handled in ArtistSelector or subsequent reloads
         } catch(e) {}
     }
  }, []);

  const loadSongs = useCallback(async (categoryId: string, query: string, isSearch: boolean = false, artistsOverride?: string[]) => {
    setLoadingState(LoadingState.LOADING);
    setSongs([]);
    try {
      const artistsToUse = artistsOverride || favoriteArtistsNames;
      // Pass categoryId to service to handle specific filtering (e.g. female only)
      const data = await fetchPlaylistByContext(categoryId, query, isSearch ? [] : artistsToUse);
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
  }, [favoriteArtistsNames]);

  const handleCategorySelect = (id: string) => {
    setSelectedCategoryId(id);
    setIsMobileMenuOpen(false); 
    const cat = CATEGORIES.find(c => c.id === id);
    if (cat) {
      loadSongs(cat.id, cat.query);
    }
  };

  const handleSearch = (query: string) => {
    setSelectedCategoryId(''); 
    setIsMobileMenuOpen(false); 
    // Use 'search' as category ID for search queries
    loadSongs('search', query, true);
  };

  const handleArtistSave = (names: string[]) => {
      setFavoriteArtistsNames(names);
      if (!isSearching) {
          loadSongs(currentCategory.id, currentCategory.query, false, names);
      }
  };

  useEffect(() => {
    loadSongs(currentCategory.id, currentCategory.query);
  }, []); 

  useEffect(() => {
    if (currentSong) {
      document.title = `${currentSong.title} • ${currentSong.artist}`;
    } else {
      document.title = "Music";
    }
  }, [currentSong]);

  // iOS Background Fix
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isPlaying) {
         setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
               playerRef.current.playVideo();
            }
         }, 100);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlaying]);

  const updateMediaSession = useCallback((song: Song | null) => {
    if (!('mediaSession' in navigator) || !song) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      album: song.album,
      artwork: [{ src: song.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
    });
    navigator.mediaSession.setActionHandler('play', () => handleTogglePlay());
    navigator.mediaSession.setActionHandler('pause', () => handleTogglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
    navigator.mediaSession.setActionHandler('nexttrack', () => handleNext(false));
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && details.fastSeek === undefined) {
             handleSeek(details.seekTime);
        }
    });
  }, [songs, isShuffle, repeatMode]);

  useEffect(() => {
      if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      }
  }, [isPlaying]);

  const onPlayerStateChangeStatic = (event: any) => {
    if (event.data === 0) handleSongEndRef.current();
    if (event.data === 1) {
       setIsPlaying(true);
       if (event.target && event.target.getDuration) setDuration(event.target.getDuration());
    }
    if (event.data === 2) setIsPlaying(false);
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
          'playsinline': 1,
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
              // Ensure audio is enabled
              event.target.unMute();
              event.target.setVolume(100);
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

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          setCurrentTime(curr);
          if (dur > 0) setDuration(dur);
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

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setCurrentTime(0);
    updateMediaSession(song);
    
    if (playerRef.current && playerRef.current.loadVideoById) {
      // Speed Optimization: 'small' quality loads faster for audio
      playerRef.current.loadVideoById({
          videoId: song.id,
          startSeconds: 0,
          suggestedQuality: 'small'
      });
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
            do { nextIndex = Math.floor(Math.random() * songs.length); } while (nextIndex === currentIndex);
        }
    } else {
        if (currentIndex === songs.length - 1) {
            if (repeatMode === 0 && isAuto) { setIsPlaying(false); return; }
            nextIndex = 0; 
        } else { nextIndex = currentIndex + 1; }
    }
    handlePlaySong(songs[nextIndex]);
  };

  const handleSongEnd = () => {
      if (repeatMode === 2) {
          if (playerRef.current) { playerRef.current.seekTo(0); playerRef.current.playVideo(); }
      } else { handleNext(true); }
  };

  useEffect(() => { handleSongEndRef.current = handleSongEnd; });
  useEffect(() => { if(currentSong) updateMediaSession(currentSong); }, [currentSong, updateMediaSession]);

  const handlePrev = () => {
    if (!currentSong || songs.length === 0) return;
    if (currentTime > 3) { playerRef.current?.seekTo(0); return; }
    let prevIndex = 0;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    if (isShuffle) { prevIndex = (currentIndex - 1 + songs.length) % songs.length; } 
    else { prevIndex = (currentIndex - 1 + songs.length) % songs.length; }
    handlePlaySong(songs[prevIndex]);
  };

  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
      if (!isPlaying) { playerRef.current.playVideo(); setIsPlaying(true); }
    }
  };

  const toggleRepeat = () => setRepeatMode((prev) => (prev + 1) % 3 as 0 | 1 | 2);
  const toggleShuffle = () => setIsShuffle(!isShuffle);

  // Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    touchCurrentRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchCurrentRef.current) return;
    
    const distance = touchCurrentRef.current - touchStartRef.current;
    const isLeftEdgeStart = touchStartRef.current < 50; 
    const SWIPE_THRESHOLD = 50;

    if (!isMobileMenuOpen && isLeftEdgeStart && distance > SWIPE_THRESHOLD) {
        setIsMobileMenuOpen(true);
    }
    
    if (isMobileMenuOpen && distance < -SWIPE_THRESHOLD) {
        setIsMobileMenuOpen(false);
    }

    touchStartRef.current = null;
    touchCurrentRef.current = null;
  };

  return (
    <div 
        className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans selection:bg-pink-500/30 selection:text-white touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      
      <div id="youtube-player" className="absolute top-0 left-0 w-px h-px opacity-[0.01] pointer-events-none z-0 overflow-hidden"></div>
      
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 rounded-full blur-[150px] animate-pulse"></div>
      </div>

      <ArtistSelector 
        isOpen={isArtistSelectorOpen}
        onClose={() => setIsArtistSelectorOpen(false)}
        onSave={handleArtistSave}
      />

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] shadow-2xl animate-in slide-in-from-left duration-300">
               <Sidebar 
                  categories={CATEGORIES} 
                  selectedId={selectedCategoryId} 
                  onSelect={handleCategorySelect}
                  userEmail={USER_EMAIL}
                  onSearch={handleSearch}
                  onClose={() => setIsMobileMenuOpen(false)}
                  onOpenArtistSettings={() => { setIsMobileMenuOpen(false); setIsArtistSelectorOpen(true); }}
                />
            </div>
        </div>
      )}

      <div className="hidden md:flex h-full z-20 relative">
        <Sidebar 
          categories={CATEGORIES} 
          selectedId={selectedCategoryId} 
          onSelect={handleCategorySelect}
          userEmail={USER_EMAIL}
          onSearch={handleSearch}
          onOpenArtistSettings={() => setIsArtistSelectorOpen(true)}
        />
      </div>

      <main className="flex-1 h-full overflow-hidden flex flex-col relative z-10">
        
        <div className="md:hidden bg-zinc-900/80 backdrop-blur-xl p-4 border-b border-white/5 flex items-center gap-4 sticky top-0 z-30 pt-safe-top">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <span className="font-bold text-white text-lg tracking-tight truncate flex-1">Music</span>
           <button onClick={() => setIsArtistSelectorOpen(true)} className="p-2 text-zinc-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
           </button>
        </div>

        <SongList 
          songs={songs} 
          loadingState={loadingState} 
          categoryName={isSearching ? `Search: "${searchQueryDisplay}"` : currentCategory.name}
          onRefresh={() => loadSongs(currentCategory.id, isSearching ? searchQueryDisplay : currentCategory.query, isSearching)}
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