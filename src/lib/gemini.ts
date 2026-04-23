import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface FaceAnalysisResult {
  detected: boolean;
  faces: {
    emotion: string;
    suggestion: string;
    troubleshooting?: string;
    emotionBreakdown: {
      happy: number;
      sad: number;
      angry: number;
      surprised: number;
      neutral: number;
      disgusted: number;
      fearful: number;
    };
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
          
          ANALYSIS PROCESS:
          1. Scan for human faces and define bounding boxes.
          2. Inspect specific facial landmarks: brow position (furrowed/raised), eye aperture (narrowed/wide), mouth shape (upturned/downturned/open), and muscle tension around the jaw.
          3. Determine the primary emotional state based on these micro-expressions.
          4. Evaluate data quality (lighting, occlusion).
          
          CRITICAL: Do NOT include or infer any age, gender, or racial characteristics. These fields are strictly forbidden.
          
          FOR EACH FACE, EXTRACT:
          - emotion: The primary dominant emotional state (e.g., Happy, Sad, Neutral, Angry, Surprised, Fearful, Disgusted).
          - suggestion: A constructive suggestion based on the detected emotion.
          - troubleshooting: Technical advice if detection is difficult (low light, etc.), else an empty string.
          - emotionBreakdown: Numerical intensities (0-1) for (happy, sad, angry, surprised, neutral, disgusted, fearful).
          - confidence: Global detection confidence (0-1).
          - box2d: Precise bounding box [ymin, xmin, ymax, xmax] (0-1000).
          - summary: A clinical visual summary of micro-expressions and facial features used for the determination (avoid demographic markers).
          
          ${runRecognition ? `Also, check each face against this database of known individuals:
          DATABASE:
          - Sarah Chen (emp_001)
          - Marcus Wright (emp_002)
          - Elena Rodriguez (emp_003)` : ''}

          Return result as absolute technical JSON. Rigorous neutrality required.`,
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
                emotion: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                troubleshooting: { type: Type.STRING },
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
              required: ["emotion", "suggestion", "troubleshooting", "emotionBreakdown", "confidence", "box2d", "summary"],
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
    { text: `Gallery Sample ${i + 1}:` },
    { inlineData: { data: ref.split(",")[1] || ref, mimeType: "image/jpeg" } }
  ])).flat();

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: `Task: Ultra-High Precision Biometric Identity Search. 
          Analyze the 'Probe Image' and compare it against the entire 'Reference Gallery' through a multi-pass anatomical audit.
          
          VERIFICATION PROTOCOL:
          1. INITIAL SCAN: Filter for individuals with similar facial proportions.
          2. DEEP AUDIT: Compare invariant features: ear morphology (lobes, helical rim), periocular geometry (tear duct alignment, eyelid fold), and nasal symmetry.
          3. SKELETAL SYNC: Evaluate the bone structure of the jawline and cheekbones.
          4. FINAL VALIDATION: Only return a 'matchIndex' if the similarity score exceeds 95% and there are zero biological contradictions.
          
          If there is even minor doubt, or if the subject is not clearly in the gallery, return 'matchIndex' as null. High-stakes environment: accuracy over speed.
          
          Target Probe Image:` },
          { inlineData: { data: probe.split(",")[1] || probe, mimeType: "image/jpeg" } },
          ...refParts,
          { text: "Output JSON: { 'matchIndex': number | null (1-based), 'score': number (0-1), 'reason': string }. Be extremely critical." }
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
          { text: `Task: Conduct a strict 1:1 biometric comparison between these two images. 
          
          ENFORCEMENT RULES:
          1. 'match' should be false unless biometric features (nose bridge structure, eye alignment, lobe shape) are absolutely identical.
          2. Ignore similarities in hair style, glasses, or clothing. Focus strictly on skeletal and soft-tissue geometry.
          3. Rejection is the default state if any anatomical variance is detected.
          4. Return a boolean 'match', a similarity 'score' (0-1), and a technical 'reason'.` },
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
