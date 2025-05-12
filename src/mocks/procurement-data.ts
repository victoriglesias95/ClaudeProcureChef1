import { mockProducts, mockCategoryPrices } from './data';
import { Request, RequestStatus } from '../types/request';
import { SupplierQuote, QuoteStatus, QuoteItem } from '../types/quote';

// Comprehensive supplier database
export const mockSuppliers = [
  {
    id: 'supplier1',
    name: 'Farm Fresh Produce',
    contact: 'John Smith',
    email: 'john@farmfresh.com',
    phone: '555-123-4567',
    address: '123 Farm Road',
    paymentTerms: 'Net 30',
    deliveryDays: ['Monday', 'Wednesday', 'Friday'],
    minimumOrder: 100.00,
    notes: 'Local produce supplier - best prices for volume orders'
  },
  {
    id: 'supplier2',
    name: 'Green Valley Farms',
    contact: 'Sarah Johnson',
    email: 'sarah@greenvalley.com',
    phone: '555-987-6543',
    address: '456 Valley Lane',
    paymentTerms: 'Net 15',
    deliveryDays: ['Tuesday', 'Thursday'],
    minimumOrder: 150.00,
    notes: 'Organic specialty produce - premium quality'
  },
  {
    id: 'supplier3',
    name: 'Ocean Fresh Seafood',
    contact: 'Mike Chen',
    email: 'mike@oceanfresh.com',
    phone: '555-456-7890',
    address: '789 Harbor Drive',
    paymentTerms: 'Net 7',
    deliveryDays: ['Wednesday', 'Friday'],
    minimumOrder: 200.00,
    notes: 'Sustainable seafood supplier - daily fresh catch'
  },
  {
    id: 'supplier4',
    name: 'Quality Meats',
    contact: 'Robert Davis',
    email: 'robert@qualitymeats.com',
    phone: '555-789-0123',
    address: '321 Butcher Street',
    paymentTerms: 'Net 14',
    deliveryDays: ['Monday', 'Thursday'],
    minimumOrder: 250.00,
    notes: 'Premium meat supplier - USDA prime cuts'
  }
];

// Mock chefs/users
export const mockChefs = [
  { id: 'chef1', name: 'Chef Carlos', restaurant: 'Main Kitchen' },
  { id: 'chef2', name: 'Chef Maria', restaurant: 'Main Kitchen' },
  { id: 'chef3', name: 'Chef Tony', restaurant: 'Banquet Hall' }
];

