export const formatPriceDh = (price: number | null | undefined): string => {
    if (price == null || Number.isNaN(price)) {
        return '-- DH';
    }

    const normalizedPrice = Number(price);
    const formattedPrice = Number.isInteger(normalizedPrice)
        ? normalizedPrice.toString()
        : normalizedPrice.toFixed(2);

    return `${formattedPrice} DH`;
};
