
import React, { useRef } from 'react';
import imageCompression from 'browser-image-compression';

interface ImageUploaderProps {
  label: string;
  description: string;
  image: string | null;
  onUpload: (base64: string) => void;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, description, image, onUpload, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndUpload = async (file: File) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Compression error:", error);
      // Fallback to original file
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      compressAndUpload(file);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-2">{label}</h3>
      <p className="text-xs text-zinc-400 mb-3 italic leading-tight">{description}</p>
      <div
        className="relative aspect-square w-full rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:border-orange-500 transition-colors cursor-pointer group flex flex-center items-center justify-center overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !image && fileInputRef.current?.click()}
      >
        {image ? (
          <>
            <img src={image} alt={label} className="w-full h-full object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full text-white hover:bg-red-700 shadow-lg"
              title="Xóa ảnh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <div className="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-zinc-600 mb-2 group-hover:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-zinc-500 uppercase font-semibold">Tải lên / Kéo thả</p>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