// Enhanced product-supplier mapping with volume discounts
export const mockSupplierProducts = mockProducts.map(product => {
  const supplierOfferings = mockSuppliers
    .filter(() => Math.random() > 0.3) // Each supplier offers 70% of products
    .map(supplier => {
      const categoryPrice = product.category && mockCategoryPrices[product.category] 
        ? mockCategoryPrices[product.category].price 
        : 10.00;
        
      // Base price with supplier variation
      const priceVariation = 0.85 + (Math.random() * 0.3);
      const basePrice = categoryPrice * priceVariation;
      
      // Volume pricing tiers
      const volumePricing = [
        { minQuantity: 1, maxQuantity: 10, price: basePrice },
        { minQuantity: 11, maxQuantity: 50, price: basePrice * 0.95 },
        { minQuantity: 51, maxQuantity: 100, price: basePrice * 0.90 },
        { minQuantity: 101, maxQuantity: null, price: basePrice * 0.85 }
      ];
      
      // Package conversion for some products
      const packageConversion = Math.random() > 0.7 
        ? { 
            supplier_unit: 'case', 
            supplier_unit_size: Math.floor(Math.random() * 5) + 6, // 6-10 units per case
            supplier_unit_price: basePrice * (Math.floor(Math.random() * 5) + 6) * 0.9 // 10% discount for cases
          }
        : undefined;
      
      return {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_product_code: `${supplier.id.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
        price: Number(basePrice.toFixed(2)),
        currency: 'USD',
        minimum_order_quantity: Math.floor(Math.random() * 5) + 1,
        available: Math.random() > 0.1, // 90% availability
        lead_time_days: Math.floor(Math.random() * 3) + 1,
        package_conversion: packageConversion,
        volume_pricing: volumePricing,
        last_price_update: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    });

  return {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    product_sku: `SKU-${product.id}`,
    default_unit: product.default_unit,
    supplier_offerings: supplierOfferings
  };
});

// Enhanced mock requests - Multiple requests from different chefs with overlapping products
export const mockProcurementRequests: Request[] = [
  {
    id: 'req1',
    title: 'Weekly Produce Order - Main Kitchen',
    created_by: 'chef1',
    created_at: new Date().toISOString(),
    needed_by: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    status: 'approved',
    notes: 'Regular weekly order for main kitchen',
    items: [
      {
        id: 'item1',
        product_id: '1', // Tomatoes
        product_name: 'Tomatoes',
        quantity: 50,
        unit: 'kg',
        price_per_unit: 0
      },
      {
        id: 'item2',
        product_id: '2', // Potatoes
        product_name: 'Potatoes',
        quantity: 100,
        unit: 'kg',
        price_per_unit: 0
      },
      {
        id: 'item3',
        product_id: '3', // Onions
        product_name: 'Onions',
        quantity: 30,
        unit: 'kg',
        price_per_unit: 0
      }
    ],
    total_amount: 0
  },
  {
    id: 'req2',
    title: 'Weekend Special - Chef Maria',
    created_by: 'chef2',
    created_at: new Date().toISOString(),
    needed_by: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    status: 'approved',
    notes: 'Special ingredients for weekend menu',
    items: [
      {
        id: 'item4',
        product_id: '1', // Tomatoes (overlapping with req1)
        product_name: 'Tomatoes',
        quantity: 30,
        unit: 'kg',
        price_per_unit: 0
      },
      {
        id: 'item5',
        product_id: '7', // Salmon
        product_name: 'Salmon Fillet',
        quantity: 20,
        unit: 'kg',
        price_per_unit: 0
      },
      {
        id: 'item6',
        product_id: '9', // Cheddar Cheese
        product_name: 'Cheddar Cheese',
        quantity: 15,
        unit: 'kg',
        price_per_unit: 0
      }
    ],
    total_amount: 0
  },
  {
    id: 'req3',
    title: 'Banquet Hall Order',
    created_by: 'chef3',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    needed_by: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'low',
    status: 'approved',
    notes: 'Upcoming banquet event - 200 guests',
    items: [
      {
        id: 'item7',
        product_id: '5', // Chicken Breast
        product_name: 'Chicken Breast',
        quantity: 80,
        unit: 'kg',
        price_per_unit: 0
      },
      {
        id: 'item8',
        product_id: '2', // Potatoes (overlapping with req1)
        product_name: 'Potatoes',
        quantity: 60,
        unit: 'kg',
        price_per_unit: 0
      },
      {
        id: 'item9',
        product_id: '4', // Bell Peppers
        product_name: 'Bell Peppers',
        quantity: 25,
        unit: 'kg',
        price_per_unit: 0
      }
    ],
    total_amount: 0
  },
  {
    id: 'req4',
    title: 'Urgent Restock - Main Kitchen',
    created_by: 'chef1',
    created_at: new Date().toISOString(),
    needed_by: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    status: 'submitted', // Not yet approved
    notes: 'Running low on essentials',
    items: [
      {
        id: 'item10',
        product_id: '12', // Olive Oil
        product_name: 'Olive Oil',
        quantity: 20,
        unit: 'L',
        price_per_unit: 0
      },
      {
        id: 'item11',
        product_id: '10', // Flour
        product_name: 'Flour',
        quantity: 50,
        unit: 'kg',
        price_per_unit: 0
      }
    ],
    total_amount: 0
  }
];

// Function to generate quotes with different statuses and scenarios
export function generateMockQuotes(requestId: string): SupplierQuote[] {
  const request = mockProcurementRequests.find(r => r.id === requestId);
  if (!request) return [];
  
  // Different quote scenarios based on request
  const scenarios = [
    'all_quotes_valid',
    'some_expired',
    'mixed_availability',
    'volume_discounts',
    'pending_responses'
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  return mockSuppliers.map((supplier, index) => {
    const now = new Date();
    let expiryDate = new Date(now);
    let status: QuoteStatus = 'received';
    let created = new Date(now);
    
    // Apply different scenarios
    switch (scenario) {
      case 'some_expired':
        if (index === 0) {
          expiryDate.setDate(now.getDate() - 5); // Expired 5 days ago
          created.setDate(now.getDate() - 35);
        } else {
          expiryDate.setDate(now.getDate() + 14);
          created.setDate(now.getDate() - 2);
        }
        break;
      
      case 'mixed_availability':
        expiryDate.setDate(now.getDate() + 7);
        created.setDate(now.getDate() - 1);
        if (index === 1) status = 'sent'; // Awaiting response
        if (index === 2) status = 'rejected'; // Supplier rejected
        break;
      
      case 'volume_discounts':
        expiryDate.setDate(now.getDate() + 30); // Longer validity for volume
        created.setDate(now.getDate() - 1);
        break;
      
      case 'pending_responses':
        if (index > 1) {
          status = 'sent';
          return null; // No quote yet from this supplier
        }
        expiryDate.setDate(now.getDate() + 10);
        created.setDate(now.getDate() - 1);
        break;
      
      default: // all_quotes_valid
        expiryDate.setDate(now.getDate() + 14);
        created.setDate(now.getDate() - 2);
    }
    
    if (status === 'sent') return null;
    
    // Generate quote items
    const quoteItems = request.items.map(item => {
      const productSupplierData = mockSupplierProducts.find(p => p.product_id === item.product_id);
      const supplierOffering = productSupplierData?.supplier_offerings.find(
        so => so.supplier_id === supplier.id
      );
      
      if (!supplierOffering || !supplierOffering.available) {
        return {
          id: `qitem_${supplier.id}_${item.id}`,
          request_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          price_per_unit: 0,
          in_stock: false,
          supplier_product_code: supplierOffering?.supplier_product_code || '',
          notes: 'Product not available'
        };
      }
      
      // Apply volume pricing if applicable
      let price = supplierOffering.price;
      if (supplierOffering.volume_pricing) {
        const tier = supplierOffering.volume_pricing.find(vp => 
          item.quantity >= vp.minQuantity && 
          (vp.maxQuantity === null || item.quantity <= vp.maxQuantity)
        );
        if (tier) price = tier.price;
      }
      
      return {
        id: `qitem_${supplier.id}_${item.id}`,
        request_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        price_per_unit: price,
        in_stock: Math.random() > 0.1, // 90% in stock
        supplier_product_code: supplierOffering.supplier_product_code,
        package_conversion: supplierOffering.package_conversion
      };
    });
    
    const totalAmount = quoteItems.reduce(
      (sum, item) => sum + (item.price_per_unit * item.quantity),
      0
    );
    
    const validityDays = scenario === 'volume_discounts' ? 30 : 14;
    
    return {
      id: `quote_${supplier.id}_${request.id}_${Date.now()}`,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      request_id: request.id,
      created_at: created.toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: status,
      delivery_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      items: quoteItems,
      total_amount: Number(totalAmount.toFixed(2)),
      validity_days: validityDays,
      is_blanket_quote: scenario === 'volume_discounts' && index === 0,
      notes: scenario === 'volume_discounts' ? 'Volume discount applied - 30 day validity' : undefined
    };
  }).filter(quote => quote !== null) as SupplierQuote[];
}

// Replace the generateBundledQuotes function in src/mocks/procurement-data.ts with this corrected version:

export function generateBundledQuotes(requestIds: string[]): SupplierQuote[] {
  // Generate individual quotes for each request first
  const individualQuotes: SupplierQuote[] = [];
  requestIds.forEach(requestId => {
    const quotes = generateMockQuotes(requestId);
    individualQuotes.push(...quotes);
  });
  
  // Group quotes by supplier
  const quotesBySupplier = new Map<string, SupplierQuote[]>();
  individualQuotes.forEach(quote => {
    if (!quotesBySupplier.has(quote.supplier_id)) {
      quotesBySupplier.set(quote.supplier_id, []);
    }
    quotesBySupplier.get(quote.supplier_id)!.push(quote);
  });
  
  // Create bundled quotes for each supplier
  const bundledQuotes: SupplierQuote[] = [];
  
  for (const [supplierId, supplierQuotes] of quotesBySupplier.entries()) {
    const supplier = mockSuppliers.find(s => s.id === supplierId);
    if (!supplier) continue;
    
    // Aggregate items across all quotes from this supplier
    const aggregatedItems = new Map<string, {
      items: QuoteItem[],
      totalQuantity: number,
      unit: string,
      productName: string
    }>();
    
    supplierQuotes.forEach(quote => {
      quote.items.forEach(item => {
        if (aggregatedItems.has(item.product_id)) {
          const existing = aggregatedItems.get(item.product_id)!;
          existing.items.push(item);
          existing.totalQuantity += item.quantity;
        } else {
          aggregatedItems.set(item.product_id, {
            items: [item],
            totalQuantity: item.quantity,
            unit: item.unit,
            productName: item.product_name
          });
        }
      });
    });
    
    // Create bundled quote items
    const bundledItems: QuoteItem[] = [];
    
    for (const [productId, aggregated] of aggregatedItems.entries()) {
      // Apply volume pricing based on total quantity
      const productSupplierData = mockSupplierProducts.find(p => p.product_id === productId);
      const supplierOffering = productSupplierData?.supplier_offerings.find(
        so => so.supplier_id === supplierId
      );
      
      if (!supplierOffering) continue;
      
      let price = supplierOffering.price;
      if (supplierOffering.volume_pricing) {
        const tier = supplierOffering.volume_pricing.find(vp => 
          aggregated.totalQuantity >= vp.minQuantity && 
          (vp.maxQuantity === null || aggregated.totalQuantity <= vp.maxQuantity)
        );
        if (tier) price = tier.price;
      }
      
      // Create a bundled item for each original request item
      aggregated.items.forEach(originalItem => {
        bundledItems.push({
          ...originalItem,
          price_per_unit: price, // Use the volume price
          notes: `Bundled quote - Volume pricing applied. Total bundled quantity: ${aggregated.totalQuantity} ${aggregated.unit}`
        });
      });
    }
    
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(now.getDate() + 30); // Longer validity for bundled quotes
    
    const totalAmount = bundledItems.reduce(
      (sum, item) => sum + (item.price_per_unit * item.quantity),
      0
    );
    
    const bundledQuote: SupplierQuote = {
      id: `bundled_quote_${supplierId}_${Date.now()}`,
      supplier_id: supplierId,
      supplier_name: supplier.name,
      request_id: requestIds.join(','), // Multiple request IDs
      created_at: now.toISOString(),
      expiry_date: expiryDate.toISOString(),
      status: 'received' as QuoteStatus,
      delivery_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      items: bundledItems,
      total_amount: Number(totalAmount.toFixed(2)),
      validity_days: 30,
      is_blanket_quote: true,
      notes: `Bundled quote for ${requestIds.length} requests - Volume pricing applied`
    };
    
    bundledQuotes.push(bundledQuote);
  }
  
  return bundledQuotes;
}
// Mock quote history for testing
export const mockQuoteHistory = {
  getQuoteHistory: (productId: string, supplierId: string) => {
    const history = [];
    const now = new Date();
    
    // Generate 3-5 historical quotes
    const count = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < count; i++) {
      const daysAgo = (i + 1) * 30;
      const createdDate = new Date(now);
      createdDate.setDate(createdDate.getDate() - daysAgo);
      
      const expiryDate = new Date(createdDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const basePrice = 10 + Math.random() * 20;
      const price = basePrice * (1 + (Math.random() - 0.5) * 0.3); // ±15% variation
      
      history.push({
        id: `hist_${i}`,
        created_at: createdDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        price: Number(price.toFixed(2)),
        status: now > expiryDate ? 'expired' : 'valid',
        quantity_ordered: Math.floor(Math.random() * 100) + 10
      });
    }
    
    return history.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
};

// Mock supplier price lists
export const mockSupplierPriceLists = {
  getSupplierPriceList: (supplierId: string) => {
    const supplier = mockSuppliers.find(s => s.id === supplierId);
    if (!supplier) return null;
    
    const priceList = mockSupplierProducts
      .map(product => {
        const offering = product.supplier_offerings.find(so => so.supplier_id === supplierId);
        if (!offering) return null;
        
        return {
          product_id: product.product_id,
          product_name: product.product_name,
          product_sku: product.product_sku,
          category: product.product_category,
          supplier_product_code: offering.supplier_product_code,
          base_price: offering.price,
          volume_pricing: offering.volume_pricing,
          package_conversion: offering.package_conversion,
          minimum_order_quantity: offering.minimum_order_quantity,
          last_updated: offering.last_price_update,
          available: offering.available,
          lead_time_days: offering.lead_time_days
        };
      })
      .filter(item => item !== null);
    
    return {
      supplier_id: supplierId,
      supplier_name: supplier.name,
      last_updated: new Date().toISOString(),
      items: priceList,
      notes: `Price list for ${supplier.name} - Volume discounts available`
    };
  }
};