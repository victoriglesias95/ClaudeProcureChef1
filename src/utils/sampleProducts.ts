import { SupabaseClient } from '@supabase/supabase-js';
import { Product } from '../types/product';

/**
 * Generate sample products for testing
 */
export async function generateSampleProducts(supabase: SupabaseClient): Promise<Product[]> {
  const sampleProducts = [
    {
      name: 'Tomatoes',
      description: 'Fresh organic tomatoes',
      category: 'Vegetables',
      default_unit: 'kg',
      sku: 'VEG-TOM-001'
    },
    {
      name: 'Chicken Breast',
      description: 'Boneless, skinless',
      category: 'Meat',
      default_unit: 'kg',
      sku: 'MEAT-CHK-001'
    },
    // Add more sample products as needed
  ];

  const products: Product[] = [];

  for (const product of sampleProducts) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      products.push(data);
    } catch (error) {
      console.error('Error creating sample product:', error);
    }
  }

  return products;
}

/**
 * Import products from CSV
 */
export async function importProductsFromCSV(supabase: SupabaseClient, csvData: string): Promise<{success: boolean, count: number, errors: any[]}> {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const products = [];
  const errors = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(',').map(v => v.trim());
      const product: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        product[header] = values[index] || null;
      });
      
      // Ensure required fields
      if (!product.name || !product.category || !product.default_unit) {
        throw new Error(`Missing required fields in line ${i + 1}`);
      }
      
      products.push(product);
    } catch (error) {
      errors.push({ line: i + 1, error });
    }
  }
  
  let count = 0;
  
  if (products.length > 0) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(products)
        .select();
      
      if (error) throw error;
      count = data?.length || 0;
    } catch (error) {
      errors.push({ batch: true, error });
    }
  }
  
  return {
    success: errors.length === 0,
    count,
    errors
  };
}