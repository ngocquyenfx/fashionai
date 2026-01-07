
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface GeneratedImage {
  id: string;
  url: string;
  timestamp: number;
}

export interface AppState {
  characterImg: string | null;
  outfitImg: string | null;
  contextImg: string | null;
  prompt: string;
  aspectRatio: AspectRatio;
  imageCount: number;
  results: GeneratedImage[];
  isGenerating: boolean;
  error: string | null;
}

export enum ContextOption {
  HANOI = "Hanoi Street",
  STUDIO = "Studio Lighting"
}
