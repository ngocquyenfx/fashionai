export const onRequestPost = async (context: any) => {
    const { request, env } = context;
    try {
        const params = await request.json();
        const OWNER_GEMINI_KEY = env.OWNER_GEMINI_KEY;

        if (!OWNER_GEMINI_KEY) {
            return new Response(JSON.stringify({ error: "Thiếu OWNER_GEMINI_KEY trên Cloudflare." }), { status: 500 });
        }

        const parts: any[] = [];
        if (params.characterBase64) parts.push({ inlineData: { data: params.characterBase64.split(',')[1], mimeType: \"image/png\" } });
        if (params.outfitBase64) parts.push({ inlineData: { data: params.outfitBase64.split(',')[1], mimeType: \"image/png\" } });
        if (params.contextBase64) parts.push({ inlineData: { data: params.contextBase64.split(',')[1], mimeType: \"image/png\" } });
        parts.push({ text: params.finalPrompt });

        // Sử dụng endpoint chuẩn của Google
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${OWNER_GEMINI_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { imageConfig: { aspectRatio: params.aspectRatio || \"3:4\" } }
            })
        });

        const resData: any = await response.json();

        if (!response.ok) {
            // Trả về lỗi thật từ Google để biết chính xác vấn đề
            throw new Error(resData.error?.message || \"Google từ chối yêu cầu.\");
        }

        const images = resData.candidates[0].content.parts
            .filter((p: any) => p.inlineData)
            .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);

        return new Response(JSON.stringify({ images }), { status: 200 });

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: `Lỗi Proxy: ${error.message}` }),
            { status: 500 }
        );
    }
};
