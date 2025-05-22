// src/services/suppliers.ts
import { supabase } from './supabase';
import { Supplier } from '../types/quote';

/**
 * Get all suppliers
 */
export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

/**
 * Get a supplier by ID
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching supplier ${id}:`, error);
    return null;
  }
}

/**
 * Create a new supplier
 */
export async function createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier | null> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating supplier:', error);
    return null;
  }
}

/**
 * Update supplier information
 */
export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating supplier ${id}:`, error);
    return false;
  }
}

/**
 * Delete a supplier
 */
export async function deleteSupplier(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting supplier ${id}:`, error);
    return false;
  }
}

/**
 * Get suppliers that carry a specific product
 */
export async function getSuppliersForProduct(productId: string): Promise<Supplier[]> {
  try {
    const { data, error } = await supabase
      .from('supplier_products')
      .select(`
        supplier:supplier_id (
          id,
          name,
          contact,
          email,
          phone,
          address,
          payment_terms,
          delivery_days,
          minimum_order,
          notes
        )
      `)
      .eq('product_id', productId)
      .eq('available', true);
    
    if (error) throw error;
    
    if (!data) return [];
    
    // Extract unique suppliers with proper typing
    const supplierMap = new Map<string, Supplier>();
    
    data.forEach((item: any) => {
      if (item.supplier && item.supplier.id) {
        const supplier: Supplier = {
          id: item.supplier.id,
          name: item.supplier.name,
          contact: item.supplier.contact,
          email: item.supplier.email,
          phone: item.supplier.phone,
          address: item.supplier.address,
          paymentTerms: item.supplier.payment_terms,
          deliveryDays: item.supplier.delivery_days,
          minimumOrder: item.supplier.minimum_order,
          notes: item.supplier.notes
        };
        supplierMap.set(supplier.id, supplier);
      }
    });
    
    return Array.from(supplierMap.values());
  } catch (error) {
    console.error(`Error fetching suppliers for product ${productId}:`, error);
    return [];
  }
}