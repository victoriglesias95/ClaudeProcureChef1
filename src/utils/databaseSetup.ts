// src/utils/databaseSetup.ts - Improved with better error handling
import { supabase } from '../services/supabase';

interface SetupResult {
  success: boolean;
  error?: string;
  details?: string[];
  tablesCreated?: string[];
  dataInserted?: Record<string, number>;
}

/**
 * Check if a table exists and has the expected structure
 */
async function checkTable(tableName: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false, error: `Table '${tableName}' does not exist` };
      }
      return { exists: false, error: `Error accessing table '${tableName}': ${error.message}` };
    }
    
    return { exists: true };
  } catch (error) {
    return { exists: false, error: `Failed to check table '${tableName}': ${error}` };
  }
}

/**
 * Verify database schema before setup
 */
async function verifyDatabaseSchema(): Promise<{
  ready: boolean;
  missingTables: string[];
  errors: string[];
}> {
  const requiredTables = [
    'users', 'products', 'inventory', 'suppliers', 'supplier_products',
    'requests', 'request_items', 'quote_requests', 'quotes', 'quote_items',
    'orders', 'order_items'
  ];
  
  const missingTables: string[] = [];
  const errors: string[] = [];
  
  console.log('🔍 Verifying database schema...');
  
  for (const table of requiredTables) {
    const result = await checkTable(table);
    if (!result.exists) {
      missingTables.push(table);
      if (result.error) {
        errors.push(result.error);
      }
    }
  }
  
  return {
    ready: missingTables.length === 0,
    missingTables,
    errors
  };
}

/**
 * Create basic test data for development
 */
