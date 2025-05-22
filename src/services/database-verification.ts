// src/services/database-verification.ts
import { supabase } from './supabase';

interface TableSchema {
  table: string;
  expectedColumns: string[];
  relationships?: string[];
}

const EXPECTED_SCHEMA: TableSchema[] = [
  {
    table: 'users',
    expectedColumns: ['id', 'email', 'role', 'name', 'created_at']
  },
  {
    table: 'products',
    expectedColumns: ['id', 'name', 'description', 'category', 'default_unit', 'created_at']
  },
  {
    table: 'inventory',
    expectedColumns: ['product_id', 'current_stock', 'stock_level', 'last_updated', 'last_counted_at'],
    relationships: ['products']
  },
  {
    table: 'suppliers',
    expectedColumns: ['id', 'name', 'contact', 'email', 'phone', 'address', 'payment_terms', 'delivery_days', 'minimum_order', 'notes', 'created_at']
  },
  {
    table: 'supplier_products',
    expectedColumns: ['supplier_id', 'product_id', 'price', 'supplier_product_code', 'available', 'minimum_order_quantity'],
    relationships: ['suppliers', 'products']
  },
  {
    table: 'requests',
    expectedColumns: ['id', 'title', 'created_by', 'created_at', 'needed_by', 'priority', 'status', 'notes', 'total_amount'],
    relationships: ['users']
  },
  {
    table: 'request_items',
    expectedColumns: ['id', 'request_id', 'product_id', 'product_name', 'quantity', 'unit', 'price_per_unit'],
    relationships: ['requests', 'products']
  },
  {
    table: 'quote_requests',
    expectedColumns: ['id', 'request_id', 'supplier_id', 'supplier_name', 'sent_at', 'status', 'response_deadline', 'quote_id'],
    relationships: ['requests', 'suppliers']
  },
  {
    table: 'quotes',
    expectedColumns: ['id', 'supplier_id', 'supplier_name', 'request_id', 'created_at', 'expiry_date', 'status', 'delivery_date', 'total_amount', 'validity_days', 'is_blanket_quote', 'notes'],
    relationships: ['suppliers', 'requests']
  },
  {
    table: 'quote_items',
    expectedColumns: ['id', 'quote_id', 'request_item_id', 'product_id', 'product_name', 'quantity', 'unit', 'price_per_unit', 'in_stock', 'supplier_product_code', 'notes'],
    relationships: ['quotes', 'request_items', 'products']
  },
  {
    table: 'orders',
    expectedColumns: ['id', 'number', 'supplier_id', 'supplier_name', 'created_at', 'status', 'delivery_date', 'total', 'notes'],
    relationships: ['suppliers']
  },
  {
    table: 'order_items',
    expectedColumns: ['id', 'order_id', 'product_id', 'product_name', 'quantity', 'unit', 'price', 'total', 'sku', 'supplier_product_code'],
    relationships: ['orders', 'products']
  }
];

interface VerificationResult {
  table: string;
  exists: boolean;
  hasData: boolean;
  rowCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Verify database schema and data integrity
 */
export async function verifyDatabaseSchema(): Promise<{
  success: boolean;
  results: VerificationResult[];
  summary: {
    tablesFound: number;
    tablesWithData: number;
    totalErrors: number;
    totalWarnings: number;
  };
}> {
  const results: VerificationResult[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  let tablesFound = 0;
  let tablesWithData = 0;

  for (const schema of EXPECTED_SCHEMA) {
    const result: VerificationResult = {
      table: schema.table,
      exists: false,
      hasData: false,
      rowCount: 0,
      errors: [],
      warnings: []
    };

    try {
      // Test if table exists by trying to select from it
      const { data, error, count } = await supabase
        .from(schema.table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST116') {
          result.errors.push(`Table '${schema.table}' does not exist`);
        } else {
          result.errors.push(`Error accessing table '${schema.table}': ${error.message}`);
        }
      } else {
        result.exists = true;
        tablesFound++;
        result.rowCount = count || 0;
        
        if (result.rowCount > 0) {
          result.hasData = true;
          tablesWithData++;
        } else {
          result.warnings.push(`Table '${schema.table}' exists but has no data`);
        }
      }
    } catch (error) {
      result.errors.push(`Failed to verify table '${schema.table}': ${error}`);
    }

    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
    results.push(result);
  }

  return {
    success: totalErrors === 0,
    results,
    summary: {
      tablesFound,
      tablesWithData,
      totalErrors,
      totalWarnings
    }
  };
}

/**
 * Test basic database operations
 */
export async function testDatabaseOperations(): Promise<{
  success: boolean;
  tests: Array<{
    name: string;
    success: boolean;
    error?: string;
  }>;
}> {
  const tests = [];

  // Test 1: Basic connection
  try {
    const { error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    tests.push({
      name: 'Database Connection',
      success: !error,
      error: error?.message
    });
  } catch (error) {
    tests.push({
      name: 'Database Connection',
      success: false,
      error: String(error)
    });
  }

  // Test 2: Authentication
  try {
    const { data, error } = await supabase.auth.getSession();
    tests.push({
      name: 'Authentication System',
      success: !error,
      error: error?.message
    });
  } catch (error) {
    tests.push({
      name: 'Authentication System',
      success: false,
      error: String(error)
    });
  }

  // Test 3: Products-Inventory Join
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        inventory!inner(current_stock)
      `)
      .limit(1);

    tests.push({
      name: 'Products-Inventory Relationship',
      success: !error && data && data.length >= 0,
      error: error?.message
    });
  } catch (error) {
    tests.push({
      name: 'Products-Inventory Relationship',
      success: false,
      error: String(error)
    });
  }

  // Test 4: Request workflow
  try {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        id,
        title,
        items:request_items(id, product_name)
      `)
      .limit(1);

    tests.push({
      name: 'Request-Items Relationship',
      success: !error,
      error: error?.message
    });
  } catch (error) {
    tests.push({
      name: 'Request-Items Relationship',
      success: false,
      error: String(error)
    });
  }

  const successCount = tests.filter(t => t.success).length;
  
  return {
    success: successCount === tests.length,
    tests
  };
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  tables: Record<string, number>;
  totalRecords: number;
}> {
  const stats: Record<string, number> = {};
  let totalRecords = 0;

  for (const schema of EXPECTED_SCHEMA) {
    try {
      const { count, error } = await supabase
        .from(schema.table)
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        stats[schema.table] = count;
        totalRecords += count;
      } else {
        stats[schema.table] = 0;
      }
    } catch (error) {
      stats[schema.table] = -1; // Indicates error
    }
  }

  return {
    tables: stats,
    totalRecords
  };
}