// src/services/unified-data-service.ts
import { supabase } from './supabase';

// Generic CRUD operations for any table
class DataService<T> {
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
      return data || [];
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
      return data;
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
      return data;
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

// Specialized services using the generic base
export const productsService = new DataService<any>('products');
export const inventoryService = new DataService<any>('inventory');
export const suppliersService = new DataService<any>('suppliers');
export const ordersService = new DataService<any>('orders');
export const requestsService = new DataService<any>('requests');
export const quotesService = new DataService<any>('quotes');

// Complex operations that need custom logic
export const procurementService = {
  // Get products with inventory data
  async getProductsWithInventory() {
    return productsService.getAll({
      select: `
        *,
        inventory!inner (
          current_stock,
          stock_level,
          last_updated,
          last_counted_at
        )
      `,
      order: { column: 'name', ascending: true }
    });
  },

  // Create request with items
  async createRequestWithItems(request: any, items: any[]) {
    try {
      const createdRequest = await requestsService.create(request);
      if (!createdRequest) throw new Error('Failed to create request');
      
      const requestItems = items.map(item => ({
        ...item,
        request_id: createdRequest.id
      }));
      
      const { error } = await supabase
        .from('request_items')
        .insert(requestItems);
      
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
  async createOrdersFromSelections(selections: any[]) {
    // Group by supplier
    const supplierGroups = selections.reduce((acc, sel) => {
      if (!acc[sel.supplierId]) acc[sel.supplierId] = [];
      acc[sel.supplierId].push(sel);
      return acc;
    }, {});
    
    const orders = [];
    
    for (const [supplierId, items] of Object.entries(supplierGroups)) {
      const supplier = await suppliersService.getById(supplierId);
      if (!supplier) continue;
      
      const order = await ordersService.create({
        number: `PO-${Date.now()}`,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        status: 'draft',
        total: 0
      });
      
      if (order) {
        orders.push(order);
        // Add order items logic here
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