import { supabase } from '../services/supabase';
import { mockSuppliers } from '../mocks/procurement-data';

// Define a minimal interface for the returned product data
interface ProductIdName {
  id: string;
  name: string;
}

// Helper function to transform mock data for Supabase
const transformMockData = () => {
  // Transform suppliers
  const suppliers = mockSuppliers.map(supplier => ({
    name: supplier.name,
    contact: supplier.contact,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    payment_terms: supplier.paymentTerms,
    delivery_days: supplier.deliveryDays,
    minimum_order: supplier.minimumOrder,
    notes: supplier.notes
  }));
  
  // Create placeholder products
  const products = [
    {
      name: 'Tomatoes',
      description: 'Fresh organic tomatoes',
      category: 'Vegetables',
      default_unit: 'kg'
    },
    {
      name: 'Potatoes',
      description: 'Idaho potatoes, great for frying',
      category: 'Vegetables',
      default_unit: 'kg'
    },
    // Add more products as needed
  ];
  
  return { suppliers, products };
};

/**
 * Setup database with initial data
 */
export async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    const { suppliers, products } = transformMockData();
    
    // 1. Insert suppliers
    console.log('Adding suppliers...');
    const { error: suppliersError } = await supabase
      .from('suppliers')
      .insert(suppliers);
    
    if (suppliersError) throw suppliersError;
    
    // 2. Insert products
    console.log('Adding products...');
    const { error: productsError } = await supabase
      .from('products')
      .insert(products);
    
    if (productsError) throw productsError;
    
    // 3. Get inserted products to create inventory
    const { data: insertedProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, name');
    
    if (fetchError) throw fetchError;
    
    // 4. Create inventory records for each product - FIX HERE
    console.log('Setting up inventory...');
    const inventoryItems = insertedProducts.map((product: ProductIdName) => ({
      product_id: product.id,
      current_stock: Math.floor(Math.random() * 100),
      stock_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    }));
    
    const { error: inventoryError } = await supabase
      .from('inventory')
      .insert(inventoryItems);
    
    if (inventoryError) throw inventoryError;
    
    // 5. Get suppliers to create supplier_products
    const { data: insertedSuppliers, error: supplierFetchError } = await supabase
      .from('suppliers')
      .select('id, name');
    
    if (supplierFetchError) throw supplierFetchError;
    
    // 6. Create supplier_products entries
    console.log('Setting up supplier products...');
    const supplierProducts = [];
    
    for (const product of insertedProducts) {
      // Assign random suppliers (2-3) for each product
      const selectedSuppliers = insertedSuppliers
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 2);
      
      for (const supplier of selectedSuppliers) {
        supplierProducts.push({
          supplier_id: supplier.id,
          product_id: product.id,
          price: Number((10 + Math.random() * 20).toFixed(2)),
          supplier_product_code: `${supplier.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
          available: Math.random() > 0.1
        });
      }
    }
    
    if (supplierProducts.length > 0) {
      const { error: supplierProductsError } = await supabase
        .from('supplier_products')
        .insert(supplierProducts);
      
      if (supplierProductsError) throw supplierProductsError;
    }
    
    console.log('Database setup complete!');
    return { success: true };
  } catch (error) {
    console.error('Database setup failed:', error);
    return { success: false, error };
  }
}

/**
 * Create a test user
 */
export async function createTestUser(email: string, password: string, role: 'chef' | 'purchasing' | 'admin') {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (authError) throw authError;
    
    // 2. Create user record in users table
    if (authData.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          role: role,
          name: role === 'chef' ? 'Chef User' : role === 'purchasing' ? 'Purchasing User' : 'Admin User'
        });
      
      if (userError) throw userError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to create test user:', error);
    return { success: false, error };
  }
}