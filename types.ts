export interface Song {
  id: string; // YouTube Video ID
  title: string;
  artist: string; // Channel Title as artist proxy
  album: string; // Not always available from YouTube Search, can be Channel Name or empty
  duration: string; // ISO 8601 duration needs parsing, or simple display
  thumbnail: string;
  year: string; // Publish date year
}

export interface PlaylistCategory {
  id: string;
  name: string;
  query: string; // Search query for YouTube
  description: string;
  icon: string; 
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}