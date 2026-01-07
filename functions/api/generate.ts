
export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    try {
        const params = await request.json();
        const OWNER_GEMINI_KEY = env.OWNER_GEMINI_KEY;

        if (!OWNER_GEMINI_KEY) {
            return new Response(JSON.stringify({ error: "Thiếu OWNER_GEMINI_KEY trên Cloudflare Dashboard." }), { status: 500 });
        }

        const parts: any[] = [];
        if (params.characterBase64) parts.push({ inlineData: { data: params.characterBase64.split(',')[1], mimeType: "image/png" } });
        if (params.outfitBase64) parts.push({ inlineData: { data: params.outfitBase64.split(',')[1], mimeType: "image/png" } });
        if (params.contextBase64) parts.push({ inlineData: { data: params.contextBase64.split(',')[1], mimeType: "image/png" } });
        parts.push({ text: params.finalPrompt });

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${OWNER_GEMINI_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    // Đồng bộ tỷ lệ ảnh giống hệt như khi dùng SDK
                    imageConfig: {
                        aspectRatio: params.aspectRatio || "3:4"
                    }
                }
            })
        });

        const resData: any = await response.json();

        // Kiểm tra xem Google có trả về ảnh không hay bị chặn bởi bộ lọc
        if (!response.ok || !resData.candidates?.[0]?.content?.parts) {
            const errorMsg = resData.error?.message || "Google từ chối yêu cầu (có thể do bộ lọc an toàn hoặc sai định dạng).";
            throw new Error(errorMsg);
        }

        const images = resData.candidates[0].content.parts
            .filter((p: any) => p.inlineData)
            .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);

        return new Response(JSON.stringify({ images }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: `Lỗi hệ thống: ${error.message}` }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
