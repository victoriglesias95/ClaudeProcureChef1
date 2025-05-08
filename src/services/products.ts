import { supabase } from './supabase';
import { Product, InventoryItem } from '../types/product';
import { mockProducts, generateMockInventoryItems } from '../mocks/data';

// Environment configuration
const USE_MOCK_DATA = true; // Set to false to use real database when ready

// Fetch all products
export async function getProducts(): Promise<Product[]> {
  // If using mock data, return mocks
  if (USE_MOCK_DATA) {
    return mockProducts;
  }
  
  try {
    // Otherwise use Supabase
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
  const products = await getProducts();
  
  if (USE_MOCK_DATA) {
    // Generate mock inventory data
    return generateMockInventoryItems(products);
  }
  
  try {
    // In a real implementation, this would fetch actual inventory data
    // For now we're still generating mock inventory info even in "production" mode
    return products.map(product => ({
      ...product,
      stock_level: 'medium', // Default value
      current_stock: 0,
      last_updated: new Date().toISOString(),
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