import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface FaceAnalysisResult {
  detected: boolean;
  faces: {
    age: number;
    gender: string;
    emotion: string;
    emotionBreakdown: {
      happy: number;
      sad: number;
      angry: number;
      surprised: number;
      neutral: number;
      disgusted: number;
      fearful: number;
    };
    race: string;
    confidence: number;
    box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
    summary: string;
    identity?: {
      name: string;
      confidence: number;
    };
  }[];
}

export const KNOWN_INDIVIDUALS = [
  { name: "Sarah Chen", id: "emp_001", role: "AI Research Lead", refUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400" },
  { name: "Marcus Wright", id: "emp_002", role: "Head of Operations", refUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400" },
  { name: "Elena Rodriguez", id: "emp_003", role: "Security Director", refUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400" }
];

export async function analyzeFace(base64Image: string, runRecognition: boolean = false): Promise<FaceAnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const contents: any[] = [
    {
      parts: [
        {
          text: `Perform a high-precision biometric and emotional audit on all human faces detected in this image. 
          For each face, extract:
          - exact estimated age (numerical)
          - gender (male/female/non-binary)
          - primary dominant emotion
          - emotional breakdown: numerical intensities (0-1) for (happy, sad, angry, surprised, neutral, disgusted, fearful).
          - specific ethnicity/racial category
          - a global confidence level for the detection (0-1)
          - a precise bounding box [ymin, xmin, ymax, xmax] (normalized 0-1000)
          - a clinical visual summary of distinct facial features.
          
          ${runRecognition ? `Also, check each face against this database of known individuals. If a face matches, provide the 'name' and identification 'confidence'.
          DATABASE:
          - Sarah Chen (Reference ID: emp_001)
          - Marcus Wright (Reference ID: emp_002)
          - Elena Rodriguez (Reference ID: emp_003)` : ''}

          Return the results with absolute technical rigor.`,
        },
        {
          inlineData: {
            data: base64Image.split(",")[1] || base64Image,
            mimeType: "image/jpeg",
          },
        },
      ],
    }
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detected: { type: Type.BOOLEAN },
          faces: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                age: { type: Type.NUMBER },
                gender: { type: Type.STRING },
                emotion: { type: Type.STRING },
                emotionBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    happy: { type: Type.NUMBER },
                    sad: { type: Type.NUMBER },
                    angry: { type: Type.NUMBER },
                    surprised: { type: Type.NUMBER },
                    neutral: { type: Type.NUMBER },
                    disgusted: { type: Type.NUMBER },
                    fearful: { type: Type.NUMBER },
                  },
                  required: ["happy", "sad", "angry", "surprised", "neutral", "disgusted", "fearful"],
                },
                race: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                box2d: {
                  type: Type.ARRAY,
                  items: { type: Type.NUMBER },
                  description: "[ymin, xmin, ymax, xmax]",
                },
                summary: { type: Type.STRING },
                identity: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ["name", "confidence"]
                }
              },
              required: ["age", "gender", "emotion", "emotionBreakdown", "race", "confidence", "box2d", "summary"],
            },
          },
        },
        required: ["detected", "faces"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid response from AI");
  }
}

export async function batchIdentify(probe: string, references: string[]): Promise<{ matchIndex: number | null; score: number; reason: string }> {
  const model = "gemini-3-flash-preview";
  
  const refParts = references.map((ref, i) => ([
    { text: `Reference Image ${i + 1}:` },
    { inlineData: { data: ref.split(",")[1] || ref, mimeType: "image/jpeg" } }
  ])).flat();

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: "Task: Compare the face in the 'Probe Image' against all 'Reference Images'. Identify which reference image most likely contains the same person as the probe image." },
          { text: "Probe Image:" },
          { inlineData: { data: probe.split(",")[1] || probe, mimeType: "image/jpeg" } },
          ...refParts,
          { text: "Return a 'matchIndex' (1-based index or null if no match), a 'score' (0-1), and a 'reason' for the match." }
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchIndex: { type: Type.NUMBER, nullable: true },
          score: { type: Type.NUMBER },
          reason: { type: Type.STRING },
        },
        required: ["matchIndex", "score", "reason"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function compareFaces(img1: string, img2: string): Promise<{ match: boolean; score: number; reason: string }> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: "Compare the faces in these two images. Are they the same person? Provide a boolean 'match', a similarity 'score' (0-1), and a 'reason'." },
          { inlineData: { data: img1.split(",")[1] || img1, mimeType: "image/jpeg" } },
          { inlineData: { data: img2.split(",")[1] || img2, mimeType: "image/jpeg" } },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          match: { type: Type.BOOLEAN },
          score: { type: Type.NUMBER },
          reason: { type: Type.STRING },
        },
        required: ["match", "score", "reason"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}
