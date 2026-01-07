export const onRequestPost = async (context: any) => {
    const { request } = context;
    try {
        const params = await request.json();
        
        // THAY URL WEB APP MỚI CỦA BẠN VÀO ĐÂY
        const PROXY_URL = "https://script.google.com/macros/s/AKfycbxFHLp6zzAm71euUMiaS_GJKazpcOP9i9kGQKuLopGFJhX8PKnSsdtK_I4rgODtZgig/exec";

        const parts: any[] = [];
        if (params.characterBase64) parts.push({ inlineData: { data: params.characterBase64.split(',')[1], mimeType: "image/png" } });
        if (params.outfitBase64) parts.push({ inlineData: { data: params.outfitBase64.split(',')[1], mimeType: "image/png" } });
        if (params.contextBase64) parts.push({ inlineData: { data: params.contextBase64.split(',')[1], mimeType: "image/png" } });
        parts.push({ text: params.finalPrompt });

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { imageConfig: { aspectRatio: params.aspectRatio || "3:4" } }
            })
        });

        const text = await response.text();
        let resData;
        
        try {
            resData = JSON.parse(text);
        } catch (e) {
            // Nếu không phải JSON, trả về nội dung lỗi để kiểm tra
            return new Response(JSON.stringify({ error: "Phản hồi từ Google Script không phải JSON: " + text.substring(0, 100) }), { status: 500 });
        }
        
        if (!resData.candidates?.[0]?.content?.parts) {
            throw new Error(resData.error?.message || "Không nhận được ảnh từ Gemini.");
        }

        const images = resData.candidates[0].content.parts
            .filter((p: any) => p.inlineData)
            .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);

        return new Response(JSON.stringify({ images }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: `Lỗi: ${error.message}` }), { status: 500 });
    }
};
