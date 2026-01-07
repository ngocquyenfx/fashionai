export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    try {
        const params = await request.json();
        const OWNER_GEMINI_KEY = env.OWNER_GEMINI_KEY;

        if (!OWNER_GEMINI_KEY) {
            return new Response(JSON.stringify({ error: "Thiếu OWNER_GEMINI_KEY." }), { status: 500 });
        }

        // Chuyển đổi dữ liệu sang định dạng OpenRouter/OpenAI
        const messages = [{
            role: "user",
            content: [
                ...(params.characterBase64 ? [{ type: "image_url", image_url: { url: params.characterBase64 } }] : []),
                ...(params.outfitBase64 ? [{ type: "image_url", image_url: { url: params.outfitBase64 } }] : []),
                ...(params.contextBase64 ? [{ type: "image_url", image_url: { url: params.contextBase64 } }] : []),
                { type: "text", text: params.finalPrompt }
            ]
        }];

        // Sử dụng OpenRouter để vượt qua rào cản địa lý của Cloudflare HKG
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OWNER_GEMINI_KEY}`, // Bạn có thể dùng Key Gemini hiện tại hoặc Key OpenRouter
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://fashionai-6uk.pages.dev',
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash-image",
                messages: messages,
                response_format: { type: "json_object" }
            })
        });

        const resData: any = await response.json();
        
        if (!response.ok) throw new Error(resData.error?.message || "Lỗi kết nối trung gian.");

        // Trích xuất ảnh từ phản hồi của OpenRouter
        const images = [resData.choices[0].message.content]; 

        return new Response(JSON.stringify({ images }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: `Địa lý chặn Proxy: ${error.message}` }), { status: 500 });
    }
};
