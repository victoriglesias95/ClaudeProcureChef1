import { supabase } from './supabase';
import { Product, InventoryItem } from '../types/product';

// Fetch all products
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  return data || [];
}

// Fetch products with inventory data
export async function getInventoryItems(): Promise<InventoryItem[]> {
  // This is a mock implementation until we have an actual inventory table
  const products = await getProducts();
  
  return products.map(product => ({
    ...product,
    stock_level: getRandomStockLevel(),
    current_stock: Math.floor(Math.random() * 100),
    last_updated: new Date().toISOString(),
  }));
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

// Helper function for mock data
function getRandomStockLevel(): 'low' | 'medium' | 'high' {
  const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  return levels[Math.floor(Math.random() * levels.length)];
}