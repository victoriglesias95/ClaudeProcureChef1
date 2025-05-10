import { mockProducts, mockCategoryPrices } from './data';
import { Request } from '../types/request';

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
    notes: 'Local produce supplier'
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
    notes: 'Organic specialty produce'
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
    notes: 'Sustainable seafood supplier'
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
    notes: 'Premium meat supplier'
  }
];

// Product-supplier mapping with specific pricing
export const mockSupplierProducts = mockProducts.map(product => {
  // Generate supplier offerings for this product
  const supplierOfferings = mockSuppliers
    // Not all suppliers offer all products - randomly select 2-3 suppliers per product
    .filter(() => Math.random() > 0.3)
    .map(supplier => {
      // Get base price from category
      const categoryPrice = product.category && mockCategoryPrices[product.category] 
        ? mockCategoryPrices[product.category].price 
        : 10.00;
        
      // Add supplier-specific variation (-15% to +15%)
      const priceVariation = 0.85 + (Math.random() * 0.3);
      const price = categoryPrice * priceVariation;
      
      // Some suppliers use different units or package sizes
      const packageConversion = Math.random() > 0.8 
        ? { 
            supplier_unit: 'case', 
            supplier_unit_size: Math.floor(Math.random() * 5) + 6, // 6-10 units per case
            supplier_unit_price: price * (Math.floor(Math.random() * 5) + 6)
          }
        : undefined;
      
      return {
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        supplier_product_code: `${supplier.id.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
        price: Number(price.toFixed(2)),
        currency: 'USD',
        minimum_order_quantity: Math.floor(Math.random() * 3) + 1,
        available: Math.random() > 0.1, // 90% chance of being available
        lead_time_days: Math.floor(Math.random() * 3) + 1,
        package_conversion: packageConversion
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

// Generate some mock requests
export const mockProcurementRequests = [
  {
    id: 'req1',
    title: 'Weekly Produce Order',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    needed_by: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    status: 'approved',
    notes: 'Regular weekly order',
    items: mockProducts.slice(0, 5).map((product, index) => ({
      id: `item${index + 1}`,
      product_id: product.id,
      product_name: product.name,
      quantity: Math.floor(Math.random() * 10) + 1,
      unit: product.default_unit,
      price_per_unit: 0
    })),
    total_amount: 0
  },
  {
    id: 'req2',
    title: 'Seafood Special',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    needed_by: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    status: 'approved',
    notes: 'For weekend special menu',
    items: mockProducts.slice(6, 8).map((product, index) => ({
      id: `item${index + 6}`,
      product_id: product.id,
      product_name: product.name,
      quantity: Math.floor(Math.random() * 5) + 3,
      unit: product.default_unit,
      price_per_unit: 0
    })),
    total_amount: 0
  }
];

// Function to generate quotes based on requests
export function generateMockQuotes(requestId: string) {
  const request = mockProcurementRequests.find(r => r.id === requestId);
  if (!request) return [];
  
  // Generate quotes from suppliers for this request
  return mockSuppliers.slice(0, 3).map(supplier => {
    const quoteItems = request.items.map(item => {
      // Find this product in supplier offerings
      const productSupplierData = mockSupplierProducts.find(p => p.product_id === item.product_id);
      const supplierOffering = productSupplierData?.supplier_offerings.find(
        so => so.supplier_id === supplier.id
      );
      
      // If supplier doesn't offer this product, generate a random price
      const price = supplierOffering?.price || 
        Number((Math.random() * 20 + 5).toFixed(2));
      
      return {
        id: `qitem_${supplier.id}_${item.id}`,
        request_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        price_per_unit: price,
        in_stock: Math.random() > 0.2
      };
    });
    
    const totalAmount = quoteItems.reduce(
      (sum, item) => sum + (item.price_per_unit * item.quantity),
      0
    );
    
    return {
      id: `quote_${supplier.id}_${request.id}`,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      request_id: request.id,
      created_at: new Date().toISOString(),
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'received',
      delivery_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      items: quoteItems,
      total_amount: Number(totalAmount.toFixed(2))
    };
  });
}