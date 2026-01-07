
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { UsageManager } from '../constants';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onKeySaved: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
    const [apiKey, setApiKey] = useState(UsageManager.getUserApiKey() || '');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) {
            setError('Vui lòng nhập API Key');
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            // Test connection with the local pattern
            const ai = new GoogleGenAI({ apiKey: trimmedKey });

            // Sửa lỗi: Sử dụng ai.models.generateContent thay vì getGenerativeModel
            await ai.models.generateContent({
                model: "gemini-2.5-flash-image",
                contents: [{ parts: [{ text: "test" }] }]
            });

            UsageManager.setUserApiKey(trimmedKey);
            onKeySaved();
            onClose();
        } catch (err: any) {
            console.error("API Key validation error:", err);
            let errorMessage = 'Key không hợp lệ hoặc đã hết hạn mức cá nhân của bạn.';

            if (err.message) {
                if (err.message.includes('API_KEY_INVALID')) {
                    errorMessage = 'API Key không chính xác. Vui lòng kiểm tra lại.';
                } else if (err.message.includes('quota')) {
                    errorMessage = 'Tài khoản của bạn đã hết hạn mức (Quota).';
                } else if (err.message.includes('API key not found')) {
                    errorMessage = 'Không tìm thấy API Key hoặc Project chưa kích hoạt Generative AI API.';
                } else {
                    errorMessage = `Lỗi: ${err.message}`;
                }
            }
            setError(errorMessage);
        } finally {
            setIsValidating(false);
        }
    };

    const handleReset = () => {
        UsageManager.clearUserApiKey();
        setApiKey('');
        onKeySaved();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <h2 className="text-xl font-bold mb-2">Cấu hình API Key</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Nhập Google API Key của bạn để sử dụng không giới hạn.
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 ml-1 underline"
                    >
                        Lấy Key miễn phí tại Google AI Studio
                    </a>
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                            Google API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Nhập API Key ở đây..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500/50 transition-colors"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isValidating}
                            className="flex-2 grow-[2] px-4 py-3 rounded-xl bg-amber-500 text-zinc-900 font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {isValidating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                                    Đang kiểm tra...
                                </>
                            ) : 'Lưu'}
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ApiKeyModal;
