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
  modelName = "gemini-3.0-flash",
  systemInstruction?: string
): Promise<GeminiResponse> {
  try {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        location,
        modelName,
        systemInstruction,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Failed to get Gemini response");
    }

    return {
      text: data?.text || "",
      groundingChunks: data?.groundingChunks || [],
    };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error?.message || "Unable to fetch Gemini response");
  }
}