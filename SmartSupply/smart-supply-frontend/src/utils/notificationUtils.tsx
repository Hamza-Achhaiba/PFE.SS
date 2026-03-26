import { getOrderStatusLabel, getPaymentStatusLabel } from './orderStatus';

/**
 * Formats a notification message by:
 * 1. Translating common French phrases to English.
 * 2. Replacing raw enum strings with human-readable labels.
 */
export const formatNotificationMessage = (message: string): string => {
    if (!message) return '';

    let formatted = message;

    // 1. Translate common French patterns from CommandeService/ProduitService
    const translations: Record<string, string> = {
        'Mise à jour : Votre commande #': 'Update: Your order #',
        'Mise à jour: Votre commande #': 'Update: Your order #',
        'Mise à jour: Votre commande # ': 'Update: Your order # ',
        'est maintenant ': 'is now ',
        'a été validée.': 'has been validated.',
        'Mise à jour logistique : Votre commande ': 'Logistics Update: Your order ',
        'a un nouveau suivi:': 'has a new tracking reference:',
        'Nouvelle commande pour votre produit :': 'New order for your product:',
        'Nouvelle commande pour votre produit': 'New order for your product',
        'Quantité:': 'Quantity:',
        'ALERTE : Votre produit': 'ALERT: Your product',
        'a atteint son seuil critique. Il ne reste que': 'has reached its critical threshold. Only',
        'unité(s) !': 'unit(s) left!',
        'Votre commande n°': 'Your order #',
        'Mise Ã  jour : Votre commande #': 'Update: Your order #', // UTF-8 corruption handling
    };

    Object.entries(translations).forEach(([french, english]) => {
        formatted = formatted.replace(new RegExp(french, 'g'), english);
    });

    // 2. Identify and format raw enum strings (HELD_IN_ESCROW, EN_PREPARATION, etc.)
    // We look for words that are all caps and contain underscores or match known enums
    const words = formatted.split(' ');
    const processedWords = words.map(word => {
        // Clean word from punctuation for checking
        const cleanWord = word.replace(/[.,!?:;]/g, '');
        const punctuation = word.substring(cleanWord.length);

        // Check if it's a known status code
        // Order statuses
        const orderStatuses = ['EN_ATTENTE_VALIDATION', 'VALIDEE', 'EN_PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];
        if (orderStatuses.includes(cleanWord)) {
            return getOrderStatusLabel(cleanWord) + punctuation;
        }

        // Payment statuses
        const paymentStatuses = ['HELD_IN_ESCROW', 'PAYEE', 'EN_ATTENTE', 'REMBOURSEE', 'ECHOUEE', 'UNPAID', 'RELEASED', 'REFUNDED', 'DISPUTED'];
        if (paymentStatuses.includes(cleanWord)) {
             // getPaymentStatusLabel might not have ALL of these since some are custom or legacy
             // but it handles HELD_IN_ESCROW, RELEASED, etc.
             return getPaymentStatusLabel(cleanWord) + punctuation;
        }

        // Generic fallback for any other ALL_CAPS_ENUM
        if (/^[A-Z][A-Z0-0_]+[A-Z0-9]$/.test(cleanWord) && cleanWord.includes('_')) {
            const humanLabel = cleanWord
                .split('_')
                .map(part => part.charAt(0).toUpperCase() + part.slice(part.length > 1 ? 1 : 0).toLowerCase())
                .join(' ');
            return humanLabel + punctuation;
        }

        return word;
    });

    return processedWords.join(' ');
};

/**
 * Extracts an order ID from a notification message using regex.
 * Format expected: "order #123" or similar.
 */
export const getOrderIdFromMessage = (message: string): number | null => {
    if (!message) return null;
    // Look for # followed by numbers, allowing for optional space: #123 or # 123
    const match = message.match(/#\s*(\d+)/);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return null;
};

/**
 * Extracts an order reference from a notification message using regex.
 * Format expected: "CMD-XXXXXXX"
 */
export const getOrderRefFromMessage = (message: string): string | null => {
    if (!message) return null;
    const match = message.match(/CMD-[A-Z0-9]{8}/);
    return match ? match[0] : null;
};
