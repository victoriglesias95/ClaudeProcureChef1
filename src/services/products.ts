import { supabase } from './supabase';
import { Product, InventoryItem } from '../types/product';
import { mockProducts, generateMockInventoryItems } from '../mocks/data';

// SET THIS TO FALSE TO USE SUPABASE
const USE_MOCK_DATA = false; 

// Fetch all products
export async function getProducts(): Promise<Product[]> {
  // If using mock data, return mocks
  if (USE_MOCK_DATA) {
    return mockProducts;
  }
  
  try {
    // Use Supabase
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

// Fetch products with inventory data
export async function getInventoryItems(): Promise<InventoryItem[]> {
  if (USE_MOCK_DATA) {
    return generateMockInventoryItems(mockProducts);
  }
  
  try {
    // Join products with inventory
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category,
        default_unit,
        created_at,
        inventory (
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
    
    // Transform the joined data to match InventoryItem type
    return data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      default_unit: product.default_unit,
      created_at: product.created_at,
      stock_level: product.inventory?.[0]?.stock_level || 'medium',
      current_stock: product.inventory?.[0]?.current_stock || 0,
      last_updated: product.inventory?.[0]?.last_updated || new Date().toISOString(),
      last_counted_at: product.inventory?.[0]?.last_counted_at
    }));
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    return [];
  }
}

// Get products grouped by category
export async function getProductsByCategory(): Promise<Record<string, InventoryItem[]>> {
  const items = await getInventoryItems();
  
  return items.reduce((grouped, item) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
    return grouped;
  }, {} as Record<string, InventoryItem[]>);
}