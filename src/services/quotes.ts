// src/services/quotes.ts
import { supabase } from './supabase';
import { 
  QuoteComparison, 
  SupplierQuote,
  ProductQuoteComparison,
  SupplierProductQuote,
  Order,
  QuoteStatus,
  QuoteItem,
  Supplier,
  QuoteRequest,
  QuoteRequestStatus
} from '../types/quote';
import { Request, RequestItem } from '../types/request';
import { 
  mockSuppliers, 
  mockSupplierProducts, 
  mockProcurementRequests, 
  generateMockQuotes 
} from '../mocks/procurement-data';

// Environment configuration
const USE_MOCK_DATA = true;

// Mock data storage - will be removed when moving to real database
const mockQuoteComparisons: QuoteComparison[] = [];
const mockOrders: Order[] = [];
const mockQuoteRequests: QuoteRequest[] = [];

// Helper functions
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Initialize mock data if needed
const initializeMockData = () => {
  if (mockQuoteComparisons.length === 0) {
    mockProcurementRequests.forEach(request => {
      mockQuoteComparisons.push({
        id: `comp_${request.id}`,
        request_id: request.id,
        request: request,
        supplier_quotes: generateMockQuotes(request.id).map(quote => ({
          ...quote,
          status: quote.status as QuoteStatus  // Type assertion to fix the status type issue
        })),
        created_at: new Date().toISOString(),
        status: 'open' as const  // Add type assertion
      });
    });
  }
};

if (USE_MOCK_DATA) {
  initializeMockData();
}

// DATA ACCESS LAYER - These functions handle the actual data operations
// When migrating to a real database, you would only need to replace these functions

/**
 * Data access layer for suppliers
 */
const suppliersDataAccess = {
  getAll: async () => {
    if (USE_MOCK_DATA) {
      return [...mockSuppliers];
    }
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockSuppliers.find(s => s.id === id) || null;
    }
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
};

/**
 * Data access layer for products
 */
const productsDataAccess = {
  getAll: async () => {
    if (USE_MOCK_DATA) {
      return mockSupplierProducts;
    }
    
    // Replace with Supabase query when ready
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('product_name');
      
    if (error) throw error;
    return data || [];
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockSupplierProducts.find(p => p.product_id === id) || null;
    }
    
    // Replace with Supabase query when ready
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
};

/**
 * Data access layer for quotes
 */