async function createTestData(): Promise<SetupResult> {
  const details: string[] = [];
  const dataInserted: Record<string, number> = {};
  
  try {
    details.push('🚀 Starting database setup...');
    
    // 1. Create test products
    details.push('📦 Creating products...');
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
      {
        name: 'Onions',
        description: 'Yellow onions',
        category: 'Vegetables',
        default_unit: 'kg'
      },
      {
        name: 'Chicken Breast',
        description: 'Boneless, skinless chicken breast',
        category: 'Meat',
        default_unit: 'kg'
      },
      {
        name: 'Milk',
        description: 'Whole milk',
        category: 'Dairy',
        default_unit: 'L'
      },
      {
        name: 'Cheddar Cheese',
        description: 'Sharp cheddar cheese',
        category: 'Dairy',
        default_unit: 'kg'
      },
      {
        name: 'Olive Oil',
        description: 'Extra virgin olive oil',
        category: 'Pantry',
        default_unit: 'L'
      },
      {
        name: 'Flour',
        description: 'All-purpose flour',
        category: 'Baking',
        default_unit: 'kg'
      }
    ];
    
    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select();
    
    if (productsError) {
      throw new Error(`Failed to create products: ${productsError.message}`);
    }
    
    dataInserted.products = insertedProducts?.length || 0;
    details.push(`✅ Created ${dataInserted.products} products`);
    
    // 2. Create inventory records for products
    details.push('📊 Creating inventory records...');
    const inventoryItems = insertedProducts?.map(product => ({
      product_id: product.id,
      current_stock: Math.floor(Math.random() * 50) + 10, // 10-60 items
      stock_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      last_updated: new Date().toISOString()
    })) || [];
    
    const { data: insertedInventory, error: inventoryError } = await supabase
      .from('inventory')
      .insert(inventoryItems)
      .select();
    
    if (inventoryError) {
      throw new Error(`Failed to create inventory: ${inventoryError.message}`);
    }
    
    dataInserted.inventory = insertedInventory?.length || 0;
    details.push(`✅ Created ${dataInserted.inventory} inventory records`);
    
    // 3. Create test suppliers
    details.push('🏪 Creating suppliers...');
    const suppliers = [
      {
        name: 'Farm Fresh Produce',
        contact: 'John Smith',
        email: 'john@farmfresh.com',
        phone: '+1-555-123-4567',
        address: '123 Farm Road, Agricultural District',
        payment_terms: 'Net 30',
        delivery_days: ['Monday', 'Wednesday', 'Friday'],
        minimum_order: 100.00,
        notes: 'Local produce supplier - best prices for volume orders'
      },
      {
        name: 'Quality Meats & Dairy',
        contact: 'Sarah Johnson',
        email: 'sarah@qualitymeats.com',
        phone: '+1-555-987-6543',
        address: '456 Butcher Lane, Food District',
        payment_terms: 'Net 15',
        delivery_days: ['Tuesday', 'Thursday', 'Saturday'],
        minimum_order: 200.00,
        notes: 'Premium meat and dairy supplier'
      },
      {
        name: 'Pantry Essentials',
        contact: 'Mike Chen',
        email: 'mike@pantryessentials.com',
        phone: '+1-555-456-7890',
        address: '789 Supply Street, Industrial Zone',
        payment_terms: 'Net 30',
        delivery_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        minimum_order: 150.00,
        notes: 'Dry goods and pantry items specialist'
      }
    ];
    
    const { data: insertedSuppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .insert(suppliers)
      .select();
    
    if (suppliersError) {
      throw new Error(`Failed to create suppliers: ${suppliersError.message}`);
    }
    
    dataInserted.suppliers = insertedSuppliers?.length || 0;
    details.push(`✅ Created ${dataInserted.suppliers} suppliers`);
    
    // 4. Create supplier-product relationships
    details.push('🔗 Creating supplier-product relationships...');
    const supplierProducts: any[] = [];
    
    if (insertedProducts && insertedSuppliers) {
      insertedProducts.forEach(product => {
        // Each product is supplied by 1-3 random suppliers
        const availableSuppliers = insertedSuppliers.sort(() => 0.5 - Math.random());
        const numSuppliers = Math.floor(Math.random() * 2) + 1; // 1-2 suppliers per product
        
        for (let i = 0; i < numSuppliers && i < availableSuppliers.length; i++) {
          const supplier = availableSuppliers[i];
          const basePrice = 5 + Math.random() * 20; // $5-25 base price
          
          supplierProducts.push({
            supplier_id: supplier.id,
            product_id: product.id,
            price: Number(basePrice.toFixed(2)),
            supplier_product_code: `${supplier.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
            available: Math.random() > 0.1, // 90% availability
            minimum_order_quantity: Math.floor(Math.random() * 5) + 1
          });
        }
      });
    }
    
    if (supplierProducts.length > 0) {
      const { data: insertedSupplierProducts, error: spError } = await supabase
        .from('supplier_products')
        .insert(supplierProducts)
        .select();
      
      if (spError) {
        throw new Error(`Failed to create supplier products: ${spError.message}`);
      }
      
      dataInserted.supplier_products = insertedSupplierProducts?.length || 0;
      details.push(`✅ Created ${dataInserted.supplier_products} supplier-product relationships`);
    }
    
    details.push('🎉 Database setup completed successfully!');
    
    return {
      success: true,
      details,
      dataInserted
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details
    };
  }
}

/**
 * Main setup function with comprehensive error handling
 */
export async function setupDatabase(): Promise<SetupResult> {
  try {
    console.log('🔍 Starting database setup verification...');
    
    // Step 1: Verify database connection
    const { data, error: connectionError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });
    
    if (connectionError) {
      return {
        success: false,
        error: 'Database connection failed',
        details: [`Connection error: ${connectionError.message}`]
      };
    }
    
    // Step 2: Verify schema exists
    const schemaCheck = await verifyDatabaseSchema();
    
    if (!schemaCheck.ready) {
      return {
        success: false,
        error: 'Database schema is not ready',
        details: [
          'Missing tables detected. You need to create the database schema first.',
          'Missing tables: ' + schemaCheck.missingTables.join(', '),
          '',
          'Please ensure your Supabase project has the required tables.',
          'You may need to run database migrations or create tables manually.',
          ...schemaCheck.errors
        ]
      };
    }
    
    // Step 3: Create test data
    return await createTestData();
    
  } catch (error) {
    return {
      success: false,
      error: 'Setup process failed',
      details: [`Unexpected error: ${error}`]
    };
  }
}

/**
 * Create a test user (unchanged from original)
 */
export async function createTestUser(email: string, password: string, role: 'chef' | 'purchasing' | 'admin'): Promise<SetupResult> {
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
    
    return { 
      success: true,
      details: [`User ${email} created successfully with role: ${role}`]
    };
  } catch (error) {
    console.error('Failed to create test user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      details: ['Failed to create test user']
    };
  }
}