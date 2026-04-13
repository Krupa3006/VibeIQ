
export const getGeminiResponse = async (prompt: string, location?: { lat: number; lng: number }, modelName: string = "gemini-2.0-flash", systemInstruction?: string) => {
  try {
    const response = await fetch("/api/gemini", {
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch from aesthetic engine");
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
