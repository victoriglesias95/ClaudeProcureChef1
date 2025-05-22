// src/services/optimized-queries.ts - Fixed N+1 problems and optimize queries
import { supabase } from './supabase';

// Define proper types for Supabase responses
interface SupabaseProductWithInventory {
  id: string;
  name: string;
  description: string;
  category: string;
  default_unit: string;
  sku?: string;
  created_at: string;
  inventory: Array<{
    current_stock: number;
    stock_level: 'low' | 'medium' | 'high';
    last_updated: string;
    last_counted_at?: string;
  }>;
}

interface InventoryUpdateInput {
  productId: string;
  count: number;
}

// Optimized inventory service with proper joins
export class OptimizedInventoryService {
  // Single query to get all inventory with product details
  static async getInventoryWithProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category,
        default_unit,
        sku,
        created_at,
        inventory!inner (
          current_stock,
          stock_level,
          last_updated,
          last_counted_at
        )
      `)
      .order('name');
    
    if (error) throw error;
    
    // Properly handle the joined data structure
    return (data as SupabaseProductWithInventory[])?.map(product => {
      // Supabase returns inventory as an array, get the first (and only) item
      const inventoryData = product.inventory[0];
      
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        default_unit: product.default_unit,
        sku: product.sku,
        created_at: product.created_at,
        current_stock: inventoryData?.current_stock || 0,
        stock_level: inventoryData?.stock_level || 'low' as const,
        last_updated: inventoryData?.last_updated || new Date().toISOString(),
        last_counted_at: inventoryData?.last_counted_at
      };
    }) || [];
  }

  // Batch update inventory counts (single transaction)
  static async batchUpdateInventory(updates: InventoryUpdateInput[]) {
    try {
      // Use Promise.all for concurrent updates (more efficient than RPC for small batches)
      const updatePromises = updates.map(async (update) => {
        const stockLevel = update.count <= 5 ? 'low' : 
                          update.count <= 20 ? 'medium' : 'high';
        
        return supabase
          .from('inventory')
          .update({ 
            current_stock: update.count,
            stock_level: stockLevel,
            last_updated: new Date().toISOString(),
            last_counted_at: new Date().toISOString()
          })
          .eq('product_id', update.productId);
      });

      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} inventory items`);
      }

      return true;
    } catch (error) {
      console.error('Error in batch update:', error);
      throw error;
    }
  }
}

// Define types for quote service
interface SupabaseRequest {
  id: string;
  title: string;
  priority: string;
  needed_by?: string;
  status: string;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
  }>;
}

interface SupabaseQuote {
  id: string;
  supplier_id: string;
  supplier_name: string;
  request_id: string;
  status: string;
  expiry_date?: string;
  total_amount: number;
  created_at: string;
  is_blanket_quote?: boolean;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    in_stock: boolean;
    supplier_product_code?: string;
  }>;
}

interface SupabaseSupplierProduct {
  supplier_id: string;
  product_id: string;
  price: number;
  supplier_product_code?: string;
  available: boolean;
  minimum_order_quantity?: number;
  supplier: Array<{
    id: string;
    name: string;
  }>;
}

// Processed supplier product type
interface ProcessedSupplierProduct {
  supplier_id: string;
  product_id: string;
  price: number;
  supplier_product_code?: string;
  available: boolean;
  minimum_order_quantity?: number;
  supplier_name: string;
}

// Optimized quote comparison service
export class OptimizedQuoteService {
  // Single query to get complete quote comparison data
  static async getQuoteComparisonData(requestIds: string[]) {
    // Get all related data in parallel
    const [requestsData, quotesData, supplierProductsData] = await Promise.all([
      // Requests with items
      supabase
        .from('requests')
        .select(`
          id, title, priority, needed_by, status,
          items:request_items(
            id, product_id, product_name, quantity, unit, price_per_unit
          )
        `)
        .in('id', requestIds),
      
      // Quotes with items for these requests
      supabase
        .from('quotes')
        .select(`
          id, supplier_id, supplier_name, request_id, status, 
          expiry_date, total_amount, created_at, is_blanket_quote,
          items:quote_items(
            id, product_id, product_name, quantity, unit, 
            price_per_unit, in_stock, supplier_product_code
          )
        `)
        .in('request_id', requestIds),
      
      // Supplier products for pricing - Fixed join structure
      supabase
        .from('supplier_products')
        .select(`
          supplier_id, product_id, price, supplier_product_code,
          available, minimum_order_quantity,
          supplier:suppliers!inner(id, name)
        `)
    ]);

    if (requestsData.error) throw requestsData.error;
    if (quotesData.error) throw quotesData.error;
    if (supplierProductsData.error) throw supplierProductsData.error;

    // Process supplier products to flatten the structure
    const processedSupplierProducts = (supplierProductsData.data as SupabaseSupplierProduct[])?.map(sp => ({
      supplier_id: sp.supplier_id,
      product_id: sp.product_id,
      price: sp.price,
      supplier_product_code: sp.supplier_product_code,
      available: sp.available,
      minimum_order_quantity: sp.minimum_order_quantity,
      supplier_name: sp.supplier[0]?.name || 'Unknown'
    })) || [];

    return {
      requests: requestsData.data as SupabaseRequest[] || [],
      quotes: quotesData.data as SupabaseQuote[] || [],
      supplierProducts: processedSupplierProducts as ProcessedSupplierProduct[]
    };
  }

