import { supabase } from './supabase';
import { Request, RequestItem } from '../types/request';

// Mock data flag - consistent with other services
const USE_MOCK_DATA = false; 

// Mock requests for development
const mockRequests: Request[] = [];

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Create a new request
export async function createRequest(requestData: Omit<Request, 'id' | 'created_at' | 'status'>): Promise<Request> {
  if (USE_MOCK_DATA) {
    const newRequest: Request = {
      id: generateId(),
      created_at: new Date().toISOString(),
      status: 'submitted',
      ...requestData,
    };
    
    // Add to mock data
    mockRequests.push(newRequest);
    return newRequest;
  }
  
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
  if (USE_MOCK_DATA) {
    return [...mockRequests];
  }
  
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
  if (USE_MOCK_DATA) {
    return mockRequests.find(request => request.id === id) || null;
  }
  
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
export async function updateRequestStatus(id: string, status: Request['status']): Promise<boolean> {
  if (USE_MOCK_DATA) {
    const requestIndex = mockRequests.findIndex(req => req.id === id);
    if (requestIndex !== -1) {
      mockRequests[requestIndex].status = status;
      return true;
    }
    return false;
  }
  
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