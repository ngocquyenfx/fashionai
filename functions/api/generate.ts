export const onRequestPost = async (context: any) => {
    const { request } = context;
    try {
        const params = await request.json();
        
        // URL Web App Google Script của bạn (Đã cập nhật theo bản mới nhất của bạn)
        const PROXY_URL = "https://script.google.com/macros/s/AKfycbwrYXcluqkkRvnINhN6Zhh9JFFpFhxTuCDTCkTv9dlOojePnmvEvHBjxpR4afpVCbWvpw/exec";

        // Lấy IP thật của người dùng thông qua Header của Cloudflare
        const userIP = request.headers.get("cf-connecting-ip") || "unknown";

        const parts: any[] = [];
        if (params.characterBase64) parts.push({ inlineData: { data: params.characterBase64.split(',')[1], mimeType: "image/png" } });
        if (params.outfitBase64) parts.push({ inlineData: { data: params.outfitBase64.split(',')[1], mimeType: "image/png" } });
        if (params.contextBase64) parts.push({ inlineData: { data: params.contextBase64.split(',')[1], mimeType: "image/png" } });
        parts.push({ text: params.finalPrompt });

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            redirect: 'follow', // Quan trọng: Google Script luôn yêu cầu redirect để thực thi mã
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIP: userIP, // Gửi IP sang Google Script để quản lý giới hạn 5 lượt/ngày
                contents: [{ parts }],
                generationConfig: { 
                    imageConfig: { 
                        aspectRatio: params.aspectRatio || "3:4" 
                    } 
                }
            })
        });

        const resData: any = await response.json();
        
        // Kiểm tra nếu Google Script trả về lỗi (Ví dụ: Hết lượt dùng hoặc lỗi API)
        if (resData.error) {
            throw new Error(resData.error.message);
        }

        // Kiểm tra cấu trúc phản hồi từ Gemini
        if (!resData.candidates?.[0]?.content?.parts) {
            const errorMsg = "Không nhận được phản hồi ảnh từ hệ thống. Vui lòng kiểm tra lại Key hoặc nội dung ảnh.";
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
        // Trả về lỗi chi tiết để hiển thị lên UI (Dòng chữ đỏ dưới nút Tạo ảnh)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
