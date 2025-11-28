import { Song } from "../types";

// ==================================================================================
// ⚠️ 重要：請在下方引號中填入您的 YouTube Data API v3 Key
// 申請網址: https://console.cloud.google.com/apis/library/youtube.googleapis.com
// ==================================================================================
const YOUTUBE_API_KEY = "在此處填入您的_YOUTUBE_API_KEY"; 

const BASE_URL = "https://www.googleapis.com/youtube/v3";

export const fetchPlaylistByContext = async (
  query: string
): Promise<Song[]> => {
  if (YOUTUBE_API_KEY === "AIzaSyBpy0IZXf9kkkPh2FlO-UMTVXUSmNqqyTQ" || !YOUTUBE_API_KEY) {
    console.error("API Key is missing. Please set it in services/youtubeService.ts");
    // 回傳假資料以免程式崩潰，提醒使用者
    return mockFallbackData();
  }

  try {
    // 1. Search for videos based on the query (treating category name as query)
    // videoCategoryId=10 is "Music"
    const searchUrl = `${BASE_URL}/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || "YouTube API Error");
    }

    // Transform YouTube API response to our Song type
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: decodeHTMLEntities(item.snippet.title),
      artist: item.snippet.channelTitle,
      album: item.snippet.channelTitle, // YouTube doesn't give album info easily in search
      duration: "3:45", // Search API doesn't return duration, requires a second call to 'videos' endpoint. Hardcoded for UI demo.
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      year: item.snippet.publishedAt.substring(0, 4)
    }));

  } catch (error) {
    console.error("Error fetching from YouTube:", error);
    throw error;
  }
};

// Helper to decode HTML entities (e.g. &#39; -> ')
function decodeHTMLEntities(text: string) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

// Fallback data if API Key is missing
const mockFallbackData = (): Song[] => [
    { id: '1', title: 'API KEY MISSING', artist: 'Please update code', album: 'System', duration: '0:00', thumbnail: 'https://placehold.co/400x400/000000/FFF?text=No+Key', year: '2024' },
    { id: '2', title: 'Go to services/youtubeService.ts', artist: 'Instruction', album: 'System', duration: '0:00', thumbnail: 'https://placehold.co/400x400/000000/FFF?text=Edit+File', year: '2024' },
];
