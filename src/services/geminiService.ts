import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getMedicineInsights(medicineName: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a brief overview of the medicine "${medicineName}". Include:
      1. Primary Uses
      2. Common Side Effects
      3. Typical Dosage (Standard)
      4. Key Precautions
      Keep it professional and concise for a pharmacist's reference.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Could not retrieve insights at this moment.";
  }
}

export async function suggestAlternatives(genericName: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List common brand names for the generic salt "${genericName}". Group them by effectiveness or prevalence if possible.`,
    });
    return response.text;
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return "Alternatives not available.";
  }
}
