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

// Create a new product
export async function createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
  if (USE_MOCK_DATA) {
    // For mock mode, simulate product creation
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      ...productData,
      created_at: new Date().toISOString()
    };
    return newProduct;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Update a product
export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
  if (USE_MOCK_DATA) {
    // For mock mode, simulate update
    const existingProduct = mockProducts.find(p => p.id === id);
    if (!existingProduct) throw new Error('Product not found');
    
    const updatedProduct = {
      ...existingProduct,
      ...productData
    };
    return updatedProduct;
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Delete a product
export async function deleteProduct(id: string): Promise<boolean> {
  if (USE_MOCK_DATA) {
    // For mock mode, simulate deletion
    return true;
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
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
        sku,
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
      sku: product.sku,
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