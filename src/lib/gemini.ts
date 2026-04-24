import { GoogleGenAI, Type } from "@google/genai";
import { Restaurant, SearchFilters } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function findRestaurants(
  craving: string,
  location: { lat: number; lng: number } | string,
  filters: SearchFilters
): Promise<Restaurant[]> {
  const filterString = Object.entries(filters)
    .filter(([_, value]) => value)
    .map(([key]) => key)
    .join(", ");

  const locationString = typeof location === "string" 
    ? location 
    : `at latitude ${location.lat}, longitude ${location.lng}`;

  const prompt = `
    Find me 5 actual, currently operating restaurants that satisfy this specific craving: "${craving}".
    Location: Near ${locationString}.
    Mandatory Filters to respect: ${filterString || "None"}.
    
    For each restaurant, provide:
    - name
    - description (what they are known for)
    - address
    - rating (approximate or current)
    - priceRange (e.g., $, $$, $$$)
    - cuisineType
    - whyItMatches (how it specifically satisfies the craving "${craving}")
    - features (list of strings)
    - lat (latitude as a number)
    - lng (longitude as a number)

    Return the results as a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              address: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              priceRange: { type: Type.STRING },
              cuisineType: { type: Type.STRING },
              whyItMatches: { type: Type.STRING },
              features: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER }
            },
            required: ["name", "description", "address", "rating", "priceRange", "cuisineType", "whyItMatches", "features", "lat", "lng"]
          }
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // The response.text might contain a JSON block if responseMimeType is set, 
    // but with tools it sometimes wraps it. 
    // Usually responseMimeType works well with flash-preview.
    return JSON.parse(text) as Restaurant[];
  } catch (error) {
    console.error("Error finding restaurants:", error);
    return [];
  }
}
