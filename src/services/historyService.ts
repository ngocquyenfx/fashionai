import { GeneratedImage } from '../types';

const DB_NAME = 'FashionAIHistory';
const STORE_NAME = 'images';
const MAX_HISTORY = 20;

export const HistoryManager = {
    openDB: (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    saveImage: async (image: GeneratedImage) => {
        const db = await HistoryManager.openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Kiểm tra số lượng và xóa ảnh cũ nhất nếu > 20
        const allKeys = await new Promise<IDBValidKey[]>((res) => {
            const req = store.getAllKeys();
            req.onsuccess = () => res(req.result);
        });

        if (allKeys.length >= MAX_HISTORY) {
            store.delete(allKeys[0]);
        }

        store.put(image);
    },

    getAllImages: async (): Promise<GeneratedImage[]> => {
        const db = await HistoryManager.openDB();
        return new Promise((resolve) => {
            const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result.sort((a, b) => b.timestamp - a.timestamp));
        });
    },

    deleteImage: async (id: string) => {
        const db = await HistoryManager.openDB();
        db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
    }
};
