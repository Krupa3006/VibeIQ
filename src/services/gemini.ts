type UserLocation = {
  lat: number;
  lng: number;
};

type GeminiResponse = {
  text: string;
  groundingChunks: any[];
};

export async function getGeminiResponse(
  prompt: string,
  location?: UserLocation,
  modelName = "gemini-2.0-flash"
): Promise<GeminiResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key missing");
  }

  try {
    const res = await fetch(
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

    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini API Error:", text);
      throw new Error("Gemini API failed");
    }

    const data = await res.json();

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
}