
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
    // 1. Build Rigorous Query
    // ---------------------------------------------------------
    let finalQuery = query;

    // A. Gender Enforcement for specific categories
    const FEMALE_ONLY_CATEGORIES = ['quick_picks', 'kpop_hits', 'sim_kpop'];
    if (FEMALE_ONLY_CATEGORIES.includes(categoryId)) {
        finalQuery += ' (female OR "girl group" OR diva)';
    }

    // B. Artist Weighting
    // Pick a random subset of 3 artists to append to query to avoid query limit
    if (favoriteArtists.length > 0) {
        const shuffled = favoriteArtists.sort(() => 0.5 - Math.random());
        const selectedSubset = shuffled.slice(0, 3);
        const artistQuery = selectedSubset.map(a => `"${a}"`).join(' | ');
        finalQuery += ` (${artistQuery})`;
    }

    // ---------------------------------------------------------
    // 2. Fetch Loop (Search -> Get IDs -> Get Details -> Filter)
    // ---------------------------------------------------------
    // We need > 100 songs. Since strict filtering drops many songs,
    // we fetch more pages.
    let pagesFetched = 0;
    const maxPages = 6; // Increased pages to account for filtering drop-off

    while (pagesFetched < maxPages && allSongs.length < 120) {
      const pageTokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
      
      // Step A: Search for Video IDs (Max 50)
      const searchUrl = `${BASE_URL}/search?part=id&maxResults=50&q=${encodeURIComponent(finalQuery)}&type=video&videoCategoryId=10&videoEmbeddable=true&key=${YOUTUBE_API_KEY}${pageTokenParam}`;
      
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchRes.ok || !searchData.items) {
        break;
      }

      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      
      if (videoIds) {
          // Step B: Get Content Details (Duration) & Snippet
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
                    // Strict Filtering: > 2 mins (120s) AND < 4 mins (240s)
                    return song.durationVal > 120 && song.durationVal < 240;
                });

              allSongs = [...allSongs, ...validSongs];
          }
      }

      nextPageToken = searchData.nextPageToken;
      pagesFetched++;
      if (!nextPageToken) break;
    }

    // Deduplicate
    const uniqueSongs = Array.from(new Map(allSongs.map(song => [song.id, song])).values());
    
    return uniqueSongs;

  } catch (error) {
    console.error("Error fetching from YouTube:", error);
    return mockFallbackData();
  }
};

const mockFallbackData = (): Song[] => [
    { id: '1', title: 'API KEY MISSING', artist: 'Please update services/youtubeService.ts', album: 'System', duration: '0:00', thumbnail: 'https://placehold.co/400x400/333/FFF?text=No+Key', year: '2024' },
];
