import { supabase } from './supabase';
import { InventoryItem } from '../types/product';

// Update inventory count for multiple items
export async function updateInventoryCount(counts: Record<string, number>): Promise<boolean> {
  try {
    // With Supabase, perform a batch update
    for (const [productId, count] of Object.entries(counts)) {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          current_stock: count,
          stock_level: determineStockLevel(count),
          last_updated: new Date().toISOString(),
          last_counted_at: new Date().toISOString()
        })
        .eq('product_id', productId);
      
      if (error) {
        console.error('Error updating inventory count:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating inventory count:', error);
    return false;
  }
}

// Helper to determine stock level based on count
function determineStockLevel(count: number): 'low' | 'medium' | 'high' {
  if (count <= 5) return 'low';
  if (count <= 20) return 'medium';
  return 'high';
}

// Get updated inventory data
export async function getUpdatedInventory(): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:product_id (
          id,
          name,
          description,
          category,
          default_unit,
          created_at
        )
      `);
    
    if (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
    
    // Transform the joined data to match the InventoryItem type
    return data.map(item => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      category: item.product.category,
      default_unit: item.product.default_unit,
      created_at: item.product.created_at,
      stock_level: item.stock_level,
      current_stock: item.current_stock,
      last_updated: item.last_updated,
      last_counted_at: item.last_counted_at
    }));
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}