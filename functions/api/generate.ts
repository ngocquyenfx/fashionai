
export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    try {
        const params = await request.json();
        const OWNER_GEMINI_KEY = env.OWNER_GEMINI_KEY;

        if (!OWNER_GEMINI_KEY || OWNER_GEMINI_KEY === "PLACEHOLDER_API_KEY") {
            return new Response(
                JSON.stringify({
                    error: "Hệ thống chưa cấu hình OWNER_GEMINI_KEY. Hãy thiết lập biến môi trường này trên Cloudflare Dashboard (Settings -> Variables)."
                }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Basic request validation
        if (!params.finalPrompt) {
            return new Response(
                JSON.stringify({ error: "Thiếu dữ liệu prompt." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // IP-based Rate Limiting (Conceptual for stateless function without KV)
        // For a real production app, you would use Cloudflare KV or Durable Objects here.
        // For now, we rely on the Frontend's 10-call limit and basic security.

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

        // Call Google API directly from the worker (no SDK needed, use fetch to avoid dependency issues)
        const images: string[] = [];
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${OWNER_GEMINI_KEY}`;

        for (let i = 0; i < (params.count || 1); i++) {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        // Note: aspectRatio is handled differently in raw API sometimes, 
                        // but for this model, we pass it in imageConfig if supported.
                        // As of now, flash-exp might have different fields. 
                        // We'll mimic the SDK behavior.
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Gemini API Error:", errorText);
                throw new Error("Lỗi khi gọi Gemini API qua Proxy.");
            }

            const resData: any = await response.json();
            if (resData.candidates && resData.candidates[0].content.parts) {
                for (const part of resData.candidates[0].content.parts) {
                    if (part.inlineData) {
                        images.push(`data:image/png;base64,${part.inlineData.data}`);
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({ images }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message || "Đã xảy ra lỗi tại Proxy." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
