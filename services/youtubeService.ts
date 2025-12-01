import { Song } from "../types";

// ==================================================================================
// ⚠️ 重要：請在下方引號中填入您的 YouTube Data API v3 Key
// 申請網址: https://console.cloud.google.com/apis/library/youtube.googleapis.com
// ==================================================================================
const YOUTUBE_API_KEY = "AIzaSyBpy0IZXf9kkkPh2FlO-UMTVXUSmNqqyTQ"; 

const BASE_URL = "https://www.googleapis.com/youtube/v3";

const FEMALE_ONLY_CATEGORIES = ['quick_picks', 'kpop_hits', 'sim_kpop', 'new_release'];

export const fetchPlaylistByContext = async (
  categoryId: string,
  query: string,
  favoriteArtists: string[] = []
): Promise<Song[]> => {
  if (YOUTUBE_API_KEY === "在此處填入您的_YOUTUBE_API_KEY" || !YOUTUBE_API_KEY) {
    console.error("API Key is missing. Please set it in services/youtubeService.ts");
    return mockFallbackData();
  }

  try {
    let allSongs: Song[] = [];
    let nextPageToken = "";
    
    // Construct Query
    let finalQuery = query;
    
    // 1. Artist weighting
    const artistString = favoriteArtists.length > 0 
      ? ` ${favoriteArtists.slice(0, 3).join(' ')}` 
      : "";
    finalQuery += artistString;

    // 2. Gender filtering (Except Mandopop & Search)
    if (FEMALE_ONLY_CATEGORIES.includes(categoryId)) {
       finalQuery += ` (female singer|girl group)`;
    }

    // 3. Cache busting / Randomness
    const randomSort = Math.random() > 0.5 ? 'relevance' : 'date';

    // Loop to fetch
    // We fetch a bit more because client-side duration filtering might remove items
    let pagesFetched = 0;
    const maxPages = 4; 

    while (pagesFetched < maxPages && allSongs.length < 50) {
      const pageTokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
      const cb = Date.now(); // cache buster

      // REMOVED videoDuration=short to allow Mandopop (usually > 4 mins)
      const searchUrl = `${BASE_URL}/search?part=snippet&maxResults=50&q=${encodeURIComponent(finalQuery)}&type=video&videoCategoryId=10&videoEmbeddable=true&order=${randomSort}&fields=nextPageToken,items(id/videoId,snippet(title,channelTitle,thumbnails/high/url,thumbnails/medium/url,publishedAt))&key=${YOUTUBE_API_KEY}${pageTokenParam}&_cb=${cb}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!response.ok) {
        console.warn("YouTube API Warning:", data.error?.message);
        break;
      }

      const videoIds = data.items?.map((item: any) => item.id.videoId).join(',');
      
      if (videoIds) {
          // Fetch Details for Duration
          const detailsUrl = `${BASE_URL}/videos?part=contentDetails&id=${videoIds}&fields=items(id,contentDetails/duration)&key=${YOUTUBE_API_KEY}`;
          const detailsResp = await fetch(detailsUrl);
          const detailsData = await detailsResp.json();
          
          const durationMap = new Map();
          detailsData.items?.forEach((item: any) => {
              durationMap.set(item.id, parseDuration(item.contentDetails.duration));
          });

          const pageSongs: Song[] = [];
          
          data.items.forEach((item: any) => {
             const seconds = durationMap.get(item.id.videoId) || 0;
             // Filter: > 60s (avoid shorts) AND < 300s (5 mins)
             if (seconds > 60 && seconds < 300) {
                 pageSongs.push({
                    id: item.id.videoId,
                    title: decodeHTMLEntities(item.snippet.title),
                    artist: item.snippet.channelTitle,
                    album: item.snippet.channelTitle, 
                    duration: formatTime(seconds), 
                    thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                    year: item.snippet.publishedAt.substring(0, 4)
                 });
             }
          });
          
          allSongs = [...allSongs, ...pageSongs];
      }
      
      nextPageToken = data.nextPageToken;
      pagesFetched++;

      if (!nextPageToken) break;
    }

    // Deduplicate
    const uniqueSongs = Array.from(new Map(allSongs.map(song => [song.id, song])).values());
    
    // If we still have 0 songs (e.g. extremely strict filters), return mock to avoid empty screen
    if (uniqueSongs.length === 0) {
        return mockFallbackData();
    }

    return uniqueSongs;

  } catch (error) {
    console.error("Error fetching from YouTube:", error);
    return mockFallbackData();
  }
};

function parseDuration(isoDuration: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);
    if (!matches) return 0;
    
    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);
    
    return (hours * 3600) + (minutes * 60) + seconds;
}

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function decodeHTMLEntities(text: string) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

const mockFallbackData = (): Song[] => [
    { id: '1', title: 'API Limit Reached or No Results', artist: 'Please Check API Key', album: 'System', duration: '0:00', thumbnail: 'https://placehold.co/400x400/333/FFF?text=Error', year: '2024' },
];