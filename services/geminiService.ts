import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We simulate fetching "live" data from the account by asking Gemini to generate 
// a highly probable playlist based on the user's profile context provided in the prompt.
export const fetchPlaylistByContext = async (
  categoryName: string, 
  userEmail: string
): Promise<Song[]> => {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  const prompt = `
    Act as the YouTube Music recommendation algorithm for user ${userEmail}.
    
    The user has selected the playlist category: "${categoryName}".
    Current Date: ${currentDate}.
    
    Context for user taste:
    - User loves K-Pop hits.
    - User enjoys nostalgic/old favorites.
    - User wants to discover new releases.
    
    Generate a realistic, high-quality list of 12 songs that would appear in this specific playlist for this month.
    Ensure the songs match the specific category theme perfectly.
    
    For "K-Pop hits", include popular groups like BTS, Blackpink, NewJeans, TWICE, etc.
    For "Intro to Recommended Music", mix genres but keep it accessible.
    For "Relive Old Favorites", focus on hits from 2000-2015 or classic K-pop.
    For "New Releases", include very recent songs from the current year.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              duration: { type: Type.STRING, description: "Format MM:SS" },
              year: { type: Type.STRING }
            },
            required: ["title", "artist", "album", "duration", "year"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Song[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching playlist:", error);
    throw error;
  }
};