import { Song } from "../types";

// ==================================================================================
// ⚠️ 重要：請在下方引號中填入您的 YouTube Data API v3 Key
// 申請網址: https://console.cloud.google.com/apis/library/youtube.googleapis.com
// ==================================================================================
const YOUTUBE_API_KEY = "AIzaSyBpy0IZXf9kkkPh2FlO-UMTVXUSmNqqyTQ"; 

const BASE_URL = "https://www.googleapis.com/youtube/v3";

export const fetchPlaylistByContext = async (
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
    
    // Construct a weighted query: Base Query + (Random subset of Favorite Artists to influence results)
    // We don't add ALL artists every time to avoid query length limits, just a mix.
    const artistString = favoriteArtists.length > 0 
      ? ` ${favoriteArtists.slice(0, 5).join(' ')}` 
      : "";
      
    const fullQuery = `${query}${artistString}`;

    // Loop to fetch at least 2 pages (50 results per page is max) to satisfy > 100 songs requirement
    // Safety break at 3 pages (~150 items) to save quota
    let pagesFetched = 0;
    const maxPages = 3; 

    while (pagesFetched < maxPages) {
      const pageTokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
      
      const searchUrl = `${BASE_URL}/search?part=snippet&maxResults=50&q=${encodeURIComponent(fullQuery)}&type=video&videoCategoryId=10&videoEmbeddable=true&videoDuration=short&fields=nextPageToken,items(id/videoId,snippet(title,channelTitle,thumbnails/high/url,thumbnails/medium/url,publishedAt))&key=${YOUTUBE_API_KEY}${pageTokenParam}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!response.ok) {
        // If quota exceeded or error, break loop but return what we have
        console.warn("YouTube API Warning:", data.error?.message);
        break;
      }

      const pageSongs = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: decodeHTMLEntities(item.snippet.title),
        artist: item.snippet.channelTitle,
        album: item.snippet.channelTitle, 
        duration: "0:00", 
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        year: item.snippet.publishedAt.substring(0, 4)
      }));

      allSongs = [...allSongs, ...pageSongs];
      
      nextPageToken = data.nextPageToken;
      pagesFetched++;

      if (!nextPageToken) break;
    }

    // Remove duplicates based on video ID
    const uniqueSongs = Array.from(new Map(allSongs.map(song => [song.id, song])).values());
    
    return uniqueSongs;

  } catch (error) {
    console.error("Error fetching from YouTube:", error);
    // Return empty array or fallback instead of throwing to prevent app crash
    return mockFallbackData();
  }
};

// Helper to decode HTML entities
function decodeHTMLEntities(text: string) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

// Fallback data
const mockFallbackData = (): Song[] => [
    { id: '1', title: 'API KEY MISSING', artist: 'Please update services/youtubeService.ts', album: 'System', duration: '0:00', thumbnail: 'https://placehold.co/400x400/333/FFF?text=No+Key', year: '2024' },
    { id: '2', title: 'Feature Requires API', artist: 'YouTube Data API v3', album: 'System', duration: '0:00', thumbnail: 'https://placehold.co/400x400/333/FFF?text=Error', year: '2024' },
];