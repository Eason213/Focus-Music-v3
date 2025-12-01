import { Song } from "../types";

// ==================================================================================
// ⚠️ 重要：請在下方陣列中填入您的 YouTube Data API v3 Keys
// 支援 3 組 Key 輪替，當某一組配額耗盡時會自動切換
// ==================================================================================
const YOUTUBE_API_KEYS = [
  "AIzaSyBpy0IZXf9kkkPh2FlO-UMTVXUSmNqqyTQ",
  "AIzaSyDWekcXfw_MXFnUdVEiMX5F-NBjJX2iabw",
  "AIzaSyCV_CgzIQRrkfKt2F_imy-tOSiiA0f4P9I"
];

const BASE_URL = "https://www.googleapis.com/youtube/v3";

// Categories that PREFER female artists (Soft Filter)
// If these don't return enough songs, we fall back to general queries
const FEMALE_PRIORITY_CATEGORIES = ['quick_picks', 'kpop_hits', 'sim_kpop', 'new_release'];

// Backup queries to ensure we hit 50 songs if the specific filter is too strict
const BACKUP_QUERIES: Record<string, string> = {
  'quick_picks': 'Popular music hits 2024 official audio',
  'kpop_hits': 'K-Pop top 100 songs 2024',
  'mandopop_hits': 'Top Mandopop songs 2024',
  'sim_kpop': 'Upbeat pop dance songs 2024',
  'new_release': 'New music releases 2024',
  'search': '' // Search uses user query as backup
};

// Helper to manage key rotation
let currentKeyIndex = Math.floor(Math.random() * YOUTUBE_API_KEYS.length);

const getApiKey = (): string | null => {
  const key = YOUTUBE_API_KEYS[currentKeyIndex];
  if (!key || key.includes("在此處填入")) {
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

const fetchWithRotation = async (urlCreator: (key: string) => string): Promise<Response> => {
  let attempts = 0;
  const maxAttempts = YOUTUBE_API_KEYS.length > 0 ? YOUTUBE_API_KEYS.length : 1;

  while (attempts < maxAttempts) {
    const key = getApiKey();
    if (!key) throw new Error("Missing valid YouTube API Key in services/youtubeService.ts");

    const url = urlCreator(key);
    
    try {
      const response = await fetch(url);
      if (response.ok) return response;

      if (response.status === 403 || response.status === 429) {
        console.warn(`API Key failed with status ${response.status}. Switching key...`);
        rotateKey();
        attempts++;
      } else {
        return response;
      }
    } catch (error) {
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
    const uniqueSongsMap = new Map<string, Song>();
    const TARGET_COUNT = 50;

    // --- Inner Function to fetch and process songs ---
    const fetchAndProcess = async (searchQuery: string, maxPages: number) => {
        let nextPageToken = "";
        let pagesFetched = 0;

        while (pagesFetched < maxPages && uniqueSongsMap.size < TARGET_COUNT) {
            const pageTokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
            const cb = Date.now(); // Cache buster
            const randomSort = Math.random() > 0.5 ? 'relevance' : 'date';

            const response = await fetchWithRotation((key) => 
                `${BASE_URL}/search?part=snippet&maxResults=50&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=10&videoEmbeddable=true&order=${randomSort}&fields=nextPageToken,items(id/videoId,snippet(title,channelTitle,thumbnails/high/url,thumbnails/medium/url,publishedAt))&key=${key}${pageTokenParam}&_cb=${cb}`
            );

            if (!response.ok) break;

            const data = await response.json();
            const videoIds = data.items?.map((item: any) => item.id.videoId).join(',');
            
            if (videoIds) {
                // Fetch Duration
                const detailsResp = await fetchWithRotation((key) => 
                    `${BASE_URL}/videos?part=contentDetails&id=${videoIds}&fields=items(id,contentDetails/duration)&key=${key}`
                );
                
                if (detailsResp.ok) {
                    const detailsData = await detailsResp.json();
                    const durationMap = new Map();
                    detailsData.items?.forEach((item: any) => {
                        durationMap.set(item.id, parseDuration(item.contentDetails.duration));
                    });

                    data.items.forEach((item: any) => {
                        const vid = item.id.videoId;
                        // Avoid duplicates immediately
                        if (uniqueSongsMap.has(vid)) return;

                        const seconds = durationMap.get(vid) || 0;
                        // Filter: > 60s (No Shorts) AND < 300s (5 Mins)
                        if (seconds > 60 && seconds < 300) {
                            uniqueSongsMap.set(vid, {
                                id: vid,
                                title: decodeHTMLEntities(item.snippet.title),
                                artist: item.snippet.channelTitle,
                                album: item.snippet.channelTitle, 
                                duration: formatTime(seconds), 
                                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                                year: item.snippet.publishedAt.substring(0, 4)
                            });
                        }
                    });
                }
            }
            
            nextPageToken = data.nextPageToken;
            pagesFetched++;
            if (!nextPageToken) break;
        }
    };

    // 1. PHASE ONE: Main Query with Preferences (e.g. Female Priority + Artists)
    let mainQuery = query;
    
    // Add Artist Weights (Top 3)
    const artistStr = favoriteArtists.slice(0, 3).join(' ');
    if (artistStr) mainQuery += ` ${artistStr}`;

    // Apply Female Priority (Soft Filter)
    if (FEMALE_PRIORITY_CATEGORIES.includes(categoryId)) {
       mainQuery += ` (female singer|girl group)`;
    }

    // Try fetching with specific constraints first
    await fetchAndProcess(mainQuery, 10);

    // 2. PHASE TWO: Gap Filling (Backup Query)
    // If we haven't reached TARGET_COUNT (50), use a broader query
    if (uniqueSongsMap.size < TARGET_COUNT) {
        console.log(`Phase 1 found ${uniqueSongsMap.size} songs. Starting Phase 2 (Gap Filling)...`);
        
        // Determine backup query
        let backupQuery = BACKUP_QUERIES[categoryId] || query;
        
        // If it's a search, the backup is just the raw query without gender filters
        if (categoryId === 'search') backupQuery = query;

        // Try fetching with broad constraints to fill the list
        await fetchAndProcess(backupQuery, 20);
    }

    const resultSongs = Array.from(uniqueSongsMap.values());

    // Final fallback if absolutely nothing found
    if (resultSongs.length === 0) {
        return mockFallbackData();
    }

    return resultSongs;

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
    { id: 'error', title: 'No Songs Found', artist: 'System', album: 'Try Refreshing', duration: '0:00', thumbnail: 'https://placehold.co/400x400/333/FFF?text=Empty', year: '2024' },
];