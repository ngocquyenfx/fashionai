import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";
import { UsageManager } from "../constants";

export const generateFashionImage = async (params: {
  characterBase64: string | null;
  outfitBase64: string | null;
  contextBase64: string | null;
  finalPrompt: string;
  aspectRatio: AspectRatio;
  count: number;
}) => {
  const userKey = UsageManager.getUserApiKey();

  if (userKey) {
    // LAYER 3: Direct call using User's Key
    const ai = new GoogleGenAI({ apiKey: userKey });
    const parts: any[] = [];

    if (params.characterBase64) {
      parts.push({
        inlineData: {
          data: params.characterBase64.split(',')[1],
          mimeType: "image/png"
        }
      });
    }

    if (params.outfitBase64) {
      parts.push({
        inlineData: {
          data: params.outfitBase64.split(',')[1],
          mimeType: "image/png"
        }
      });
    }

    if (params.contextBase64) {
      parts.push({
        inlineData: {
          data: params.contextBase64.split(',')[1],
          mimeType: "image/png"
        }
      });
    }

    parts.push({ text: params.finalPrompt });

    const images: string[] = [];

    for (let i = 0; i < params.count; i++) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image", // Updated model
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: params.aspectRatio
          }
        }
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            images.push(`data:image/png;base64,${part.inlineData.data}`);
          }
        }
      }
    }
    return images;

  } else {
    // LAYER 4: Proxy call (Cloudflare Functions)
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Source-Request': 'Fashion-AI-Builder',
        'X-Custom-Auth': 'YOUR_CUSTOM_AUTH_TOKEN' // Added custom auth header
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Lỗi khi kết nối đến Proxy hệ thống.");
    }

    const data = await response.json();
    UsageManager.incrementUsage();
    return data.images;
  }
};
