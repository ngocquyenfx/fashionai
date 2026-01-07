
import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import { generateFashionImage } from './services/geminiService';
import { AppState, AspectRatio, GeneratedImage } from './types';
import { DEFAULT_PROMPT, CONTEXT_PRESETS, EXCLUSIONS, ASPECT_RATIOS, UsageManager } from './constants';
import { HistoryManager } from './services/historyService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    characterImg: null,
    outfitImg: null,
    contextImg: null,
    prompt: DEFAULT_PROMPT,
    aspectRatio: "3:4",
    imageCount: 1,
    results: [],
    isGenerating: false,
    error: null,
  });

  const [fullScreenImg, setFullScreenImg] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasUserKey, setHasUserKey] = useState(!!UsageManager.getUserApiKey());
  const [showToast, setShowToast] = useState<{ message: string, type: 'warning' | 'error' } | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    UsageManager.checkAndResetDailyUsage();
    setHasUserKey(!!UsageManager.getUserApiKey());

    HistoryManager.getAllImages().then(setHistory);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_api_key') {
        setHasUserKey(!!UsageManager.getUserApiKey());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const triggerToast = (message: string, type: 'warning' | 'error' = 'warning') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 5000);
  };

  const handleGenerate = async () => {
    if (!state.characterImg || !state.outfitImg) {
      setState(prev => ({ ...prev, error: "Vui lòng tải lên ít nhất Ảnh Nhân Vật và Ảnh Trang Phục." }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Check usage if no user key
      if (!hasUserKey) {
        const count = UsageManager.getUsageCount();
        if (count >= 10) {
          throw new Error("Bạn đã hết lượt dùng miễn phí hôm nay. Hãy thêm API Key cá nhân để tiếp tục.");
        }
        if (UsageManager.isNearLimit()) {
          triggerToast(`Bạn còn ${10 - count} lượt miễn phí hôm nay.`, 'warning');
        }
      }

      // Build Final Prompt Logic
      const defaultPrefix = "Ảnh chụp thực tế. ";
      const weightedKeywords = "hyper-realistic, sharp focus. ";

      // In a real scenario, we'd use Gemini to "analyze" but for this builder, 
      // we combine visual references directly into the generation prompt.
      const characterAnalysis = "Nhân vật ở trung tâm, duy trì đặc điểm khuôn mặt, vóc dáng và thần thái như ảnh tham chiếu 1. ";
      const outfitAnalysis = "Trang phục chi tiết, màu sắc và chất liệu trung thực như ảnh tham chiếu 2. ";
      const contextAnalysis = state.contextImg ? "Bối cảnh và ánh sáng lấy cảm hứng từ ảnh tham chiếu 3. " : "";

      const finalPrompt = `${defaultPrefix}${weightedKeywords}${characterAnalysis}${outfitAnalysis}${contextAnalysis}${state.prompt}${EXCLUSIONS}`;

      const generatedUrls = await generateFashionImage({
        characterBase64: state.characterImg,
        outfitBase64: state.outfitImg,
        contextBase64: state.contextImg,
        finalPrompt,
        aspectRatio: state.aspectRatio,
        count: state.imageCount
      });

      const newResults: GeneratedImage[] = generatedUrls.map((url, idx) => ({
        id: `${Date.now()}-${idx}`,
        url,
        timestamp: Date.now()
      }));

      // Save to IndexedDB and update history state
      for (const img of newResults) {
        await HistoryManager.saveImage(img);
      }
      const updatedHistory = await HistoryManager.getAllImages();
      setHistory(updatedHistory);

      setState(prev => ({
        ...prev,
        results: [...newResults, ...prev.results].slice(0, 12),
        isGenerating: false,
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: err.message || "Đã xảy ra lỗi trong quá trình tạo ảnh."
      }));
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `fashion-ai-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white font-['Quicksand'] selection:bg-orange-500/30 overflow-hidden">
      <Header
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasUserKey={hasUserKey}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column (Settings) */}
        <aside className="w-full md:w-1/4 lg:w-[300px] xl:w-[350px] border-r border-zinc-800 p-6 overflow-y-auto h-screen no-scrollbar">
          <header className="mb-8 border-b border-zinc-800 pb-4 md:hidden">
            <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              FASHION
            </h1>
            <p className="text-zinc-500 text-xs font-semibold mt-1">AI BUILDER STUDIO</p>
          </header>

          <section className="space-y-2">
            <ImageUploader
              label="NHÂN VẬT"
              description="Ưu tiên nhân vật ở trung tâm, tốt nhất đã tách nền hoặc nền trắng/đen."
              image={state.characterImg}
              onUpload={(base64) => setState(prev => ({ ...prev, characterImg: base64 }))}
              onClear={() => setState(prev => ({ ...prev, characterImg: null }))}
            />

            <ImageUploader
              label="TRANG PHỤC"
              description="Ưu tiên ảnh trang phục rõ nét, tốt nhất đã tách nền hoặc nền đơn sắc."
              image={state.outfitImg}
              onUpload={(base64) => setState(prev => ({ ...prev, outfitImg: base64 }))}
              onClear={() => setState(prev => ({ ...prev, outfitImg: null }))}
            />

            <ImageUploader
              label="BỐI CẢNH"
              description="AI sẽ lấy cảm hứng về bối cảnh, ánh sáng từ ảnh này (không bắt buộc)."
              image={state.contextImg}
              onUpload={(base64) => setState(prev => ({ ...prev, contextImg: base64 }))}
              onClear={() => setState(prev => ({ ...prev, contextImg: null }))}
            />

            <div className="space-y-4 pt-2">
              <label className="block text-xs text-zinc-400 font-bold uppercase">Hoặc nhập mô tả bên dưới</label>
              <textarea
                value={state.prompt}
                onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none min-h-[100px] resize-none"
                placeholder="Nhập mô tả bối cảnh..."
              />

              <div className="relative">
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'hanoi') setState(prev => ({ ...prev, prompt: CONTEXT_PRESETS.hanoi.prompt }));
                    if (val === 'studio') setState(prev => ({ ...prev, prompt: CONTEXT_PRESETS.studio.prompt }));
                    e.target.value = ""; // Reset dropdown
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-orange-500 outline-none appearance-none"
                >
                  <option value="">- Chọn nhanh bối cảnh -</option>
                  <option value="hanoi">{CONTEXT_PRESETS.hanoi.label}</option>
                  <option value="studio">{CONTEXT_PRESETS.studio.label}</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800 mt-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-orange-500 uppercase mb-3">Tỷ lệ ảnh</label>
                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.label}
                      onClick={() => setState(prev => ({ ...prev, aspectRatio: ratio.value }))}
                      className={`py-2 text-sm font-bold rounded-lg border transition-all ${state.aspectRatio === ratio.value
                        ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                        }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-orange-500 uppercase">Số lượng ảnh</label>
                  <span className="text-sm font-bold text-zinc-400">{state.imageCount}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={state.imageCount}
                  onChange={(e) => setState(prev => ({ ...prev, imageCount: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={state.isGenerating}
                className={`w-full py-4 rounded-xl font-bold text-lg uppercase shadow-xl transition-all flex items-center justify-center gap-3 ${state.isGenerating
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white active:scale-[0.98]'
                  }`}
              >
                {state.isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ĐANG KHỞI TẠO...
                  </>
                ) : (
                  'TẠO ẢNH'
                )}
              </button>
              {state.error && <p className="text-red-500 text-xs mt-2 text-center font-medium">{state.error}</p>}
            </div>
          </section>
        </aside>

        {/* Right Column (Results) */}
        <main className="flex-1 p-8 overflow-y-auto h-screen no-scrollbar">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8 border-b border-zinc-900 pb-4">
              <div>
                <h2 className="text-2xl font-bold">Kết quả</h2>
                <p className="text-zinc-500 text-sm mt-1">
                  {state.results.length === 0 ? "Kết quả tạo ra sẽ hiển thị ở đây." : `Đã tạo ${state.results.length} ảnh sản phẩm.`}
                </p>
              </div>
              {state.results.length > 0 && (
                <button
                  onClick={() => setState(prev => ({ ...prev, results: [] }))}
                  className="text-zinc-500 hover:text-white text-xs font-bold uppercase"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {state.results.length === 0 && !state.isGenerating && (
              <div className="h-[60vh] flex flex-col items-center justify-center text-zinc-800 border-2 border-dashed border-zinc-900 rounded-3xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">Chưa có ảnh nào được tạo</p>
                <p className="text-sm">Vui lòng thiết lập cấu hình ở cột bên trái</p>
              </div>
            )}

            {state.isGenerating && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {Array.from({ length: state.imageCount }).map((_, i) => (
                  <div key={i} className="aspect-square bg-zinc-900 rounded-3xl animate-pulse flex items-center justify-center border border-zinc-800">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-zinc-800 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Đang xử lý...</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-20">
              {state.results.map((result) => (
                <div key={result.id} className="group relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl transition-transform hover:scale-[1.01]">
                  <img
                    src={result.url}
                    alt="Generated Fashion"
                    className="w-full h-full object-cover aspect-square"
                  />

                  {/* Actions Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadImage(result.url)}
                      className="p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white hover:bg-orange-600 transition-colors shadow-xl border border-white/10"
                      title="Download"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setFullScreenImg(result.url)}
                      className="p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white hover:bg-orange-600 transition-colors shadow-xl border border-white/10"
                      title="Full Screen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Fashion AI Studio • Photorealistic</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Section Lịch sử */}
            <section className="mt-12">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                LỊCH SỬ
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                {history.length === 0 ? (
                  <p className="text-zinc-600 text-sm italic">Chưa có lịch sử tạo ảnh.</p>
                ) : (
                  history.map((img) => (
                    <div key={img.id} className="flex-shrink-0 w-40 group relative">
                      <div
                        className="aspect-square rounded-xl overflow-hidden border border-zinc-800 cursor-pointer hover:border-orange-500 transition-all"
                        onClick={() => setState(prev => ({ ...prev, results: [img] }))}
                      >
                        <img src={img.url} className="w-full h-full object-cover" alt="History item" />
                      </div>
                      <button
                        onClick={() => { HistoryManager.deleteImage(img.id); setHistory(h => h.filter(x => x.id !== img.id)); }}
                        className="absolute -bottom-2 -right-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Section Lưu ý */}
            <section className="mt-12 p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 text-xs text-zinc-400">
                <p>• Bạn có thể tạo ảnh tối đa 10 lần <strong>MIỄN PHÍ/ ngày</strong>.</p>
                <p>• Khi hết lượt miễn phí có thể chờ sang ngày hôm sau. Hoặc sử dụng <strong>KEY MIỄN PHÍ</strong> của riêng bạn từ Google Gemini để sử dụng không giới hạn.</p>
                <p>• <strong>LIÊN HỆ</strong> với tôi nếu bạn cần hỗ trợ hoặc cần hướng dẫn tự tạo KEY MIỄN PHÍ.</p>
                <p>• <strong>Cam kết:</strong> App không lưu trữ thông tin của người dùng. Chỉ riêng bạn có quyền sử dụng sản phẩm và thông tin của chính mình.</p>
                <p>• Để đảm bảo lưu trữ mượt mà, app sẽ chỉ lưu trữ tối đa <strong>20 ảnh gần nhất</strong>.</p>
              </div>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20 whitespace-nowrap"
              >
                LIÊN HỆ
              </button>
            </section>
          </div>
        </main>
      </div>

      {/* Fullscreen Preview Modal */}
      {fullScreenImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-300"
          onClick={() => setFullScreenImg(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img src={fullScreenImg} alt="Preview" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" />
            <button
              className="absolute -top-12 right-0 text-white hover:text-orange-500 flex items-center gap-2 font-bold uppercase tracking-wider"
              onClick={() => setFullScreenImg(null)}
            >
              Đóng
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); downloadImage(fullScreenImg); }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 px-6 py-3 bg-orange-600 rounded-full text-white font-bold uppercase shadow-xl hover:bg-orange-700 active:scale-95 transition-all"
            >
              Tải ảnh về máy
            </button>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={() => setHasUserKey(!!UsageManager.getUserApiKey())}
      />

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsContactModalOpen(false)}>
          <div className="relative max-w-sm w-full bg-zinc-900 p-2 rounded-3xl border border-zinc-800 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <img src="/QRzalo.JPEG" className="w-full rounded-2xl" alt="Zalo QR" />
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 ${showToast.type === 'error'
          ? 'bg-red-500/20 border-red-500/50 text-red-200'
          : 'bg-amber-500/20 border-amber-500/50 text-amber-200'
          }`}>
          <div className="flex items-center gap-3">
            {showToast.type === 'error' ? (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
            <span className="font-bold text-sm tracking-wide">{showToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
