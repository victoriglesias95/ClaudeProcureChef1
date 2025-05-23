import { supabase } from './supabase';
import { Request, RequestStatus } from '../types/request';

// Create a new request
export async function createRequest(requestData: Omit<Request, 'id' | 'created_at' | 'status'>): Promise<Request> {
  try {
    // Prepare request and items data
    const { items, ...requestInfo } = requestData;
    
    // Create the request
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .insert({
        title: requestInfo.title,
        created_by: requestInfo.created_by,
        needed_by: requestInfo.needed_by,
        priority: requestInfo.priority,
        notes: requestInfo.notes,
        status: 'submitted',
        total_amount: requestInfo.total_amount
      })
      .select()
      .single();
    
    if (requestError) throw requestError;
    
    // Create request items
    if (items && items.length > 0) {
      const requestItems = items.map(item => ({
        request_id: request.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        price_per_unit: item.price_per_unit
      }));
      
      const { error: itemsError } = await supabase
        .from('request_items')
        .insert(requestItems);
      
      if (itemsError) throw itemsError;
    }
    
    // Fetch the complete request with items
    const { data: completeRequest, error: fetchError } = await supabase
      .from('requests')
      .select(`
        *,
        items:request_items(*)
      `)
      .eq('id', request.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    return completeRequest;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
}

// Get all requests
export async function getRequests(): Promise<Request[]> {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        items:request_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching requests:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
}

// Get request by ID
export async function getRequestById(id: string): Promise<Request | null> {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        items:request_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching request:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching request:', error);
    return null;
  }
}

// Update request status
export async function updateRequestStatus(id: string, status: RequestStatus): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating request status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating request status:', error);
    return false;
  }
}

// Approve a request
export async function approveRequest(id: string): Promise<boolean> {
  try {
    const success = await updateRequestStatus(id, 'approved');
    if (success) {
      console.log(`Request ${id} approved successfully`);
    }
    return success;
  } catch (error) {
    console.error(`Error approving request ${id}:`, error);
    return false;
  }
}

// Reject a request
export async function rejectRequest(id: string): Promise<boolean> {
  try {
    const success = await updateRequestStatus(id, 'rejected');
    if (success) {
      console.log(`Request ${id} rejected successfully`);
    }
    return success;
  } catch (error) {
    console.error(`Error rejecting request ${id}:`, error);
    return false;
  }
}

// Update request details
export async function updateRequest(
  id: string, 
  updates: Partial<Omit<Request, 'id' | 'created_at' | 'items'>>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('requests')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating request:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating request:', error);
    return false;
  }
}

// Delete a request (and its items)
export async function deleteRequest(id: string): Promise<boolean> {
  try {
    // First delete request items
    const { error: itemsError } = await supabase
      .from('request_items')
      .delete()
      .eq('request_id', id);
    
    if (itemsError) throw itemsError;
    
    // Then delete the request
    const { error: requestError } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);
    
    if (requestError) throw requestError;
    
    return true;
  } catch (error) {
    console.error('Error deleting request:', error);
    return false;
  }
}