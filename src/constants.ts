
export const DEFAULT_PROMPT = "Góc máy chính diện, ngang tầm mắt, lấy được toàn thân nhân vật.";

export const EXCLUSIONS = ". Ensure a clean composition with no visual artifacts or unrelated objects. Scene requirements: Photorealistic, highly detailed, No blurry details, no distorted perspective, no cartoon style, no messy electrical wires. Exclude the following: worst quality, low resolution, blurry, distorted perspective, cartoon style, sketch, 3d model look, plastic surface, wax texture, flat lighting, bad composition, watermark, unrealistic scale, deformed structure, overexposed.";

export const CONTEXT_PRESETS = {
  hanoi: {
    label: "Trên đường phố Hà Nội mùa thu vắng vẻ",
    prompt: "Bối cảnh trên con đường tại Hà Nội. Ánh sáng nắng nhẹ, chiếu xuyên qua những tán lá cây. Góc máy chính diện, ngang tầm mắt, lấy được toàn thân nhân vật."
  },
  studio: {
    label: "Trong studio với ánh sáng điện ảnh",
    prompt: "Bối cảnh trong một studio chụp ảnh. Ánh sáng điện ảnh dịu nhẹ, nhân tạo. Góc máy nghệ thuật, ngang tầm mắt, lấy được toàn thân nhân vật."
  }
};


export const ASPECT_RATIOS: { label: string; value: any }[] = [
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" }
];

export const FREE_USAGE_LIMIT = 5;

export const UsageManager = {
  getUsageCount: (): number => {
    return parseInt(localStorage.getItem('usage_count') || '0', 10);
  },

  incrementUsage: () => {
    const current = UsageManager.getUsageCount();
    localStorage.setItem('usage_count', (current + 1).toString());
  },

  checkAndResetDailyUsage: () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastReset = localStorage.getItem('last_reset_date');

    if (lastReset !== today) {
      localStorage.setItem('usage_count', '0');
      localStorage.setItem('last_reset_date', today);
    }
  },

  getUserApiKey: (): string | null => {
    return localStorage.getItem('user_gemini_key');
  },

  setUserApiKey: (key: string) => {
    localStorage.setItem('user_gemini_key', key);
  },

  clearUserApiKey: () => {
    localStorage.removeItem('user_gemini_key');
  },

  isNearLimit: (): boolean => {
    return UsageManager.getUsageCount() >= 8;
  }
};
