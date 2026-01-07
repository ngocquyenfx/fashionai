export const onRequestPost = async (context: any) => {
    const { request } = context;
    try {
        const params = await request.json();
        
        // DÁN URL WEB APP BẠN VỪA COPY Ở BƯỚC TRÊN VÀO ĐÂY
        const PROXY_URL = "https://script.google.com/macros/s/AKfycbwXMNCX0mt6IDuTTeQVndWp9OHWkRHO3CzS-lxUnB4Sbus9AL_A7qE41UwgEjAVYfXQlA/exec";

        const parts: any[] = [];
        if (params.characterBase64) parts.push({ inlineData: { data: params.characterBase64.split(',')[1], mimeType: "image/png" } });
        if (params.outfitBase64) parts.push({ inlineData: { data: params.outfitBase64.split(',')[1], mimeType: "image/png" } });
        if (params.contextBase64) parts.push({ inlineData: { data: params.contextBase64.split(',')[1], mimeType: "image/png" } });
        parts.push({ text: params.finalPrompt });

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { imageConfig: { aspectRatio: params.aspectRatio || "3:4" } }
            })
        });

        const resData: any = await response.json();
        
        if (!resData.candidates?.[0]?.content?.parts) {
            throw new Error(resData.error?.message || "Google Script Proxy không nhận được ảnh.");
        }

        const images = resData.candidates[0].content.parts
            .filter((p: any) => p.inlineData)
            .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);

        return new Response(JSON.stringify({ images }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: `Lỗi qua Cầu nối: ${error.message}` }), { status: 500 });
    }
};
