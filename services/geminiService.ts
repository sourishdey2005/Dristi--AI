
import { GoogleGenAI, Type } from "@google/genai";
import { Member } from "../types";

export const recognizeMember = async (
  capturedFrameBase64: string,
  allMembers: Member[]
): Promise<string | null> => {
  if (allMembers.length === 0) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const memberDataText = allMembers.map(m => `ID: ${m.id}, Name: ${m.name}, Reference ID: ${m.referenceId}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: capturedFrameBase64.split(',')[1] || capturedFrameBase64,
              }
            },
            {
              text: `You are a high-accuracy face recognition system for Drishti-AI. 
              The following is a list of registered members:
              ${memberDataText}
              
              Task: Identify the member in the provided image.
              Return ONLY the JSON object with the "memberId" and "confidence" (0 to 1).
              If no member matches with at least 90% confidence, return {"memberId": null, "confidence": 0}.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            memberId: { type: Type.STRING, nullable: true },
            confidence: { type: Type.NUMBER }
          }
        }
      }
    });

    const responseText = response.text?.trim();
    if (!responseText) return null;

    const result = JSON.parse(responseText);
    if (result.memberId && result.confidence > 0.9) {
      return result.memberId;
    }
    return null;
  } catch (error) {
    console.error("Gemini recognition error:", error);
    return null;
  }
};
