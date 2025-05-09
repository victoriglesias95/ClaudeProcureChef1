import { supabase } from './supabase';
import { 
  Request,
  QuoteComparison, 
  SupplierQuote,
  QuoteItem, 
  ProductQuoteComparison,
  SupplierProductQuote,
  SelectedQuoteItem,
  Order
} from '../types/quote';
import { 
  mockSuppliers, 
  mockSupplierProducts, 
  mockProcurementRequests, 
  generateMockQuotes 
} from '../mocks/procurement-data';

// Environment configuration
const USE_MOCK_DATA = true;

// Mock data storage
const mockRequests: Request[] = [];
const mockQuoteComparisons: QuoteComparison[] = [];
const mockOrders: Order[] = [];

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Initialize mock data
if (USE_MOCK_DATA) {
  // Use pre-built mock data
  mockRequests.push(...mockProcurementRequests);
  
  // Create quote comparisons for all requests
  mockProcurementRequests.forEach(request => {
    const quoteComparison = {
      id: `comp_${request.id}`,
      request_id: request.id,
      request: request,
      supplier_quotes: generateMockQuotes(request.id),
      created_at: new Date().toISOString(),
      status: 'open'
    };
    
    mockQuoteComparisons.push(quoteComparison);
  });
}

// Get all requests
export async function getRequests(): Promise<Request[]> {
  if (USE_MOCK_DATA) {
    return [...mockRequests];
  }
  
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching requests:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
}

// Get a request by ID
export async function getRequestById(id: string): Promise<Request | null> {
  if (USE_MOCK_DATA) {
    return mockRequests.find(r => r.id === id) || null;
  }
  
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching request:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching request:', error);
    return null;
  }
}

// Get all suppliers
export async function getSuppliers() {
  if (USE_MOCK_DATA) {
    return mockSuppliers;
  }
  
  // In the future, this would call the ERP API
  return [];
}

// Get a supplier by ID
export async function getSupplierById(id: string) {
  if (USE_MOCK_DATA) {
    return mockSuppliers.find(s => s.id === id) || null;
  }
  
  // In the future, this would call the ERP API
  return null;
}

// Get all products with supplier information
export async function getProducts() {
  if (USE_MOCK_DATA) {
    return mockSupplierProducts;
  }
  
  // In the future, this would call the ERP API
  return [];
}

// Get all quote comparisons
export async function getQuoteComparisons(): Promise<QuoteComparison[]> {
  if (USE_MOCK_DATA) {
    return [...mockQuoteComparisons];
  }
  
  // Implementation for Supabase would go here
  return [];
}

// Get a quote comparison by ID
export async function getQuoteComparisonById(id: string): Promise<QuoteComparison | null> {
  if (USE_MOCK_DATA) {
    return mockQuoteComparisons.find(c => c.id === id) || null;
  }
  
  // Implementation for Supabase would go here
  return null;
}

// Create a quote comparison from a request
export async function createQuoteComparisonFromRequest(requestId: string): Promise<QuoteComparison> {
  const request = await getRequestById(requestId);
  
  if (!request) {
    throw new Error(`Request with ID ${requestId} not found`);
  }
  
  // Check if a comparison already exists for this request
  const existingComparison = mockQuoteComparisons.find(c => c.request_id === requestId);
  if (existingComparison) {
    return existingComparison;
  }
  
  // Generate supplier quotes
  const supplierQuotes = generateMockQuotes(requestId);
  
  const newComparison: QuoteComparison = {
    id: `comp_${generateId()}`,
    request_id: requestId,
    request: request,
    supplier_quotes: supplierQuotes,
    created_at: new Date().toISOString(),
    status: 'open'
  };
  
  if (USE_MOCK_DATA) {
    mockQuoteComparisons.push(newComparison);
    return newComparison;
  }
  
  // Implementation for Supabase would go here
  return newComparison;
}

