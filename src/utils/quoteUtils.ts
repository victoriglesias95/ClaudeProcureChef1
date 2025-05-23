import { SupplierQuote } from '../types/quote';

export const isQuoteValid = (quote: SupplierQuote): boolean => {
  if (!quote.expiry_date) return false;
  return new Date(quote.expiry_date) > new Date();
};

export const getDaysUntilExpiry = (quote: SupplierQuote): number => {
  if (!quote.expiry_date) return 0;
  const now = new Date();
  const expiry = new Date(quote.expiry_date);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getQuoteValidityStatus = (quote: SupplierQuote) => {
  const daysLeft = getDaysUntilExpiry(quote);
  
  if (daysLeft < 0) {
    return {
      status: 'expired',
      text: `Expired ${Math.abs(daysLeft)} days ago`,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    };
  } else if (daysLeft === 0) {
    return {
      status: 'expiring',
      text: 'Expires today',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    };
  } else if (daysLeft <= 7) {
    return {
      status: 'expiring-soon',
      text: `Expires in ${daysLeft} days`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    };
  } else {
    return {
      status: 'valid',
      text: `Valid for ${daysLeft} days`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    };
  }
};

export const findBestValidQuote = (
  productId: string, 
  quotes: SupplierQuote[]
): SupplierQuote | null => {
  const validQuotes = quotes
    .filter(quote => isQuoteValid(quote))
    .filter(quote => quote.items.some(item => item.product_id === productId));
  
  if (validQuotes.length === 0) return null;
  
  // Sort by price for this specific product
  return validQuotes.sort((a, b) => {
    const itemA = a.items.find(item => item.product_id === productId);
    const itemB = b.items.find(item => item.product_id === productId);
    
    if (!itemA || !itemB) return 0;
    
    return itemA.price_per_unit - itemB.price_per_unit;
  })[0];
};

export const getQuoteItemsStatus = (quote: SupplierQuote) => {
  const totalItems = quote.items.length;
  const availableItems = quote.items.filter(item => item.in_stock).length;
  
  return {
    total: totalItems,
    available: availableItems,
    unavailable: totalItems - availableItems,
    allAvailable: totalItems === availableItems
  };
};