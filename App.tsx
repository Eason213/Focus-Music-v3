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

// Updated categories with specific YouTube search queries
const CATEGORIES: PlaylistCategory[] = [
  { id: 'rec', name: '入門推薦音樂', query: 'Popular music playlist 2024', description: 'Intro to Recommended Music', icon: '🎧' },
  { id: 'old', name: '重溫舊愛', query: 'Classic hits 2000-2015 playlist', description: 'Relive Old Favorites', icon: '⏪' },
  { id: 'mv', name: '專屬推薦音樂影片', query: 'Official Music Video playlist', description: 'Recommended Music Videos', icon: '🎬' },
  { id: 'kpop', name: 'K-Pop hits', query: 'K-Pop Hits 2024 playlist', description: 'Latest K-Pop Hits', icon: '🕺' },
  { id: 'sim_kpop', name: '風格近似 kpop', query: 'Songs similar to K-Pop', description: 'Similar to K-Pop', icon: '✨' },
  { id: 'new', name: '最新發行', query: 'New music releases 2024', description: 'New Releases', icon: '🔥' },
];

const USER_EMAIL = "kaco0213@gmail.com";

export default function App() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(CATEGORIES[0].id);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  
  // Playback State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // YouTube Player Ref
  const playerRef = useRef<any>(null);

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategoryId) || CATEGORIES[0];

  const loadSongs = useCallback(async () => {
    setLoadingState(LoadingState.LOADING);
    setSongs([]);
    try {
      // Fetch using the new YouTube Service
      const data = await fetchPlaylistByContext(currentCategory.query);
      setSongs(data);
      setLoadingState(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
    }
  }, [currentCategory]);

  // Initial load or when category changes
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // ==================== YOUTUBE PLAYER INIT ====================
  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Callback when API is ready
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
          'playsinline': 1,
          'controls': 0,
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    };

    // If API is already loaded (e.g. re-render), ensure player is init
    if (window.YT && window.YT.Player && !playerRef.current) {
        window.onYouTubeIframeAPIReady();
    }
  }, []);

  const onPlayerReady = (event: any) => {
    // Player is ready
    // event.target.setVolume(100);
  };

  const onPlayerStateChange = (event: any) => {
    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
      handleNext();
    }
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1) {
       setIsPlaying(true);
    }
    // YT.PlayerState.PAUSED = 2
    if (event.data === 2) {
       setIsPlaying(false);
    }
  };

  // ==================== CONTROL HANDLERS ====================

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(song.id);
    }
  };

  const handleTogglePlay = () => {
    if (!currentSong && songs.length > 0) {
      handlePlaySong(songs[0]);
      return;
    }

    if (isPlaying) {
      playerRef.current?.pauseVideo();
    } else {
      playerRef.current?.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!currentSong) return;
    const idx = songs.findIndex(s => s.id === currentSong.id);
    const nextIdx = (idx + 1) % songs.length;
    handlePlaySong(songs[nextIdx]);
  };

  const handlePrev = () => {
    if (!currentSong) return;
    const idx = songs.findIndex(s => s.id === currentSong.id);
    const prevIdx = (idx - 1 + songs.length) % songs.length;
    handlePlaySong(songs[prevIdx]);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans selection:bg-pink-500/30 selection:text-white">
      
      {/* Hidden YouTube Player Div */}
      <div id="youtube-player" className="absolute -top-[1000px] -left-[1000px] pointer-events-none opacity-0"></div>

      {/* Background Ambient Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 rounded-full blur-[150px] animate-pulse"></div>
      </div>

      <div className="hidden md:flex h-full z-20 relative">
        <Sidebar 
          categories={CATEGORIES} 
          selectedId={selectedCategoryId} 
          onSelect={setSelectedCategoryId}
          userEmail={USER_EMAIL}
        />
      </div>

      <main className="flex-1 h-full overflow-hidden flex flex-col relative z-10">
        <div className="md:hidden bg-black/50 backdrop-blur-xl p-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-30">
           <span className="font-bold text-white text-lg tracking-tight">Music</span>
           <select 
              className="bg-zinc-800/50 text-sm p-2 rounded-lg text-white border-none outline-none backdrop-blur-md"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
           >
             {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>

        <SongList 
          songs={songs} 
          loadingState={loadingState} 
          categoryName={currentCategory.name}
          onRefresh={loadSongs}
          onPlay={handlePlaySong}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
        
        <MusicPlayer 
          currentSong={currentSong}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </main>
    </div>
  );
}