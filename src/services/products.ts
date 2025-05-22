import { supabase } from './supabase';
import { Product, InventoryItem } from '../types/product';

/**
 * Fetch basic products (no inventory data)
 */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching product ${id}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

/**
 * Fetch products WITH inventory data using proper join
 */
export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    // Use a proper join query to get products with their inventory data
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category,
        default_unit,
        created_at,
        inventory!inner (
          stock_level,
          current_stock,
          last_updated,
          last_counted_at
        )
      `);
    
    if (error) {
      console.error('Error fetching inventory data:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.warn('No inventory data found - ensure products and inventory tables are populated');
      return [];
    }
    
    // Transform the joined data to match InventoryItem type with explicit typing
    return data.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      default_unit: product.default_unit,
      created_at: product.created_at,
      stock_level: product.inventory.stock_level || 'medium',
      current_stock: product.inventory.current_stock || 0,
      last_updated: product.inventory.last_updated || new Date().toISOString(),
      last_counted_at: product.inventory.last_counted_at
    }));
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    return [];
  }
}

/**
 * Get products grouped by category with inventory data
 */
export async function getProductsByCategory(): Promise<Record<string, InventoryItem[]>> {
  const items = await getInventoryItems();
  
  if (items.length === 0) {
    console.warn('No inventory items found for categorization');
    return {};
  }
  
  return items.reduce((grouped, item) => {
    const category = item.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
    return grouped;
  }, {} as Record<string, InventoryItem[]>);
}

/**
 * Create a new product
 */
export async function createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        category: product.category,
        default_unit: product.default_unit
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      return null;
    }
    
    // Also create an inventory record for this product
    const { error: inventoryError } = await supabase
      .from('inventory')
      .insert({
        product_id: data.id,
        current_stock: 0,
        stock_level: 'low',
        last_updated: new Date().toISOString()
      });
    
    if (inventoryError) {
      console.error('Error creating inventory record:', inventoryError);
      // Don't fail the whole operation, just log the error
    }
    
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

/**
 * Update a product
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error(`Error updating product ${id}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return false;
  }
}

/**
 * Delete a product (and its inventory record)
 */
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    // First delete inventory record
    const { error: inventoryError } = await supabase
      .from('inventory')
      .delete()
      .eq('product_id', id);
    
    if (inventoryError) {
      console.error(`Error deleting inventory for product ${id}:`, inventoryError);
      // Continue with product deletion even if inventory deletion fails
    }
    
    // Then delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting product ${id}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    return false;
  }
}

/**
 * Search products by name or category
 */
export async function searchProducts(searchTerm: string): Promise<InventoryItem[]> {
  if (!searchTerm.trim()) {
    return getInventoryItems();
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category,
        default_unit,
        created_at,
        inventory!inner (
          stock_level,
          current_stock,
          last_updated,
          last_counted_at
        )
      `)
      .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order('name');
    
    if (error) {
      console.error('Error searching products:', error);
      return [];
    }
    
    return data?.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      default_unit: product.default_unit,
      created_at: product.created_at,
      stock_level: product.inventory.stock_level || 'medium',
      current_stock: product.inventory.current_stock || 0,
      last_updated: product.inventory.last_updated || new Date().toISOString(),
      last_counted_at: product.inventory.last_counted_at
    })) || [];
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}