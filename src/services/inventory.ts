import { supabase } from './supabase';
import { InventoryItem } from '../types/product';

/**
 * Helper function to determine stock level based on count
 */
function determineStockLevel(count: number): 'low' | 'medium' | 'high' {
  if (count <= 5) return 'low';
  if (count <= 20) return 'medium';
  return 'high';
}

/**
 * Update inventory count for multiple items
 */
export async function updateInventoryCount(counts: Record<string, number>): Promise<boolean> {
  try {
    console.log('Updating inventory counts:', counts);
    
    // Perform batch update using individual updates (more reliable than bulk operations)
    const updatePromises = Object.entries(counts).map(async ([productId, count]) => {
      const stockLevel = determineStockLevel(count);
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('inventory')
        .update({ 
          current_stock: count,
          stock_level: stockLevel,
          last_updated: now,
          last_counted_at: now
        })
        .eq('product_id', productId);
      
      if (error) {
        console.error(`Error updating inventory count for product ${productId}:`, error);
        throw error;
      }
      
      return { productId, count, stockLevel };
    });
    
    const results = await Promise.all(updatePromises);
    console.log('Inventory update results:', results);
    
    return true;
  } catch (error) {
    console.error('Error updating inventory counts:', error);
    return false;
  }
}

/**
 * Get current inventory data for all products
 */
export async function getCurrentInventory(): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        product_id,
        current_stock,
        stock_level,
        last_updated,
        last_counted_at,
        products!inner (
          id,
          name,
          description,
          category,
          default_unit,
          created_at
        )
      `)
      .order('products.name');
    
    if (error) {
      console.error('Error fetching current inventory:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.warn('No inventory data found');
      return [];
    }
    
    // Transform the joined data to match InventoryItem type with proper typing
    return data.map((item: any) => ({
      id: item.products.id,
      name: item.products.name,
      description: item.products.description,
      category: item.products.category,
      default_unit: item.products.default_unit,
      created_at: item.products.created_at,
      stock_level: item.stock_level,
      current_stock: item.current_stock,
      last_updated: item.last_updated,
      last_counted_at: item.last_counted_at
    }));
  } catch (error) {
    console.error('Error fetching current inventory:', error);
    return [];
  }
}

/**
 * Get inventory for a specific product
 */
export async function getProductInventory(productId: string): Promise<InventoryItem | null> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        product_id,
        current_stock,
        stock_level,
        last_updated,
        last_counted_at,
        products!inner (
          id,
          name,
          description,
          category,
          default_unit,
          created_at
        )
      `)
      .eq('product_id', productId)
      .single();
    
    if (error) {
      console.error(`Error fetching inventory for product ${productId}:`, error);
      return null;
    }
    
    if (!data) {
      console.warn(`No inventory found for product ${productId}`);
      return null;
    }
    
    // Properly type the response
    const typedData = data as any;
    
    return {
      id: typedData.products.id,
      name: typedData.products.name,
      description: typedData.products.description,
      category: typedData.products.category,
      default_unit: typedData.products.default_unit,
      created_at: typedData.products.created_at,
      stock_level: typedData.stock_level,
      current_stock: typedData.current_stock,
      last_updated: typedData.last_updated,
      last_counted_at: typedData.last_counted_at
    };
  } catch (error) {
    console.error(`Error fetching inventory for product ${productId}:`, error);
    return null;
  }
}

/**
 * Initialize inventory record for a new product
 */
export async function createInventoryRecord(
  productId: string, 
  initialStock: number = 0
): Promise<boolean> {
  try {
    const stockLevel = determineStockLevel(initialStock);
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('inventory')
      .insert({
        product_id: productId,
        current_stock: initialStock,
        stock_level: stockLevel,
        last_updated: now,
        last_counted_at: now
      });
    
    if (error) {
      console.error(`Error creating inventory record for product ${productId}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error creating inventory record for product ${productId}:`, error);
    return false;
  }
}

/**
 * Update stock level for a single product
 */
export async function updateProductStock(
  productId: string, 
  newStock: number,
  isCountUpdate: boolean = false
): Promise<boolean> {
  try {
    const stockLevel = determineStockLevel(newStock);
    const now = new Date().toISOString();
    
    const updateData: any = {
      current_stock: newStock,
      stock_level: stockLevel,
      last_updated: now
    };
    
    // If this is a count update (manual inventory count), update the counted_at timestamp
    if (isCountUpdate) {
      updateData.last_counted_at = now;
    }
    
    const { error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('product_id', productId);
    
    if (error) {
      console.error(`Error updating stock for product ${productId}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating stock for product ${productId}:`, error);
    return false;
  }
}

/**
 * Get low stock items (for alerts/notifications)
 */
export async function getLowStockItems(): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        product_id,
        current_stock,
        stock_level,
        last_updated,
        last_counted_at,
        products!inner (
          id,
          name,
          description,
          category,
          default_unit,
          created_at
        )
      `)
      .eq('stock_level', 'low')
      .order('current_stock');
    
    if (error) {
      console.error('Error fetching low stock items:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data.map((item: any) => ({
      id: item.products.id,
      name: item.products.name,
      description: item.products.description,
      category: item.products.category,
      default_unit: item.products.default_unit,
      created_at: item.products.created_at,
      stock_level: item.stock_level,
      current_stock: item.current_stock,
      last_updated: item.last_updated,
      last_counted_at: item.last_counted_at
    }));
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    return [];
  }
}