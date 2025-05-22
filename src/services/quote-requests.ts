// src/services/quote-requests.ts
import { supabase } from './supabase';
import { QuoteRequest, QuoteRequestStatus } from '../types/quote';

/**
 * Get all quote requests
 */
export async function getQuoteRequests(): Promise<QuoteRequest[]> {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .order('sent_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching quote requests:', error);
    return [];
  }
}

/**
 * Get quote requests for a specific request
 */
export async function getQuoteRequestsForRequest(requestId: string): Promise<QuoteRequest[]> {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('request_id', requestId)
      .order('sent_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching quote requests for request ${requestId}:`, error);
    return [];
  }
}

/**
 * Create quote requests for selected suppliers
 */
export async function createQuoteRequestsForSuppliers(
  requestId: string, 
  supplierIds: string[]
): Promise<QuoteRequest[]> {
  try {
    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (requestError) throw requestError;
    
    if (!request) {
      throw new Error(`Request with ID ${requestId} not found`);
    }
    
    // Create quote requests for each supplier
    const quoteRequests: Omit<QuoteRequest, 'id'>[] = [];
    
    for (const supplierId of supplierIds) {
      // Get supplier details
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('name')
        .eq('id', supplierId)
        .single();
      
      if (supplierError) throw supplierError;
      
      if (!supplier) continue;
      
      // Calculate response deadline (7 days from now)
      const now = new Date();
      const deadline = new Date(now);
      deadline.setDate(now.getDate() + 7);
      
      quoteRequests.push({
        request_id: requestId,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        sent_at: now.toISOString(),
        status: 'pending',
        response_deadline: deadline.toISOString()
      });
    }
    
    // Insert quote requests
    if (quoteRequests.length > 0) {
      const { data, error } = await supabase
        .from('quote_requests')
        .insert(quoteRequests)
        .select();
      
      if (error) throw error;
      
      return data || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error creating quote requests:', error);
    throw error;
  }
}

/**
 * Update quote request status
 */
export async function updateQuoteRequestStatus(
  requestId: string, 
  status: QuoteRequestStatus,
  quoteId?: string
): Promise<boolean> {
  try {
    const updateData: any = { status };
    if (quoteId) {
      updateData.quote_id = quoteId;
    }
    
    const { error } = await supabase
      .from('quote_requests')
      .update(updateData)
      .eq('id', requestId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating quote request status for ${requestId}:`, error);
    return false;
  }
}

/**
 * Send a reminder for a quote request
 */
export async function sendQuoteRequestReminder(requestId: string): Promise<boolean> {
  try {
    // In a real app, this would also send an email or notification
    const { error } = await supabase
      .from('quote_requests')
      .update({
        sent_at: new Date().toISOString() // Update the sent time
      })
      .eq('id', requestId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error sending reminder for quote request ${requestId}:`, error);
    return false;
  }
}

/**
 * Cancel a quote request
 */
export async function cancelQuoteRequest(requestId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quote_requests')
      .update({
        status: 'expired'
      })
      .eq('id', requestId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error cancelling quote request ${requestId}:`, error);
    return false;
  }
}

/**
 * Get pending quote requests that are past deadline
 */
export async function getExpiredQuoteRequests(): Promise<QuoteRequest[]> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .in('status', ['pending', 'sent'])
      .lt('response_deadline', now);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching expired quote requests:', error);
    return [];
  }
}

/**
 * Auto-expire quote requests that are past deadline
 */
export async function autoExpireQuoteRequests(): Promise<number> {
  try {
    const expiredRequests = await getExpiredQuoteRequests();
    
    if (expiredRequests.length === 0) return 0;
    
    const { error } = await supabase
      .from('quote_requests')
      .update({ status: 'expired' })
      .in('id', expiredRequests.map(req => req.id));
    
    if (error) throw error;
    
    return expiredRequests.length;
  } catch (error) {
    console.error('Error auto-expiring quote requests:', error);
    return 0;
  }
}