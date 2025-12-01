import { Song } from "../types";

// ==================================================================================
// ⚠️ 重要：請在下方陣列中填入您的 YouTube Data API v3 Keys
// 您可以填入多組 Key (字串)，系統會自動輪替使用以分散配額或在失效時切換
// ==================================================================================
const YOUTUBE_API_KEYS = [
  "AIzaSyBpy0IZXf9kkkPh2FlO-UMTVXUSmNqqyTQ",
  "AIzaSyDWekcXfw_MXFnUdVEiMX5F-NBjJX2iabw"
];

const BASE_URL = "https://www.googleapis.com/youtube/v3";

// Categories that require female/girl group filter
const FEMALE_ONLY_CATEGORIES = ['quick_picks', 'kpop_hits', 'sim_kpop', 'new_release'];

// Helper to manage key rotation
let currentKeyIndex = Math.floor(Math.random() * YOUTUBE_API_KEYS.length);

const getApiKey = (): string | null => {
  const key = YOUTUBE_API_KEYS[currentKeyIndex];
  if (!key || key.includes("在此處填入")) {
     // If the current key is invalid, try to find *any* valid key
     const validKey = YOUTUBE_API_KEYS.find(k => k && !k.includes("在此處填入"));
     return validKey || null;
  }
  return key;
};

const rotateKey = () => {
  const prevIndex = currentKeyIndex;
  currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
  console.warn(`Rotating API Key: index ${prevIndex} -> ${currentKeyIndex}`);
};

/**
 * High-order fetch function that handles API key rotation on specific error codes.
 */
const fetchWithRotation = async (urlCreator: (key: string) => string): Promise<Response> => {
  let attempts = 0;
  // Try each key at least once if needed
  const maxAttempts = YOUTUBE_API_KEYS.length > 0 ? YOUTUBE_API_KEYS.length : 1;

  while (attempts < maxAttempts) {
    const key = getApiKey();
    if (!key) throw new Error("Missing valid YouTube API Key in services/youtubeService.ts");

    const url = urlCreator(key);
    
    try {
      const response = await fetch(url);

      // If successful, return immediately
      if (response.ok) {
        return response;
      }

      // If Quota Exceeded (403) or Rate Limited (429), try next key
      if (response.status === 403 || response.status === 429) {
        console.warn(`API Key failed with status ${response.status}. Switching key...`);
        rotateKey();
        attempts++;
        // Continue to next iteration of while loop
      } else {
        // For other errors (400, 404, 500), throw/return immediately
        return response;
      }
    } catch (error) {
       // Network errors imply we might want to retry, but usually not key related. 
       // For simplicity, we throw here, or you could implement retry logic.
       throw error;
    }
  }

  throw new Error("All API Keys exhausted or quota exceeded.");
};

export const fetchPlaylistByContext = async (
  categoryId: string,
  query: string,
  favoriteArtists: string[] = []
): Promise<Song[]> => {
  if (!getApiKey()) {
    console.error("No valid API Key found. Please check services/youtubeService.ts");
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

    // 3. Random sort for freshness
    const randomSort = Math.random() > 0.5 ? 'relevance' : 'date';

    // Loop to fetch
    let pagesFetched = 0;
    const maxPages = 20; // Aggressive pagination to ensure sufficient filtered results

    while (pagesFetched < maxPages && allSongs.length < 50) {
      const pageTokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
      const cb = Date.now(); // cache buster

      // Use fetchWithRotation for Search API
      const response = await fetchWithRotation((key) => 
        `${BASE_URL}/search?part=snippet&maxResults=50&q=${encodeURIComponent(finalQuery)}&type=video&videoCategoryId=10&videoEmbeddable=true&order=${randomSort}&fields=nextPageToken,items(id/videoId,snippet(title,channelTitle,thumbnails/high/url,thumbnails/medium/url,publishedAt))&key=${key}${pageTokenParam}&_cb=${cb}`
      );

      if (!response.ok) {
        const data = await response.json();
        console.warn("YouTube API Warning:", data.error?.message);
        break;
      }

      const data = await response.json();
      const videoIds = data.items?.map((item: any) => item.id.videoId).join(',');
      
      if (videoIds) {
          // Use fetchWithRotation for Videos API (Duration check)
          const detailsResp = await fetchWithRotation((key) => 
            `${BASE_URL}/videos?part=contentDetails&id=${videoIds}&fields=items(id,contentDetails/duration)&key=${key}`
          );
          
          if (detailsResp.ok) {
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
      }
      
      nextPageToken = data.nextPageToken;
      pagesFetched++;

      if (!nextPageToken) break;
    }

    // Deduplicate songs by ID
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
    { id: '1', title: 'Check API Key or Quota', artist: 'System', album: 'Error', duration: '0:00', thumbnail: 'https://placehold.co/400x400/333/FFF?text=Error', year: '2024' },
];