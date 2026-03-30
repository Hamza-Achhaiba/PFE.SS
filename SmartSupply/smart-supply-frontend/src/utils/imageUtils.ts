const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8088';

/**
 * Resolves any image path or URL to a fully-qualified URL pointing at the current backend.
 *
 * Handles three input forms:
 *  1. Relative path   ("/uploads/produits/foo.jpg")  → prepends BACKEND_URL
 *  2. localhost URL   ("http://localhost:8087/…")     → re-builds with BACKEND_URL
 *     (covers stale URLs stored before a port change)
 *  3. External URL    ("https://cdn.example.com/…")   → returned unchanged
 *  4. Empty / null                                     → returns ""
 */
export function resolveImage(url: string | null | undefined): string {
    if (!url) return '';

    if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
        try {
            const { pathname } = new URL(url);
            return `${BACKEND_URL}${pathname}`;
        } catch {
            return '';
        }
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
        // External URL – pass through unchanged
        return url;
    }

    // Relative path
    return `${BACKEND_URL}${url}`;
}
