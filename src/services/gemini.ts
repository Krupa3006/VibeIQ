type UserLocation = {
  lat: number;
  lng: number;
};

type GeminiResponse = {
  text: string;
  groundingChunks: any[];
};

export const getGeminiResponse = async (
  prompt: string,
  location?: UserLocation,
  modelName: string = "gemini-2.0-flash"
): Promise<GeminiResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key missing");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error("Gemini API failed");
    }

    const data = await response.json();

    return {
      text:
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response",
      groundingChunks: [],
    };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "Failed to fetch Gemini response");
  }
};