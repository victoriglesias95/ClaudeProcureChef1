// src/services/quotes.ts (Refactored - Focus only on quote operations)
import { supabase } from './supabase';
import { SupplierQuote, QuoteStatus, QuoteItem } from '../types/quote';

/**
 * Get all quotes
 */
export async function getQuotes(): Promise<SupplierQuote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
}

/**
 * Get a quote by ID
 */
export async function getQuoteById(id: string): Promise<SupplierQuote | null> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching quote ${id}:`, error);
    return null;
  }
}

/**
 * Get quotes for a specific request
 */
export async function getQuotesForRequest(requestId: string): Promise<SupplierQuote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching quotes for request ${requestId}:`, error);
    return [];
  }
}

/**
 * Get quotes from a specific supplier
 */
export async function getQuotesFromSupplier(supplierId: string): Promise<SupplierQuote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching quotes from supplier ${supplierId}:`, error);
    return [];
  }
}

/**
 * Create a new quote
 */
export async function createQuote(quote: Omit<SupplierQuote, 'id' | 'created_at'>): Promise<SupplierQuote | null> {
  try {
    const { items, ...quoteData } = quote;
    
    // Insert quote
    const { data: newQuote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        ...quoteData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (quoteError) throw quoteError;
    
    // Insert quote items
    if (items && items.length > 0) {
      const quoteItems = items.map(item => ({
        ...item,
        quote_id: newQuote.id
      }));
      
      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);
      
      if (itemsError) throw itemsError;
    }
    
    // Return complete quote with items
    return await getQuoteById(newQuote.id);
  } catch (error) {
    console.error('Error creating quote:', error);
    return null;
  }
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating quote status for ${id}:`, error);
    return false;
  }
}

/**
 * Accept a quote
 */
export async function acceptQuote(id: string): Promise<boolean> {
  return await updateQuoteStatus(id, 'approved');
}

/**
 * Reject a quote
 */
export async function rejectQuote(id: string): Promise<boolean> {
  return await updateQuoteStatus(id, 'rejected');
}

/**
 * Get valid quotes for a product
 */
export async function getValidQuotesForProduct(productId: string): Promise<SupplierQuote[]> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items!inner(*)
      `)
      .eq('quote_items.product_id', productId)
      .eq('status', 'received')
      .or(`expiry_date.is.null,expiry_date.gt.${now}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching valid quotes for product ${productId}:`, error);
    return [];
  }
}

/**
 * Get expired quotes
 */
export async function getExpiredQuotes(): Promise<SupplierQuote[]> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .not('expiry_date', 'is', null)
      .lt('expiry_date', now)
      .neq('status', 'expired');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching expired quotes:', error);
    return [];
  }
}

/**
 * Auto-expire quotes that are past their expiry date
 */
export async function autoExpireQuotes(): Promise<number> {
  try {
    const expiredQuotes = await getExpiredQuotes();
    
    if (expiredQuotes.length === 0) return 0;
    
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'expired' })
      .in('id', expiredQuotes.map(quote => quote.id));
    
    if (error) throw error;
    
    return expiredQuotes.length;
  } catch (error) {
    console.error('Error auto-expiring quotes:', error);
    return 0;
  }
}

/**
 * Get quote statistics
 */
export async function getQuoteStatistics(): Promise<{
  total: number;
  pending: number;
  received: number;
  approved: number;
  rejected: number;
  expired: number;
}> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('status');
    
    if (error) throw error;
    
    const stats = {
      total: data?.length || 0,
      pending: 0,
      received: 0,
      approved: 0,
      rejected: 0,
      expired: 0
    };
    
    data?.forEach(quote => {
      if (quote.status in stats) {
        stats[quote.status as keyof typeof stats]++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching quote statistics:', error);
    return {
      total: 0,
      pending: 0,
      received: 0,
      approved: 0,
      rejected: 0,
      expired: 0
    };
  }
}
