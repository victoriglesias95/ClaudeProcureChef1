import { supabase } from './supabase';
import { 
  QuoteComparison, 
  SupplierQuote,
  ProductQuoteComparison,
  SupplierProductQuote,
  Order,
  QuoteStatus,
  Supplier,
  QuoteRequest,
  QuoteRequestStatus,
  QuoteItem
} from '../types/quote';

/**
 * Get all suppliers
 */
export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

/**
 * Get a supplier by ID
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching supplier ${id}:`, error);
    return null;
  }
}

/**
 * Get all quote requests
 */
export async function getQuoteRequests(): Promise<QuoteRequest[]> {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .order('sent_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching quote requests:', error);
    return [];
  }
}

/**
 * Get all quote comparisons
 */
export async function getQuoteComparisons(): Promise<QuoteComparison[]> {
  try {
    // First, get all requests with quotes
    // Separate the subquery to resolve the PostgrestFilterBuilder error
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
 * Create quote requests for selected suppliers
 */
export async function createQuoteRequestsForSuppliers(
  requestId: string, 
  supplierIds: string[]
): Promise<QuoteRequest[]> {
  try {
    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (requestError) throw requestError;
    
    if (!request) {
      throw new Error(`Request with ID ${requestId} not found`);
    }
    
    // Create quote requests for each supplier
    const quoteRequests: Omit<QuoteRequest, 'id'>[] = [];
    
    for (const supplierId of supplierIds) {
      // Get supplier details
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', supplierId)
        .single();
      
      if (supplierError) throw supplierError;
      
      if (!supplier) continue;
      
      // Calculate response deadline (7 days from now)
      const now = new Date();
      const deadline = new Date(now);
      deadline.setDate(now.getDate() + 7);
      
      quoteRequests.push({
        request_id: requestId,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        sent_at: now.toISOString(),
        status: 'pending',
        response_deadline: deadline.toISOString()
      });
    }
    
    // Insert quote requests
    if (quoteRequests.length > 0) {
      const { data, error } = await supabase
        .from('quote_requests')
        .insert(quoteRequests)
        .select();
      
      if (error) throw error;
      
      return data || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error creating quote requests:', error);
    throw error;
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
 * Accept a quote
 */
export async function acceptQuote(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'approved' })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error accepting quote ${id}:`, error);
    return false;
  }
}

/**
 * Reject a quote
 */
export async function rejectQuote(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'rejected' })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error rejecting quote ${id}:`, error);
    return false;
  }
}

/**
 * Send a reminder for a quote request
 */
export async function sendQuoteRequestReminder(requestId: string): Promise<boolean> {
  try {
    // In a real app, this would also send an email or notification
    const { error } = await supabase
      .from('quote_requests')
      .update({
        sent_at: new Date().toISOString() // Update the sent time
      })
      .eq('id', requestId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error sending reminder for quote request ${requestId}:`, error);
    return false;
  }
}

/**
 * Cancel a quote request
 */
export async function cancelQuoteRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quote_requests')
      .update({
        status: 'expired'
      })
      .eq('id', requestId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error cancelling quote request ${requestId}:`, error);
    return false;
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
      // Separate the subquery to resolve the PostgrestFilterBuilder error
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
      // Add type annotation to quoteItem parameter
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
 * Create orders from product selections
 */
export async function createOrdersFromProductSelections(
  selections: {productId: string, supplierId: string, quantity: number}[]
): Promise<{id: string, supplierId: string, supplierName: string, orderNumber: string}[]> {
  try {
    // Group selections by supplier
    const supplierSelections = new Map<string, {productId: string, quantity: number}[]>();
    
    selections.forEach(selection => {
      if (!supplierSelections.has(selection.supplierId)) {
        supplierSelections.set(selection.supplierId, []);
      }
      
      supplierSelections.get(selection.supplierId)!.push({
        productId: selection.productId,
        quantity: selection.quantity
      });
    });
    
    // Create an order for each supplier
    const orders: {id: string, supplierId: string, supplierName: string, orderNumber: string}[] = [];
    
    for (const [supplierId, productSelections] of supplierSelections.entries()) {
      // Get supplier details
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', supplierId)
        .single();
      
      if (supplierError) throw supplierError;
      if (!supplier) continue;
      
      // Generate order number
      const orderNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Prepare order
      const orderData = {
        number: orderNumber,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        status: 'draft',
        total: 0 // Will be updated after items
      };
      
      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Process order items
      const orderItems = [];
      let orderTotal = 0;
      
      for (const selection of productSelections) {
        // Get product details and supplier price
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('name, default_unit, sku')
          .eq('id', selection.productId)
          .single();
        
        if (productError) throw productError;
        if (!product) continue;
        
        // Get supplier_product details
        const { data: supplierProduct, error: spError } = await supabase
          .from('supplier_products')
          .select('price, supplier_product_code')
          .eq('supplier_id', supplierId)
          .eq('product_id', selection.productId)
          .single();
        
        if (spError) {
          console.warn(`No supplier product found for ${selection.productId} from ${supplierId}`);
          continue;
        }
        
        const price = supplierProduct?.price || 0;
        const total = price * selection.quantity;
        
        orderItems.push({
          order_id: order.id,
          product_id: selection.productId,
          product_name: product.name,
          quantity: selection.quantity,
          unit: product.default_unit,
          price: price,
          total: total,
          sku: product.sku,
          supplier_product_code: supplierProduct?.supplier_product_code
        });
        
        orderTotal += total;
      }
      
      // Insert order items
      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) throw itemsError;
      }
      
      // Update order total
      const { error: updateError } = await supabase
        .from('orders')
        .update({ total: orderTotal })
        .eq('id', order.id);
      
      if (updateError) throw updateError;
      
      orders.push({
        id: order.id,
        supplierId,
        supplierName: supplier.name,
        orderNumber
      });
    }
    
    return orders;
  } catch (error) {
    console.error('Error creating orders from selections:', error);
    throw error;
  }
}

/**
 * Get all orders
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Get an order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }
}

/**
 * Update order status and register receipt
 */
export async function receiveOrder(
  orderId: string, 
  receivedItems: Record<string, number>,
  notes: Record<string, string> = {}
): Promise<boolean> {
  try {
    // 1. Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId);
    
    if (orderError) throw orderError;
    
    // 2. Update inventory quantities
    for (const [itemId, quantity] of Object.entries(receivedItems)) {
      // Get order item details
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('id', itemId)
        .single();
      
      if (itemError) throw itemError;
      
      // Get current inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('current_stock')
        .eq('product_id', orderItem.product_id)
        .single();
      
      if (inventoryError) throw inventoryError;
      
      // Calculate new stock level
      const newStock = (inventory?.current_stock || 0) + quantity;
      const stockLevel = newStock <= 5 ? 'low' : newStock <= 20 ? 'medium' : 'high';
      
      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          current_stock: newStock,
          stock_level: stockLevel,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', orderItem.product_id);
      
      if (updateError) throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Error receiving order:', error);
    return false;
  }
}