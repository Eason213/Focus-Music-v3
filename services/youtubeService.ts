
import { Song } from "../types";

// ==================================================================================
// ⚠️ 重要：請在下方引號中填入您的 YouTube Data API v3 Key
// 申請網址: https://console.cloud.google.com/apis/library/youtube.googleapis.com
// ==================================================================================
const YOUTUBE_API_KEY = "AIzaSyBpy0IZXf9kkkPh2FlO-UMTVXUSmNqqyTQ"; 

const BASE_URL = "https://www.googleapis.com/youtube/v3";

/**
 * Parses ISO 8601 duration string (e.g., PT3M20S) to seconds.
 */
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (parseInt(match[1] || '') || 0);
  const minutes = (parseInt(match[2] || '') || 0);
  const seconds = (parseInt(match[3] || '') || 0);

  return (hours * 3600) + (minutes * 60) + seconds;
}

function formatDuration(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

export const fetchPlaylistByContext = async (
  query: string,
  categoryId: string,
  favoriteArtists: string[] = []
): Promise<Song[]> => {
  if (YOUTUBE_API_KEY === "在此處填入您的_YOUTUBE_API_KEY" || !YOUTUBE_API_KEY) {
    console.error("API Key is missing. Please set it in services/youtubeService.ts");
    return mockFallbackData();
  }

  try {
    let allSongs: Song[] = [];
    let nextPageToken = "";
    
    // ---------------------------------------------------------
    // 1. Build Query with Strict Logic
    // ---------------------------------------------------------
    let finalQuery = query;

    // Gender Logic: 
    // "華語流行音樂熱門歌曲 (mandopop_hits)" and "Search" are EXEMPT from female restriction.
    // All other categories (Quick Picks, K-Pop, Sim K-Pop, New Release) MUST use gender filtering.
    const FEMALE_ONLY_CATEGORIES = ['quick_picks', 'kpop_hits', 'sim_kpop', 'new_release'];
    
    if (FEMALE_ONLY_CATEGORIES.includes(categoryId)) {
        finalQuery += ' (female OR "girl group" OR diva)';
    }

    // Artist Weighting & Dynamic Recommendation
    if (favoriteArtists.length > 0) {
        const shuffled = favoriteArtists.sort(() => 0.5 - Math.random());
        // Use up to 3 artists to influence the query without narrowing it too much
        const selectedSubset = shuffled.slice(0, 3);
        const artistQuery = selectedSubset.map(a => `"${a}"`).join(' | ');
        finalQuery += ` (${artistQuery})`;
    }

    // Freshness Logic
    // Randomize order to ensure fresh results on reload
    // We rotate between 'relevance', 'date', 'viewCount', 'rating' to get different seeds
    const orderOptions = ['relevance', 'date', 'viewCount', 'rating', 'relevance'];
    const randomOrder = orderOptions[Math.floor(Math.random() * orderOptions.length)];

    // ---------------------------------------------------------
    // 2. Fetch Loop (Search -> Get IDs -> Get Details -> Filter)
    // ---------------------------------------------------------
    // Goal: Get > 50 valid songs. 
    // We increase maxPages to 20 to ensure we search through enough content to pass the filters.
    let pagesFetched = 0;
    const maxPages = 20; 

    while (pagesFetched < maxPages && allSongs.length < 50) {
      const pageTokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
      
      // Cache Buster: _cb=${Date.now()} ensures the browser never caches this request
      const searchUrl = `${BASE_URL}/search?part=id&maxResults=50&q=${encodeURIComponent(finalQuery)}&type=video&videoCategoryId=10&videoEmbeddable=true&order=${randomOrder}&key=${YOUTUBE_API_KEY}${pageTokenParam}&_cb=${Date.now()}`;
      
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchRes.ok || !searchData.items) {
        // If query failed (e.g. strict filters returned 0), break or try fallback
        console.warn("YouTube Search API returned empty or error", searchData);
        break;
      }

      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      
      if (videoIds) {
          const videosUrl = `${BASE_URL}/videos?part=snippet,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
          const videosRes = await fetch(videosUrl);
          const videosData = await videosRes.json();

          if (videosData.items) {
              const validSongs = videosData.items
                .map((item: any) => {
                    const durationSec = parseDurationToSeconds(item.contentDetails.duration);
                    return {
                        id: item.id,
                        title: item.snippet.title,
                        artist: item.snippet.channelTitle,
                        album: item.snippet.channelTitle,
                        durationVal: durationSec,
                        duration: formatDuration(durationSec),
                        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                        year: item.snippet.publishedAt.substring(0, 4)
                    };
                })
                .filter((song: any) => {
                    // STRICT Filtering: > 2 mins (120s) AND < 4 mins (240s)
                    return song.durationVal > 120 && song.durationVal < 240;
                });

              allSongs = [...allSongs, ...validSongs];
          }
      }

      nextPageToken = searchData.nextPageToken;
      pagesFetched++;
      
      // If we run out of tokens but still don't have enough songs (specifically for Mandopop which might be stricter),
      // try a broader query once.
      if (!nextPageToken && allSongs.length < 30 && categoryId === 'mandopop_hits' && !finalQuery.includes('Mandopop songs')) {
          finalQuery = "Mandopop songs"; // Reset to a generic query to fill the list
          nextPageToken = ""; // Restart pagination for new query
          pagesFetched = 0; // Allow a few more pages
      } else if (!nextPageToken) {
          break;
      }
    }

    // Deduplicate songs based on ID
    const uniqueSongs = Array.from(new Map(allSongs.map(song => [song.id, song])).values());
    
    // If still empty after all attempts, use fallback to prevent blank screen
    if (uniqueSongs.length === 0) {
        return mockFallbackData();
    }
    
    return uniqueSongs;

  } catch (error) {
    console.error("Error fetching from YouTube:", error);
    return mockFallbackData();
  }
};

const mockFallbackData = (): Song[] => [
    { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', album: 'Whenever You Need Somebody', duration: '3:32', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', year: '1987' },
    { id: '9bZkp7q19f0', title: 'Gangnam Style', artist: 'PSY', album: 'PSY 6', duration: '3:39', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg', year: '2012' },
    { id: 'gdZLi9oWNZg', title: 'Dynamite', artist: 'BTS', album: 'BE', duration: '3:19', thumbnail: 'https://i.ytimg.com/vi/gdZLi9oWNZg/hqdefault.jpg', year: '2020' },
    { id: 'kOHB28zvCAO', title: 'Faded', artist: 'Alan Walker', album: 'Faded', duration: '3:32', thumbnail: 'https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg', year: '2015' }
];
