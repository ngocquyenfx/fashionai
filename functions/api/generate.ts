export const onRequestPost = async (context: any) => {
    const { request } = context;
    try {
        const params = await request.json();
        
        // DÁN URL /exec MỚI NHẤT BẠN VỪA LẤY Ở BƯỚC 1 VÀO ĐÂY
        const PROXY_URL = "https://script.google.com/macros/s/AKfycbwO2vCsQhnVpDNyNy3AVn0-OJJjC-huap-3Sz7j82UnwaNWhjBrzxnwB9ncQrlOW3SoPA/exec";

        const parts: any[] = [];
        if (params.characterBase64) parts.push({ inlineData: { data: params.characterBase64.split(',')[1], mimeType: "image/png" } });
        if (params.outfitBase64) parts.push({ inlineData: { data: params.outfitBase64.split(',')[1], mimeType: "image/png" } });
        if (params.contextBase64) parts.push({ inlineData: { data: params.contextBase64.split(',')[1], mimeType: "image/png" } });
        parts.push({ text: params.finalPrompt });

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            redirect: 'follow', // Rất quan trọng để đi xuyên qua cơ chế của Google Script
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { imageConfig: { aspectRatio: params.aspectRatio || "3:4" } }
            })
        });

        const resData: any = await response.json();
        
        if (!resData.candidates?.[0]?.content?.parts) {
            const errorMsg = resData.error?.message || "Cầu nối không nhận được ảnh. Hãy kiểm tra lại Key Tier 1.";
            throw new Error(errorMsg);
        }

        const images = resData.candidates[0].content.parts
            .filter((p: any) => p.inlineData)
            .map((p: any) => `data:image/png;base64,${p.inlineData.data}`);

        return new Response(JSON.stringify({ images }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: `Lỗi: ${error.message}` }), { status: 500 });
    }
};
