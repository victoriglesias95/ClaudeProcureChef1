import { supabase } from './supabase';
import { Request, RequestItem } from '../types/request';

// Mock data flag - consistent with other services
const USE_MOCK_DATA = true; 

// Mock requests for development
const mockRequests: Request[] = [];

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Create a new request
export async function createRequest(requestData: Omit<Request, 'id' | 'created_at' | 'status'>): Promise<Request> {
  const newRequest: Request = {
    id: generateId(),
    created_at: new Date().toISOString(),
    status: 'submitted',
    ...requestData,
  };
  
  if (USE_MOCK_DATA) {
    // Add to mock data
    mockRequests.push(newRequest);
    return newRequest;
  }
  
  try {
    // Would insert into Supabase in a real implementation
    const { data, error } = await supabase
      .from('requests')
      .insert(newRequest)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating request:', error);
      throw error;
    }
    
    return data;
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
      .select('*')
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
      .select('*')
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