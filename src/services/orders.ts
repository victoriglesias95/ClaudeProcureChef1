// src/services/orders.ts
import { supabase } from './supabase';
import { Order } from '../types/quote';

/**
 * Get all orders
 */
export async function getOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

/**
 * Get an order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }
}

/**
 * Create orders from product selections
 */
export async function createOrdersFromProductSelections(
  selections: {productId: string, supplierId: string, quantity: number}[]
): Promise<{id: string, supplierId: string, supplierName: string, orderNumber: string}[]> {
  try {
    // Group selections by supplier
    const supplierSelections = new Map<string, {productId: string, quantity: number}[]>();
    
    selections.forEach(selection => {
      if (!supplierSelections.has(selection.supplierId)) {
        supplierSelections.set(selection.supplierId, []);
      }
      
      supplierSelections.get(selection.supplierId)!.push({
        productId: selection.productId,
        quantity: selection.quantity
      });
    });
    
    // Create an order for each supplier
    const orders: {id: string, supplierId: string, supplierName: string, orderNumber: string}[] = [];
    
    for (const [supplierId, productSelections] of supplierSelections.entries()) {
      // Get supplier details
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', supplierId)
        .single();
      
      if (supplierError) throw supplierError;
      if (!supplier) continue;
      
      // Generate order number
      const orderNumber = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // Prepare order
      const orderData = {
        number: orderNumber,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        status: 'draft',
        total: 0 // Will be updated after items
      };
      
      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Process order items
      const orderItems = [];
      let orderTotal = 0;
      
      for (const selection of productSelections) {
        // Get product details and supplier price
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('name, default_unit, sku')
          .eq('id', selection.productId)
          .single();
        
        if (productError) throw productError;
        if (!product) continue;
        
        // Get supplier_product details
        const { data: supplierProduct, error: spError } = await supabase
          .from('supplier_products')
          .select('price, supplier_product_code')
          .eq('supplier_id', supplierId)
          .eq('product_id', selection.productId)
          .single();
        
        if (spError) {
          console.warn(`No supplier product found for ${selection.productId} from ${supplierId}`);
          continue;
        }
        
        const price = supplierProduct?.price || 0;
        const total = price * selection.quantity;
        
        orderItems.push({
          order_id: order.id,
          product_id: selection.productId,
          product_name: product.name,
          quantity: selection.quantity,
          unit: product.default_unit,
          price: price,
          total: total,
          sku: product.sku,
          supplier_product_code: supplierProduct?.supplier_product_code
        });
        
        orderTotal += total;
      }
      
      // Insert order items
      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) throw itemsError;
      }
      
      // Update order total
      const { error: updateError } = await supabase
        .from('orders')
        .update({ total: orderTotal })
        .eq('id', order.id);
      
      if (updateError) throw updateError;
      
      orders.push({
        id: order.id,
        supplierId,
        supplierName: supplier.name,
        orderNumber
      });
    }
    
    return orders;
  } catch (error) {
    console.error('Error creating orders from selections:', error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating order status for ${orderId}:`, error);
    return false;
  }
}

/**
 * Receive order and update inventory
 */
export async function receiveOrder(
  orderId: string, 
  receivedItems: Record<string, number>,
  notes: Record<string, string> = {}
): Promise<boolean> {
  try {
    // 1. Update order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId);
    
    if (orderError) throw orderError;
    
    // 2. Update inventory quantities
    for (const [itemId, quantity] of Object.entries(receivedItems)) {
      // Get order item details
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('id', itemId)
        .single();
      
      if (itemError) throw itemError;
      
      // Get current inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('current_stock')
        .eq('product_id', orderItem.product_id)
        .single();
      
      if (inventoryError) throw inventoryError;
      
      // Calculate new stock level
      const newStock = (inventory?.current_stock || 0) + quantity;
      const stockLevel = newStock <= 5 ? 'low' : newStock <= 20 ? 'medium' : 'high';
      
      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          current_stock: newStock,
          stock_level: stockLevel,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', orderItem.product_id);
      
      if (updateError) throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Error receiving order:', error);
    return false;
  }
}