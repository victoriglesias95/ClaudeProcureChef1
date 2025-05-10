import { supabase } from './supabase';
import { 
  Quote,
  QuoteComparison, 
  SupplierQuote,
  ProductQuoteComparison,
  SupplierProductQuote,
  Order,
  QuoteStatus  // Add this import
} from '../types/quote';
import { Request, RequestItem } from '../types/request';  // Add RequestItem import
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