const quotesDataAccess = {
  getComparisons: async () => {
    if (USE_MOCK_DATA) {
      return [...mockQuoteComparisons];
    }
    
    // Replace with Supabase query when ready
    const { data, error } = await supabase
      .from('quote_comparisons')
      .select('*');
      
    if (error) throw error;
    return data || [];
  },
  
  getComparisonById: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockQuoteComparisons.find(c => c.id === id) || null;
    }
    
    // Replace with Supabase query when ready
    const { data, error } = await supabase
      .from('quote_comparisons')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  createComparison: async (comparison: Omit<QuoteComparison, 'id'>) => {
    if (USE_MOCK_DATA) {
      const newComparison = {
        ...comparison,
        id: `comp_${generateId()}`
      };
      mockQuoteComparisons.push(newComparison);
      return newComparison;
    }
    
    // Replace with Supabase query when ready
    const { data, error } = await supabase
      .from('quote_comparisons')
      .insert({ ...comparison })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  getQuoteById: async (id: string) => {
    if (USE_MOCK_DATA) {
      // Search through all comparisons for the specific quote
      for (const comparison of mockQuoteComparisons) {
        const quote = comparison.supplier_quotes.find(q => q.id === id);
        if (quote) return quote;
      }
      return null;
    }

    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
};

/**
 * Data access layer for quote requests
 */
const quoteRequestsDataAccess = {
  getAll: async () => {
    if (USE_MOCK_DATA) {
      return [...mockQuoteRequests];
    }
    
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .order('sent_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockQuoteRequests.find(req => req.id === id) || null;
    }
    
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  createRequests: async (requests: Omit<QuoteRequest, 'id'>[]) => {
    if (USE_MOCK_DATA) {
      const newRequests = requests.map(req => ({
        ...req,
        id: `req_${generateId()}`
      }));
      
      mockQuoteRequests.push(...newRequests);
      return newRequests;
    }
    
    const { data, error } = await supabase
      .from('quote_requests')
      .insert(requests)
      .select();
      
    if (error) throw error;
    return data || [];
  },
  
  updateRequest: async (id: string, updates: Partial<QuoteRequest>) => {
    if (USE_MOCK_DATA) {
      const request = mockQuoteRequests.find(req => req.id === id);
      if (!request) return null;
      
      Object.assign(request, updates);
      return request;
    }
    
    const { data, error } = await supabase
      .from('quote_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

/**
 * Data access layer for orders
 */
const ordersDataAccess = {
  getAll: async () => {
    if (USE_MOCK_DATA) {
      return [...mockOrders];
    }
    
    // Replace with Supabase query when ready
    const { data, error } = await supabase
      .from('orders')
      .select('*');
      
    if (error) throw error;
    return data || [];
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockOrders.find(o => o.id === id) || null;
    }
    
    // Replace with Supabase query when ready
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  createOrder: async (order: Omit<Order, 'id' | 'number'>) => {
    if (USE_MOCK_DATA) {
      const orderId = `order_${generateId()}`;
      const orderNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newOrder = {
        ...order,
        id: orderId,
        number: orderNumber
      };
      
      mockOrders.push(newOrder);
      return newOrder;
    }
    
    // Replace with Supabase query when ready
    const { data, error } = await supabase
      .from('orders')
      .insert({ ...order })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

/**
 * Data access layer for requests
 */
const requestsDataAccess = {
  getAll: async () => {
    if (USE_MOCK_DATA) {
      return [...mockProcurementRequests];
    }
    
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },
  
  getById: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockProcurementRequests.find(r => r.id === id) || null;
    }
    
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
};

// SERVICE LAYER - These functions implement business logic
// When migrating to a real database, these should mostly stay the same

/**
 * Get all suppliers
 */
export async function getSuppliers() {
  try {
    return await suppliersDataAccess.getAll();
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

/**
 * Get a supplier by ID
 */
export async function getSupplierById(id: string) {
  try {
    return await suppliersDataAccess.getById(id);
  } catch (error) {
    console.error(`Error fetching supplier ${id}:`, error);
    return null;
  }
}

/**
 * Get all products with supplier information
 */
export async function getProducts() {
  try {
    return await productsDataAccess.getAll();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get all quote comparisons
 */
export async function getQuoteComparisons(): Promise<QuoteComparison[]> {
  try {
    return await quotesDataAccess.getComparisons();
  } catch (error) {
    console.error('Error fetching quote comparisons:', error);
    return [];
  }
}

/**
 * Get a quote comparison by ID
 */
export async function getQuoteComparisonById(id: string): Promise<QuoteComparison | null> {
  try {
    return await quotesDataAccess.getComparisonById(id);
  } catch (error) {
    console.error(`Error fetching quote comparison ${id}:`, error);
    return null;
  }
}

/**
 * Get all requests
 */
export async function getRequests(): Promise<Request[]> {
  try {
    return await requestsDataAccess.getAll();
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
}

/**
 * Get a request by ID
 */
export async function getRequestById(id: string): Promise<Request | null> {
  try {
    return await requestsDataAccess.getById(id);
  } catch (error) {
    console.error(`Error fetching request ${id}:`, error);
    return null;
  }
}

/**
 * Get all quote requests
 */
export async function getQuoteRequests(): Promise<QuoteRequest[]> {
  try {
    return await quoteRequestsDataAccess.getAll();
  } catch (error) {
    console.error('Error fetching quote requests:', error);
    return [];
  }
}

/**
 * Create a quote comparison from a request
 */
export async function createQuoteComparisonFromRequest(requestId: string): Promise<QuoteComparison> {
  try {
    const request = await requestsDataAccess.getById(requestId);
    
    if (!request) {
      throw new Error(`Request with ID ${requestId} not found`);
    }
    
    // Check if comparison already exists
    const comparisons = await quotesDataAccess.getComparisons();
    const existing = comparisons.find(c => c.request_id === requestId);
    if (existing) return existing;
    
    // Create a new comparison
    let supplierQuotes: SupplierQuote[];
    
    if (USE_MOCK_DATA) {
      // Use the helper function from mock data
      supplierQuotes = generateMockQuotes(requestId).map(quote => ({
        ...quote,
        status: quote.status as QuoteStatus  // Type assertion
      }));
    } else {
      // In a real implementation, we would generate quotes here
      // This would involve looking up suppliers, product pricing, etc.
      supplierQuotes = [];
    }
    
    return await quotesDataAccess.createComparison({
      request_id: requestId,
      request: request,
      supplier_quotes: supplierQuotes,
      created_at: new Date().toISOString(),
      status: 'open' as const
    });
  } catch (error) {
    console.error(`Error creating quote comparison for request ${requestId}:`, error);
    throw error;
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
    const request = await requestsDataAccess.getById(requestId);
    
    if (!request) {
      throw new Error(`Request with ID ${requestId} not found`);
    }
    
    // Create new quote requests
    const newRequests: QuoteRequest[] = [];
    
    for (const supplierId of supplierIds) {
      const supplier = mockSuppliers.find(s => s.id === supplierId);
      if (!supplier) continue;
      
      // Calculate response deadline (7 days from now)
      const now = new Date();
      const deadline = new Date(now);
      deadline.setDate(now.getDate() + 7);
      
      newRequests.push({
        id: `qreq_${Date.now()}_${supplierId}`,
        request_id: requestId,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        sent_at: now.toISOString(),
        status: 'pending' as QuoteRequestStatus,
        response_deadline: deadline.toISOString()
      });
    }
    
    // Store the requests
    const createdRequests = await quoteRequestsDataAccess.createRequests(
      newRequests.map(({ id, ...rest }) => rest) // Remove IDs to let data layer handle them
    );
    
    if (USE_MOCK_DATA) {
      // Simulate quote responses for testing
      createdRequests.forEach(request => {
        // Random delay between 3-10 seconds
        setTimeout(() => {
          simulateQuoteResponse(request);
        }, Math.random() * 7000 + 3000);
      });
    }
    
    return createdRequests;
  } catch (error) {
    console.error('Error creating quote requests:', error);
    throw error;
  }
}

/**
 * Simulate a quote response (for testing only)
 */
function simulateQuoteResponse(quoteRequest: QuoteRequest) {
  // Find the request
  const request = mockProcurementRequests.find(r => r.id === quoteRequest.request_id);
  if (!request) return;
  
  // Find the supplier
  const supplier = mockSuppliers.find(s => s.id === quoteRequest.supplier_id);
  if (!supplier) return;
  
  // Generate a mock quote
  const quote = generateMockQuoteForSupplier(request, supplier);
  if (!quote) return;
  
  // Update the quote request status
  quoteRequestsDataAccess.updateRequest(quoteRequest.id, {
    status: 'received',
    quote_id: quote.id
  });
  
  // Add the quote to a comparison
  let comparison = mockQuoteComparisons.find(c => c.request_id === request.id);
  
  if (!comparison) {
    // Create a new comparison
    comparison = {
      id: `comp_${request.id}`,
      request_id: request.id,
      request: request,
      supplier_quotes: [],
      created_at: new Date().toISOString(),
      status: 'open'
    };
    mockQuoteComparisons.push(comparison);
  }
  
  // Add the quote to the comparison
  comparison.supplier_quotes.push(quote);
  
  console.log(`Simulated quote response for request ${quoteRequest.id}`);
}

/**
 * Helper function to generate a quote for a specific supplier
 */
function generateMockQuoteForSupplier(request: Request, supplier: Supplier): SupplierQuote | null {
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setDate(now.getDate() + 14);
  
  // Generate quote items for this supplier
  const quoteItems: QuoteItem[] = [];
  
  request.items.forEach(item => {
    const productSupplierData = mockSupplierProducts.find(p => p.product_id === item.product_id);
    const supplierOffering = productSupplierData?.supplier_offerings.find(
      so => so.supplier_id === supplier.id
    );
    
    if (!supplierOffering || !supplierOffering.available) return;
    
    // Apply volume pricing if available
    let price = supplierOffering.price;
    if (supplierOffering.volume_pricing) {
      const tier = supplierOffering.volume_pricing.find(vp => 
        item.quantity >= vp.minQuantity && 
        (vp.maxQuantity === null || item.quantity <= vp.maxQuantity)
      );
      if (tier) price = tier.price;
    }
    
    quoteItems.push({
      id: `qitem_${supplier.id}_${item.id}`,
      request_item_id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit,
      price_per_unit: price,
      in_stock: supplierOffering.available,
      supplier_product_code: supplierOffering.supplier_product_code
    });
  });
  
  if (quoteItems.length === 0) return null;
  
  const totalAmount = quoteItems.reduce(
    (sum, item) => sum + (item.price_per_unit * item.quantity),
    0
  );
  
  return {
    id: `quote_${supplier.id}_${request.id}_${Date.now()}`,
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    request_id: request.id,
    created_at: now.toISOString(),
    expiry_date: expiryDate.toISOString(),
    status: 'received' as QuoteStatus,
    delivery_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    items: quoteItems,
    total_amount: Number(totalAmount.toFixed(2)),
    validity_days: 14,
    is_blanket_quote: false
  };
}

/**
 * Send a reminder for a quote request
 */
export async function sendQuoteRequestReminder(requestId: string): Promise<boolean> {
  try {
    // In a real app, this would send an email or notification
    // For mock, just update the status
    await quoteRequestsDataAccess.updateRequest(requestId, {
      sent_at: new Date().toISOString() // Update the sent time
    });
    
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
    // Update the request status
    await quoteRequestsDataAccess.updateRequest(requestId, {
      status: 'expired'
    });
    
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
    // This function is complex and would need significant database work
    // For now, keep it as is, but mark clearly where DB logic would go
    
    if (USE_MOCK_DATA) {
      const idsToUse = requestIds.length > 0 ? requestIds : mockProcurementRequests.map(r => r.id);
      const comparisons = mockQuoteComparisons.filter(c => idsToUse.includes(c.request_id));
      
      // Build product-centered view
      const productMap = new Map<string, ProductQuoteComparison>();
      
      comparisons.forEach(comparison => {
        comparison.request.items.forEach((requestItem: RequestItem) => {  // Add type annotation
          const productId = requestItem.product_id;
          
          // Find product details
          const productSupplierData = mockSupplierProducts.find(p => p.product_id === productId);
          if (!productSupplierData) return;
          
          // Initialize product if not already tracked
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              productId,
              productName: requestItem.product_name,
              category: productSupplierData.product_category,
              unit: requestItem.unit,
              sku: productSupplierData.product_sku,
              requestIds: [comparison.request_id],
              quantity: requestItem.quantity,
              supplierQuotes: [],
              selectedSupplierId: undefined
            });
          } else {
            // Update existing product
            const productEntry = productMap.get(productId)!;
            if (!productEntry.requestIds.includes(comparison.request_id)) {
              productEntry.requestIds.push(comparison.request_id);
            }
            // Use the max quantity if it appears in multiple requests
            if (requestItem.quantity > productEntry.quantity) {
              productEntry.quantity = requestItem.quantity;
            }
          }
          
          // Process supplier quotes for this product
          comparison.supplier_quotes.forEach(supplierQuote => {
            const quoteItem = supplierQuote.items.find(item => 
              item.product_id === productId
            );
            
            if (quoteItem) {
              const productEntry = productMap.get(productId)!;
              
              // Find supplier offering
              // Type assertion for supplier_offerings
              const supplierOffering = (productSupplierData as any).supplier_offerings?.find(
                (so: any) => so.supplier_id === supplierQuote.supplier_id
              );
              
              // Check if we already have this supplier
              const existingSupplierIndex = productEntry.supplierQuotes.findIndex(
                sq => sq.supplierId === supplierQuote.supplier_id
              );
              
              const supplierProductQuote: SupplierProductQuote = {
                supplierId: supplierQuote.supplier_id,
                supplierName: supplierQuote.supplier_name,
                price: quoteItem.price_per_unit,
                inStock: quoteItem.in_stock,
                supplierProductCode: supplierOffering?.supplier_product_code,
                minimumOrderQuantity: supplierOffering?.minimum_order_quantity,
                packageConversion: supplierOffering?.package_conversion ? {
                  supplierUnit: supplierOffering.package_conversion.supplier_unit,
                  supplierUnitSize: supplierOffering.package_conversion.supplier_unit_size,
                  supplierUnitPrice: supplierOffering.package_conversion.supplier_unit_price
                } : undefined
              };
              
              if (existingSupplierIndex >= 0) {
                // Use the better price if this supplier already quoted
                if (quoteItem.price_per_unit < productEntry.supplierQuotes[existingSupplierIndex].price) {
                  productEntry.supplierQuotes[existingSupplierIndex].price = quoteItem.price_per_unit;
                }
              } else {
                // Add new supplier quote
                productEntry.supplierQuotes.push(supplierProductQuote);
              }
            }
          });
        });
        
        // Sort supplier quotes by price for each product
        for (const product of productMap.values()) {
          product.supplierQuotes.sort((a, b) => a.price - b.price);
        }
      });
      
      return Array.from(productMap.values());
    } else {
      // REAL DATABASE IMPLEMENTATION WOULD GO HERE
      // This would likely involve multiple SQL queries or stored procedures
      // For now, return an empty array as placeholder
      return [];
    }
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
      const supplier = await suppliersDataAccess.getById(supplierId);
      if (!supplier) continue;
      
      // Process order items
      const orderItems: any[] = [];
      let orderTotal = 0;
      
      for (const selection of productSelections) {
        // Get product details
        const product = await productsDataAccess.getById(selection.productId);
        if (!product) continue;
        
        // Find supplier-specific information
        // Type assertion for supplier_offerings
        const supplierOffering = (product as any).supplier_offerings?.find(
          (so: any) => so.supplier_id === supplierId
        );
        
        // Calculate price
        const price = supplierOffering?.price || 0;
        const total = price * selection.quantity;
        
        // Add to order items
        orderItems.push({
          id: `item_${generateId()}`,
          productId: selection.productId,
          productName: product.product_name,
          quantity: selection.quantity,
          unit: product.default_unit,
          price: price,
          total: total,
          sku: product.product_sku,
          supplierProductCode: supplierOffering?.supplier_product_code
        });
        
        orderTotal += total;
      }
      
      // Create the order
      const order = await ordersDataAccess.createOrder({
        supplierId,
        supplierName: supplier.name,
        createdAt: new Date().toISOString(),
        status: 'draft',
        items: orderItems,
        total: orderTotal
      });
      
      orders.push({
        id: order.id,
        supplierId,
        supplierName: supplier.name,
        orderNumber: order.number
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
    return await ordersDataAccess.getAll();
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
    return await ordersDataAccess.getById(id);
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }
}

/**
 * Get a quote by ID
 */
export async function getQuoteById(id: string): Promise<SupplierQuote | null> {
  try {
    return await quotesDataAccess.getQuoteById(id);
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
    if (USE_MOCK_DATA) {
      // Find and update the quote in mock data
      for (const comparison of mockQuoteComparisons) {
        const quote = comparison.supplier_quotes.find(q => q.id === id);
        if (quote) {
          quote.status = 'approved';
          return true;
        }
      }
      return false;
    }
    
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
    if (USE_MOCK_DATA) {
      // Find and update the quote in mock data
      for (const comparison of mockQuoteComparisons) {
        const quote = comparison.supplier_quotes.find(q => q.id === id);
        if (quote) {
          quote.status = 'rejected';
          return true;
        }
      }
      return false;
    }
    
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