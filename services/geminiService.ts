
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const brainstormBandDetails = async (genre: string, mood: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Haz una lluvia de ideas creativa para una nueva banda del género ${genre} con una vibra ${mood}. 
               Proporciona un nombre de banda creativo, una biografía corta y convincente, y 3 posibles títulos de álbumes. Todo en español.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bandName: { type: Type.STRING },
          bio: { type: Type.STRING },
          suggestedAlbums: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["bandName", "bio", "suggestedAlbums"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const suggestTrackNames = async (albumTitle: string, genre: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Sugiere 5 títulos de canciones creativos para un álbum llamado "${albumTitle}" del género ${genre}. Todo en español.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};
