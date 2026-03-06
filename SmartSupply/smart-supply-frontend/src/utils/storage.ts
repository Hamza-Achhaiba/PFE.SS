export const getStorageItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
};

export const setStorageItem = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error('Error saving to localStorage', e);
    }
};

export const removeStorageItem = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error('Error removing from localStorage', e);
    }
};
