import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  return (import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
};

export const getGeminiResponse = async (prompt: string, location?: { lat: number; lng: number }, modelName: string = "gemini-2.0-flash", systemInstruction?: string) => {
  // In development (AI Studio Preview), use the SDK directly to avoid proxy issues
  if (import.meta.env.DEV) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please add it to your environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const config: any = { tools: [{ googleMaps: {} }] };
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (location) {
      config.toolConfig = { retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } } };
    }

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config
      });
      return {
        text: response.text || "",
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      };
    } catch (error: any) {
      console.error("Gemini SDK Error:", error);
      throw error;
    }
  }

  // In production, use the secure proxy
  const url = "/api/gemini";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, location, modelName, systemInstruction }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Aesthetic Engine Error: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    return {
      text: data.text,
      groundingChunks: data.groundingChunks || [],
    };
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    throw error;
  }
};
