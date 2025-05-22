// src/services/comparisons.ts
import { supabase } from './supabase';
import { 
  QuoteComparison, 
  ProductQuoteComparison,
  SupplierProductQuote,
  QuoteItem
} from '../types/quote';

/**
 * Get all quote comparisons
 */
export async function getQuoteComparisons(): Promise<QuoteComparison[]> {
  try {
    // First, get all requests with quotes
    const quotesSubquery = await supabase
      .from('quotes')
      .select('request_id');
    
    if (quotesSubquery.error) throw quotesSubquery.error;
    
    const requestIds = quotesSubquery.data?.map(q => q.request_id) || [];
    
    const { data: requestsWithQuotes, error: requestsError } = await supabase
      .from('requests')
      .select(`
        id,
        title,
        created_by,
        created_at,
        needed_by,
        priority,
        status,
        notes,
        total_amount
      `)
      .in('id', requestIds);
    
    if (requestsError) throw requestsError;
    
    if (!requestsWithQuotes || requestsWithQuotes.length === 0) {
      return [];
    }
    
    // Get quotes for each request
    const comparisons: QuoteComparison[] = [];
    
    for (const request of requestsWithQuotes) {
      // Get quotes for this request
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          items:quote_items(*)
        `)
        .eq('request_id', request.id);
      
      if (quotesError) throw quotesError;
      
      if (quotes && quotes.length > 0) {
        // Create a comparison for this request
        comparisons.push({
          id: `comp_${request.id}`,
          request_id: request.id,
          request: request,
          supplier_quotes: quotes,
          created_at: new Date().toISOString(),
          status: 'open'
        });
      }
    }
    
    return comparisons;
  } catch (error) {
    console.error('Error fetching quote comparisons:', error);
    return [];
  }
}

/**
 * Create a quote comparison from a request
 */
export async function createQuoteComparisonFromRequest(requestId: string): Promise<QuoteComparison | null> {
  try {
    // First, get the request details
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (requestError) throw requestError;
    if (!request) throw new Error(`Request with ID ${requestId} not found`);
    
    // Get all quotes for this request
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .eq('request_id', requestId);
    
    if (quotesError) throw quotesError;
    
    // If no quotes found, return null
    if (!quotes || quotes.length === 0) {
      console.warn(`No quotes found for request ${requestId}`);
      return null;
    }
    
    // Create a comparison object
    const comparison: QuoteComparison = {
      id: `comp_${requestId}`,
      request_id: requestId,
      request: request,
      supplier_quotes: quotes,
      created_at: new Date().toISOString(),
      status: 'open'
    };
    
    return comparison;
  } catch (error) {
    console.error(`Error creating quote comparison for request ${requestId}:`, error);
    return null;
  }
}

/**
 * Get product-centered quote comparison
 */
export async function getProductQuoteComparison(requestIds: string[] = []): Promise<ProductQuoteComparison[]> {
  try {
    // If no specific requestIds provided, get all
    let requestsToUse = requestIds;
    
    if (requestIds.length === 0) {
      // Get all request IDs that have quotes
      const quotesQuery = await supabase
        .from('quotes')
        .select('request_id');
      
      if (quotesQuery.error) throw quotesQuery.error;
      
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select('id')
        .in('id', quotesQuery.data?.map(q => q.request_id) || []);
      
      if (requestsError) throw requestsError;
      
      requestsToUse = requestsData?.map(r => r.id) || [];
    }
    
    if (requestsToUse.length === 0) return [];
    
    // Get quotes for these requests
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items(*)
      `)
      .in('request_id', requestsToUse);
    
    if (quotesError) throw quotesError;
    
    if (!quotes || quotes.length === 0) return [];
    
    // Get request items for these requests
    const { data: requestItems, error: itemsError } = await supabase
      .from('request_items')
      .select(`
        *,
        request:request_id(id, title)
      `)
      .in('request_id', requestsToUse);
    
    if (itemsError) throw itemsError;
    
    if (!requestItems || requestItems.length === 0) return [];
    
    // Get products info
    const productIds = [...new Set(requestItems.map(item => item.product_id))];
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);
    
    if (productsError) throw productsError;
    
    if (!products || products.length === 0) return [];
    
    // Get supplier products for these products
    const { data: supplierProducts, error: spError } = await supabase
      .from('supplier_products')
      .select(`
        *,
        supplier:supplier_id(id, name)
      `)
      .in('product_id', productIds);
    
    if (spError) throw spError;
    
    // Build the product-centered view
    const productMap = new Map<string, ProductQuoteComparison>();
    
    // First, initialize product entries
    requestItems.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) return;
      
      if (!productMap.has(item.product_id)) {
        productMap.set(item.product_id, {
          productId: item.product_id,
          productName: item.product_name,
          category: product.category,
          unit: item.unit,
          sku: product.sku,
          requestIds: [item.request_id],
          quantity: item.quantity,
          supplierQuotes: [],
          selectedSupplierId: undefined
        });
      } else {
        // Update existing product
        const productEntry = productMap.get(item.product_id)!;
        if (!productEntry.requestIds.includes(item.request_id)) {
          productEntry.requestIds.push(item.request_id);
        }
        // Use the max quantity if it appears in multiple requests
        if (item.quantity > productEntry.quantity) {
          productEntry.quantity = item.quantity;
        }
      }
    });
    
    // Then, add supplier quotes
    quotes.forEach(quote => {
      quote.items.forEach((quoteItem: QuoteItem) => {
        const productEntry = productMap.get(quoteItem.product_id);
        if (!productEntry) return;
        
        // Find supplier product details
        const supplierProduct = supplierProducts?.find(sp => 
          sp.supplier_id === quote.supplier_id && 
          sp.product_id === quoteItem.product_id
        );
        
        // Create supplier quote
        const supplierQuote: SupplierProductQuote = {
          supplierId: quote.supplier_id,
          supplierName: quote.supplier_name,
          price: quoteItem.price_per_unit,
          inStock: quoteItem.in_stock,
          supplierProductCode: quoteItem.supplier_product_code || supplierProduct?.supplier_product_code,
          minimumOrderQuantity: supplierProduct?.minimum_order_quantity
        };
        
        // Check if we already have this supplier
        const existingSupplierIndex = productEntry.supplierQuotes.findIndex(
          sq => sq.supplierId === quote.supplier_id
        );
        
        if (existingSupplierIndex >= 0) {
          // Use the better price if this supplier already quoted
          if (quoteItem.price_per_unit < productEntry.supplierQuotes[existingSupplierIndex].price) {
            productEntry.supplierQuotes[existingSupplierIndex].price = quoteItem.price_per_unit;
          }
        } else {
          // Add new supplier quote
          productEntry.supplierQuotes.push(supplierQuote);
        }
      });
    });
    
    // Sort supplier quotes by price for each product
    for (const product of productMap.values()) {
      product.supplierQuotes.sort((a, b) => a.price - b.price);
    }
    
    return Array.from(productMap.values());
  } catch (error) {
    console.error('Error getting product quote comparison:', error);
    return [];
  }
}

/**
 * Get best quotes for each product in a list
 */
export async function getBestQuotesForProducts(productIds: string[]): Promise<{
  productId: string;
  bestQuote: SupplierProductQuote | null;
  allQuotes: SupplierProductQuote[];
}[]> {
  try {
    const results = [];
    
    for (const productId of productIds) {
      const comparison = await getProductQuoteComparison([]);
      const productComparison = comparison.find(p => p.productId === productId);
      
      if (productComparison) {
        const bestQuote = productComparison.supplierQuotes[0] || null;
        results.push({
          productId,
          bestQuote,
          allQuotes: productComparison.supplierQuotes
        });
      } else {
        results.push({
          productId,
          bestQuote: null,
          allQuotes: []
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error getting best quotes for products:', error);
    return [];
  }
}