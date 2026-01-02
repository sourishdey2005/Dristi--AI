
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types";

export const recognizeStudent = async (
  capturedFrameBase64: string,
  allStudents: Student[]
): Promise<string | null> => {
  if (allStudents.length === 0) return null;

  // Fix: Initialize GoogleGenAI using the recommended pattern and direct environment variable access.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // We send the current frame and a context of student photos (or just names/IDs to match)
  // For high accuracy, we'll provide the names and IDs and ask Gemini to identify the person in the video frame
  // compared to a set of reference data.
  
  const studentDataText = allStudents.map(s => `ID: ${s.id}, Name: ${s.name}, Roll: ${s.rollNumber}`).join('\n');

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
              The following is a list of registered students:
              ${studentDataText}
              
              Task: Identify the student in the provided image.
              Return ONLY the JSON object with the "studentId" and "confidence" (0 to 1).
              If no student matches with at least 90% confidence, return {"studentId": null, "confidence": 0}.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentId: { type: Type.STRING, nullable: true },
            confidence: { type: Type.NUMBER }
          }
        }
      }
    });

    // Fix: Robust extraction and validation of generated text content before JSON parsing.
    const responseText = response.text?.trim();
    if (!responseText) return null;

    const result = JSON.parse(responseText);
    if (result.studentId && result.confidence > 0.9) {
      return result.studentId;
    }
    return null;
  } catch (error) {
    console.error("Gemini recognition error:", error);
    return null;
  }
};