// Get product-centered quote comparison
export async function getProductQuoteComparison(requestIds: string[] = []): Promise<ProductQuoteComparison[]> {
  if (USE_MOCK_DATA) {
    // If no specific requestIds provided, use all
    const idsToUse = requestIds.length > 0 ? requestIds : mockRequests.map(r => r.id);
    
    // Get all relevant quote comparisons
    const comparisons = mockQuoteComparisons.filter(c => 
      idsToUse.includes(c.request_id)
    );
    
    // Build product-centered view
    const productMap = new Map<string, ProductQuoteComparison>();
    
    comparisons.forEach(comparison => {
      comparison.request.items.forEach(requestItem => {
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
            const supplierOffering = productSupplierData.supplier_offerings.find(
              so => so.supplier_id === supplierQuote.supplier_id
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
  }
  
  // Implementation for Supabase would go here
  return [];
}

// Create orders from product selections
export async function createOrdersFromProductSelections(
  selections: {productId: string, supplierId: string, quantity: number}[]
): Promise<{id: string, supplierId: string, supplierName: string, orderNumber: string}[]> {
  if (USE_MOCK_DATA) {
    // Group by supplier
    const supplierOrders = new Map<string, {
      supplierId: string;
      supplierName: string;
      items: {
        productId: string;
        productName: string;
        quantity: number;
        unit: string;
        price: number;
        sku?: string;
        supplierProductCode?: string;
      }[];
    }>();
    
    // Process each selection
    selections.forEach(selection => {
      // Find product details and supplier
      const productDetails = mockSupplierProducts.find(p => p.product_id === selection.productId);
      const supplier = mockSuppliers.find(s => s.id === selection.supplierId);
      
      if (!productDetails || !supplier) return;
      
      // Find supplier offering
      const supplierOffering = productDetails.supplier_offerings.find(
        so => so.supplier_id === selection.supplierId
      );
      
      if (!supplierOrders.has(selection.supplierId)) {
        supplierOrders.set(selection.supplierId, {
          supplierId: selection.supplierId,
          supplierName: supplier.name,
          items: []
        });
      }
      
      // Use price from supplier offering or fallback
      const price = supplierOffering?.price || 0;
      
      // Add to order
      supplierOrders.get(selection.supplierId)!.items.push({
        productId: selection.productId,
        productName: productDetails.product_name,
        quantity: selection.quantity,
        unit: productDetails.default_unit,
        price,
        sku: productDetails.product_sku,
        supplierProductCode: supplierOffering?.supplier_product_code
      });
    });
    
    // Create orders
    const orders: {id: string, supplierId: string, supplierName: string, orderNumber: string}[] = [];
    
    for (const [supplierId, orderData] of supplierOrders.entries()) {
      const orderId = `order_${generateId()}`;
      const orderNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Create order
      const order: Order = {
        id: orderId,
        number: orderNumber,
        supplierId,
        supplierName: orderData.supplierName,
        createdAt: new Date().toISOString(),
        status: 'draft',
        items: orderData.items.map(item => ({
          id: `orderitem_${generateId()}`,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          supplierProductCode: item.supplierProductCode,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.price * item.quantity,
        })),
        total: orderData.items.reduce(
          (sum, item) => sum + (item.price * item.quantity),
          0
        )
      };
      
      // Add to mock orders
      mockOrders.push(order);
      
      orders.push({
        id: orderId,
        supplierId,
        supplierName: orderData.supplierName,
        orderNumber
      });
    }
    
    return orders;
  }
  
  // Implementation for Supabase would go here
  return [];
}

// Get all orders
export async function getOrders(): Promise<Order[]> {
  if (USE_MOCK_DATA) {
    return [...mockOrders];
  }
  
  // Implementation for Supabase would go here
  return [];
}

// Get an order by ID
export async function getOrderById(id: string): Promise<Order | null> {
  if (USE_MOCK_DATA) {
    return mockOrders.find(o => o.id === id) || null;
  }
  
  // Implementation for Supabase would go here
  return null;
}