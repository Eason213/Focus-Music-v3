import { Song } from "../types";

// ==================================================================================
// ⚠️ 重要：請在下方引號中填入您的 YouTube Data API v3 Key
// 申請網址: https://console.cloud.google.com/apis/library/youtube.googleapis.com
// ==================================================================================
const YOUTUBE_API_KEY = "AIzaSyBpy0IZXf9kkkPh2FlO-UMTVXUSmNqqyTQ"; 

const BASE_URL = "https://www.googleapis.com/youtube/v3";

export const fetchPlaylistByContext = async (
  query: string
): Promise<Song[]> => {
  if (YOUTUBE_API_KEY === "在此處填入您的_YOUTUBE_API_KEY" || !YOUTUBE_API_KEY) {
    console.error("API Key is missing. Please set it in services/youtubeService.ts");
    // 回傳假資料以免程式崩潰，提醒使用者
    return mockFallbackData();
  }

  try {
    // videoCategoryId=10 is "Music"
    // videoEmbeddable=true ensures we can play it in the iframe
    // videoDuration=short ensures video is < 4 minutes
    // fields=... drastically reduces payload size for faster loading
    const searchUrl = `${BASE_URL}/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&videoEmbeddable=true&videoDuration=short&fields=items(id/videoId,snippet(title,channelTitle,thumbnails/high/url,thumbnails/medium/url,publishedAt))&key=${YOUTUBE_API_KEY}`;
    
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
      album: item.snippet.channelTitle, 
      duration: "0:00", // Will be updated by player when loaded
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      year: item.snippet.publishedAt.substring(0, 4)
    }));

  } catch (error) {
    console.error("Error fetching from YouTube:", error);
    throw error;
  }
};

// Helper to decode HTML entities
function decodeHTMLEntities(text: string) {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

// Fallback data if API Key is missing
const mockFallbackData = (): Song[] => [
    { id: '1', title: 'API KEY MISSING', artist: 'Please update services/youtubeService.ts', album: 'System', duration: '0:00', thumbnail: 'https://placehold.co/400x400/333/FFF?text=No+Key', year: '2024' },
    { id: '2', title: 'Search Feature', artist: 'Requires valid API Key', album: 'System', duration: '0:00', thumbnail: 'https://placehold.co/400x400/333/FFF?text=Search', year: '2024' },
];