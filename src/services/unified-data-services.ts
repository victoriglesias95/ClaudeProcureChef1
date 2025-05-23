// src/services/unified-data-service.ts
import { supabase } from './supabase';

// Generic CRUD operations for any table
class DataService<T extends Record<string, any>> {
  constructor(private tableName: string) {}

  async getAll(options?: {
    select?: string;
    order?: { column: string; ascending?: boolean };
    filters?: Array<{ column: string; operator: string; value: any }>;
  }): Promise<T[]> {
    try {
      let query = supabase.from(this.tableName).select(options?.select || '*');
      
      if (options?.filters) {
        options.filters.forEach(filter => {
          query = query.filter(filter.column, filter.operator, filter.value);
        });
      }
      
      if (options?.order) {
        query = query.order(options.order.column, { 
          ascending: options.order.ascending ?? false 
        });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data as T[]) || [];
    } catch (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      return [];
    }
  }

  async getById(id: string, select?: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(select || '*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as T;
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error);
      return null;
    }
  }

  async create(item: Partial<T>): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data as T;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      return null;
    }
  }

  async update(id: string, updates: Partial<T>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return false;
    }
  }
}

// Define proper types for the services
interface Product {
  id: string;
  name: string;
  category: string;
  default_unit: string;
  created_at: string;
}

interface InventoryItem extends Product {
  current_stock: number;
  stock_level: 'low' | 'medium' | 'high';
  last_updated: string;
  last_counted_at?: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  contact?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

interface Order {
  id: string;
  number: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  total: number;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

interface Request {
  id: string;
  title: string;
  created_by: string;
  status: string;
  priority: string;
  created_at: string;
  total_amount: number;
}

interface Quote {
  id: string;
  supplier_id: string;
  supplier_name: string;
  request_id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

// Specialized services using the generic base
export const productsService = new DataService<Product>('products');
export const inventoryService = new DataService<InventoryItem>('inventory');
export const suppliersService = new DataService<Supplier>('suppliers');
export const ordersService = new DataService<Order>('orders');
export const requestsService = new DataService<Request>('requests');
export const quotesService = new DataService<Quote>('quotes');

// Complex operations that need custom logic
export const procurementService = {
  // Get products with inventory data
  async getProductsWithInventory(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          inventory!inner (
            current_stock,
            stock_level,
            last_updated,
            last_counted_at
          )
        `)
        .order('name');
      
      if (error) throw error;
      
      return data?.map((product: any) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        default_unit: product.default_unit,
        created_at: product.created_at,
        current_stock: product.inventory.current_stock || 0,
        stock_level: product.inventory.stock_level || 'low',
        last_updated: product.inventory.last_updated || new Date().toISOString(),
        last_counted_at: product.inventory.last_counted_at
      })) || [];
    } catch (error) {
      console.error('Error getting products with inventory:', error);
      return [];
    }
  },

  // Create request with items
  async createRequestWithItems(request: Partial<Request>, requestItems: any[]): Promise<Request | null> {
    try {
      const createdRequest = await requestsService.create(request);
      if (!createdRequest) throw new Error('Failed to create request');
      
      const itemsWithRequestId = requestItems.map(item => ({
        ...item,
        request_id: createdRequest.id
      }));
      
      const { error } = await supabase
        .from('request_items')
        .insert(itemsWithRequestId);
      
      if (error) throw error;
      
      return createdRequest;
    } catch (error) {
      console.error('Error creating request with items:', error);
      throw error;
    }
  },

  // Get quote comparison data
  async getQuoteComparison(requestIds: string[]) {
    const requests = await requestsService.getAll({
      select: `*, items:request_items(*)`,
      filters: requestIds.length > 0 
        ? [{ column: 'id', operator: 'in', value: requestIds }]
        : []
    });
    
    const quotes = await quotesService.getAll({
      select: `*, items:quote_items(*)`,
      filters: requestIds.length > 0
        ? [{ column: 'request_id', operator: 'in', value: requestIds }]
        : []
    });
    
    return { requests, quotes };
  },

  // Create orders from selections
  async createOrdersFromSelections(selections: Array<{
    productId: string;
    supplierId: string;
    quantity: number;
  }>): Promise<Order[]> {
    // Group by supplier
    const supplierGroups = selections.reduce((acc, sel) => {
      if (!acc[sel.supplierId]) acc[sel.supplierId] = [];
      acc[sel.supplierId].push(sel);
      return acc;
    }, {} as Record<string, typeof selections>);
    
    const orders: Order[] = [];
    
    for (const [supplierId, supplierSelections] of Object.entries(supplierGroups)) {
      const supplier = await suppliersService.getById(supplierId);
      if (!supplier) continue;
      
      const order = await ordersService.create({
        number: `PO-${Date.now()}`,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        status: 'draft',
        total: 0,
        items: [] // Add empty items array to satisfy type
      });
      
      if (order) {
        orders.push(order);
        // Add order items logic here if needed
      }
    }
    
    return orders;
  }
};

// Real-time subscriptions
export const subscriptions = {
  subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();
  },
  
  unsubscribe(subscription: any) {
    subscription.unsubscribe();
  }
};