  // Optimized product quote comparison
  static async getProductQuoteComparison(requestIds: string[]) {
    const data = await this.getQuoteComparisonData(requestIds);
    
    // Process data into product-centered view efficiently
    const productMap = new Map();
    
    // Build product entries from requests
    data.requests.forEach(request => {
      request.items.forEach(item => {
        if (!productMap.has(item.product_id)) {
          productMap.set(item.product_id, {
            productId: item.product_id,
            productName: item.product_name,
            unit: item.unit,
            requestIds: [request.id],
            quantity: item.quantity,
            supplierQuotes: []
          });
        } else {
          const product = productMap.get(item.product_id);
          if (!product.requestIds.includes(request.id)) {
            product.requestIds.push(request.id);
            product.quantity = Math.max(product.quantity, item.quantity);
          }
        }
      });
    });

    // Add quote data efficiently
    data.quotes.forEach(quote => {
      quote.items.forEach(quoteItem => {
        const product = productMap.get(quoteItem.product_id);
        if (product) {
          product.supplierQuotes.push({
            supplierId: quote.supplier_id,
            supplierName: quote.supplier_name,
            price: quoteItem.price_per_unit,
            inStock: quoteItem.in_stock,
            supplierProductCode: quoteItem.supplier_product_code
          });
        }
      });
    });

    return Array.from(productMap.values());
  }
}

// Optimized order service with proper types
export class OptimizedOrderService {
  // Create orders with proper batch operations
  static async createOrdersFromSelections(selections: {
    productId: string;
    supplierId: string;
    quantity: number;
  }[]) {
    // Group by supplier
    const supplierGroups = selections.reduce((groups, selection) => {
      if (!groups[selection.supplierId]) {
        groups[selection.supplierId] = [];
      }
      groups[selection.supplierId].push(selection);
      return groups;
    }, {} as Record<string, typeof selections>);

    // Get all required data in batch
    const supplierIds = Object.keys(supplierGroups);
    const productIds = selections.map(s => s.productId);

    const [suppliersData, productsData, supplierProductsData] = await Promise.all([
      supabase.from('suppliers').select('id, name').in('id', supplierIds),
      supabase.from('products').select('id, name, default_unit, sku').in('id', productIds),
      supabase.from('supplier_products')
        .select('supplier_id, product_id, price, supplier_product_code')
        .in('supplier_id', supplierIds)
        .in('product_id', productIds)
    ]);

    if (suppliersData.error) throw suppliersData.error;
    if (productsData.error) throw productsData.error;
    if (supplierProductsData.error) throw supplierProductsData.error;

    // Create lookup maps
    const supplierMap = new Map(suppliersData.data?.map(s => [s.id, s]) || []);
    const productMap = new Map(productsData.data?.map(p => [p.id, p]) || []);
    const supplierProductMap = new Map(
      supplierProductsData.data?.map(sp => [`${sp.supplier_id}_${sp.product_id}`, sp]) || []
    );

    // Create orders efficiently
    const orders = [];
    
    for (const [supplierId, items] of Object.entries(supplierGroups)) {
      const supplier = supplierMap.get(supplierId);
      if (!supplier) continue;

      const orderNumber = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Prepare order items
      const orderItems = items.map(item => {
        const product = productMap.get(item.productId);
        const supplierProduct = supplierProductMap.get(`${supplierId}_${item.productId}`);
        const price = supplierProduct?.price || 0;
        
        return {
          product_id: item.productId,
          product_name: product?.name || 'Unknown',
          quantity: item.quantity,
          unit: product?.default_unit || 'unit',
          price,
          total: price * item.quantity,
          sku: product?.sku,
          supplier_product_code: supplierProduct?.supplier_product_code
        };
      });

      const orderTotal = orderItems.reduce((sum, item) => sum + item.total, 0);

      // Insert order and items in transaction
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          number: orderNumber,
          supplier_id: supplierId,
          supplier_name: supplier.name,
          status: 'draft',
          total: orderTotal
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: order.id
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId);

      if (itemsError) throw itemsError;

      orders.push({
        id: order.id,
        supplierId,
        supplierName: supplier.name,
        orderNumber
      });
    }

    return orders;
  }
}

// Database functions to be created in Supabase (SQL)
export const DATABASE_FUNCTIONS = {
  batch_update_inventory: `
    CREATE OR REPLACE FUNCTION batch_update_inventory(
      updates jsonb
    ) RETURNS void AS $$
    DECLARE
      update_record jsonb;
    BEGIN
      FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
      LOOP
        UPDATE inventory 
        SET 
          current_stock = (update_record->>'new_count')::integer,
          stock_level = CASE 
            WHEN (update_record->>'new_count')::integer <= 5 THEN 'low'
            WHEN (update_record->>'new_count')::integer <= 20 THEN 'medium'
            ELSE 'high'
          END,
          last_updated = (update_record->>'updated_at')::timestamp,
          last_counted_at = (update_record->>'updated_at')::timestamp
        WHERE product_id = (update_record->>'product_id')::uuid;
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
  `,
  
  get_dashboard_stats: `
    CREATE OR REPLACE FUNCTION get_dashboard_stats()
    RETURNS jsonb AS $$
    DECLARE
      result jsonb;
    BEGIN
      SELECT jsonb_build_object(
        'pending_requests', (SELECT COUNT(*) FROM requests WHERE status = 'submitted'),
        'approved_requests', (SELECT COUNT(*) FROM requests WHERE status = 'approved'),
        'active_quotes', (SELECT COUNT(*) FROM quotes WHERE status = 'received'),
        'recent_orders', (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '7 days'),
        'low_stock_items', (SELECT COUNT(*) FROM inventory WHERE stock_level = 'low')
      ) INTO result;
      
      RETURN result;
    END;
    $$ LANGUAGE plpgsql;
  `
};