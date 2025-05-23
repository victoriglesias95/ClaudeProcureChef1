import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { supabase } from '@/services/supabase';
import { Request } from '@/types/request';

interface QuoteTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request;
  onComplete: () => void;
}

const QuoteTracker: React.FC<QuoteTrackerProps> = ({
  isOpen,
  onClose,
  request,
  onComplete
}) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [trackedSuppliers, setTrackedSuppliers] = useState<Record<string, {
    contacted: boolean;
    contactedAt?: string;
    responded: boolean;
    prices: Record<string, number>;
    validityDays: number;
    notes: string;
  }>>({});

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      loadTracking();
    }
  }, [isOpen, request]);

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*');
    setSuppliers(data || []);
  };

  const loadTracking = async () => {
    // Load existing quote requests tracking
    const { data: quoteRequests } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('request_id', request.id);
    
    // Load existing quotes
    const { data: quotes } = await supabase
      .from('quotes')
      .select('*, items:quote_items(*)')
      .eq('request_id', request.id);
    
    // Build tracking state
    const tracking: typeof trackedSuppliers = {};
    suppliers.forEach(supplier => {
      const quoteRequest = quoteRequests?.find(qr => qr.supplier_id === supplier.id);
      const quote = quotes?.find(q => q.supplier_id === supplier.id);
      
      tracking[supplier.id] = {
        contacted: !!quoteRequest,
        contactedAt: quoteRequest?.sent_at,
        responded: !!quote,
        prices: {},
        validityDays: 30,
        notes: ''
      };
      
      // If quote exists, load prices
      if (quote) {
        const prices: Record<string, number> = {};
        quote.items.forEach((item: any) => {
          prices[item.product_id] = item.price_per_unit;
        });
        tracking[supplier.id].prices = prices;
        tracking[supplier.id].validityDays = quote.validity_days || 30;
      }
    });
    
    setTrackedSuppliers(tracking);
  };

  const generateQuoteMessage = () => {
    const itemsList = request.items.map(item => 
      `• ${item.product_name}: ${item.quantity} ${item.unit}`
    ).join('\n');
    
    const neededBy = request.needed_by 
      ? new Date(request.needed_by).toLocaleDateString() 
      : 'As soon as possible';
    
    return `Hello! We need a quote for the following items:

${itemsList}

Delivery needed by: ${neededBy}

Please send us your best prices and availability.

Thank you!`;
  };

  const sendEmail = async (supplier: any) => {
    const subject = encodeURIComponent(`Quote Request - ${request.title}`);
    const body = encodeURIComponent(generateQuoteMessage());
    const mailtoLink = `mailto:${supplier.email}?subject=${subject}&body=${body}`;
    
    // Open email client
    window.open(mailtoLink, '_blank');
    
    // Mark as contacted
    await markAsContacted(supplier.id);
  };

  const sendWhatsApp = async (supplier: any) => {
    // Format phone number for WhatsApp (remove spaces, dashes, etc)
    const phone = supplier.phone.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent(generateQuoteMessage());
    const whatsappLink = `https://wa.me/${phone}?text=${message}`;
    
    // Open WhatsApp
    window.open(whatsappLink, '_blank');
    
    // Mark as contacted
    await markAsContacted(supplier.id);
  };

  const markAsContacted = async (supplierId: string) => {
    try {
      // Create quote request record
      const responseDeadline = new Date();
      responseDeadline.setDate(responseDeadline.getDate() + 3); // 3 days deadline
      
      await supabase.from('quote_requests').insert({
        request_id: request.id,
        supplier_id: supplierId,
        supplier_name: suppliers.find(s => s.id === supplierId)?.name,
        sent_at: new Date().toISOString(),
        status: 'sent',
        response_deadline: responseDeadline.toISOString()
      });
      
      // Update local state
      setTrackedSuppliers(prev => ({
        ...prev,
        [supplierId]: {
          ...prev[supplierId],
          contacted: true,
          contactedAt: new Date().toISOString()
        }
      }));
      
      toast.success('Quote request sent and tracked');
    } catch (error) {
      console.error('Error tracking quote request:', error);
      toast.error('Failed to track quote request');
    }
  };

  const handleSaveQuote = async (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const tracking = trackedSuppliers[supplierId];
    
    // Validate all prices are entered
    const missingPrices = request.items.filter(item => 
      !tracking.prices[item.product_id] || tracking.prices[item.product_id] === 0
    );
    
    if (missingPrices.length > 0) {
      toast.error(`Please enter prices for: ${missingPrices.map(i => i.product_name).join(', ')}`);
      return;
    }

    try {
      // Calculate total
      const total = request.items.reduce((sum, item) => 
        sum + (tracking.prices[item.product_id] * item.quantity), 0
      );
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + tracking.validityDays);

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          request_id: request.id,
          supplier_id: supplierId,
          supplier_name: supplier.name,
          status: 'received',
          total_amount: total,
          validity_days: tracking.validityDays,
          expiry_date: expiryDate.toISOString(),
          notes: tracking.notes
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      const quoteItems = request.items.map(item => ({
        quote_id: quote.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        price_per_unit: tracking.prices[item.product_id],
        in_stock: true
      }));

      await supabase.from('quote_items').insert(quoteItems);

      // Update quote request status
      await supabase
        .from('quote_requests')
        .update({ status: 'received', quote_id: quote.id })
        .eq('request_id', request.id)
        .eq('supplier_id', supplierId);

      // Update local state
      setTrackedSuppliers(prev => ({
        ...prev,
        [supplierId]: {
          ...prev[supplierId],
          responded: true
        }
      }));

      toast.success(`Quote from ${supplier.name} saved successfully`);
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Failed to save quote');
    }
  };

  const respondedCount = Object.values(trackedSuppliers).filter(t => t.responded).length;
  const contactedCount = Object.values(trackedSuppliers).filter(t => t.contacted).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send & Track Quote Requests"
      maxWidth="xl"
      footer={
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Sent: {contactedCount} | Received: {respondedCount}
          </div>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                onComplete();
                onClose();
              }}
              disabled={respondedCount === 0}
            >
              Compare Prices ({respondedCount} quotes)
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            Click the email or WhatsApp button to send quote requests. 
            When suppliers respond, enter their prices below.
          </p>
        </div>

        {/* Supplier list */}
        <div className="space-y-3">
          {suppliers.map(supplier => {
            const tracking = trackedSuppliers[supplier.id];
            if (!tracking) return null;

            return (
              <div 
                key={supplier.id} 
                className={`border rounded-lg p-4 ${
                  tracking.responded ? 'border-green-300 bg-green-50' : 
                  tracking.contacted ? 'border-yellow-300 bg-yellow-50' : 
                  'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-lg">{supplier.name}</h4>
                    {tracking.contacted && tracking.contactedAt && (
                      <p className="text-sm text-gray-600">
                        Quote requested: {new Date(tracking.contactedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!tracking.contacted && (
                      <>
                        {supplier.email && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => sendEmail(supplier)}
                            leftIcon={
                              <span className="text-lg">📧</span>
                            }
                          >
                            Email
                          </Button>
                        )}
                        {supplier.phone && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => sendWhatsApp(supplier)}
                            leftIcon={
                              <span className="text-lg">💬</span>
                            }
                          >
                            WhatsApp
                          </Button>
                        )}
                      </>
                    )}
                    
                    {tracking.contacted && !tracking.responded && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-yellow-600">⏳ Awaiting response</span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => supplier.email ? sendEmail(supplier) : sendWhatsApp(supplier)}
                        >
                          Resend
                        </Button>
                      </div>
                    )}
                    
                    {tracking.responded && (
                      <span className="text-sm text-green-600 font-medium">✓ Quote received</span>
                    )}
                  </div>
                </div>

                {/* Contact info */}
                {!tracking.contacted && (
                  <div className="text-sm text-gray-600 mb-3">
                    {supplier.email && <div>📧 {supplier.email}</div>}
                    {supplier.phone && <div>📱 {supplier.phone}</div>}
                  </div>
                )}

                {/* Price entry section */}
                {tracking.contacted && !tracking.responded && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">Enter Received Prices:</h5>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm">Valid for:</label>
                        <input
                          type="number"
                          value={tracking.validityDays}
                          onChange={(e) => setTrackedSuppliers(prev => ({
                            ...prev,
                            [supplier.id]: {
                              ...prev[supplier.id],
                              validityDays: parseInt(e.target.value) || 30
                            }
                          }))}
                          className="w-16 p-1 border rounded text-center"
                          min="1"
                        />
                        <span className="text-sm">days</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {request.items.map(item => (
                        <div key={item.product_id} className="flex items-center justify-between">
                          <span className="text-sm">
                            {item.product_name} 
                            <span className="text-gray-500 ml-1">({item.quantity} {item.unit})</span>
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={tracking.prices[item.product_id] || ''}
                              onChange={(e) => setTrackedSuppliers(prev => ({
                                ...prev,
                                [supplier.id]: {
                                  ...prev[supplier.id],
                                  prices: {
                                    ...prev[supplier.id].prices,
                                    [item.product_id]: parseFloat(e.target.value) || 0
                                  }
                                }
                              }))}
                              placeholder="0.00"
                              className="w-20 p-1 border rounded text-right"
                            />
                            <span className="text-sm text-gray-500">/{item.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <textarea
                      placeholder="Notes (delivery terms, special conditions, etc.)"
                      value={tracking.notes}
                      onChange={(e) => setTrackedSuppliers(prev => ({
                        ...prev,
                        [supplier.id]: {
                          ...prev[supplier.id],
                          notes: e.target.value
                        }
                      }))}
                      className="w-full p-2 border rounded text-sm mb-3"
                      rows={2}
                    />

                    <Button 
                      size="sm" 
                      variant="primary"
                      onClick={() => handleSaveQuote(supplier.id)}
                      fullWidth
                    >
                      Save Quote
                    </Button>
                  </div>
                )}

                {/* Show saved quote summary */}
                {tracking.responded && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">
                        R${request.items.reduce((sum, item) => 
                          sum + (tracking.prices[item.product_id] * item.quantity), 0
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Valid until:</span>
                      <span>{new Date(Date.now() + tracking.validityDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                    {tracking.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {tracking.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* No contact info warning */}
                {!supplier.email && !supplier.phone && (
                  <div className="text-sm text-red-600 mt-2">
                    ⚠️ No contact information available. 
                    <Button 
                      size="sm" 
                      variant="link"
                      onClick={() => window.open(`/suppliers/${supplier.id}`, '_blank')}
                    >
                      Add contact info
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {suppliers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No suppliers found.</p>
            <p className="text-sm mt-2">Add suppliers first to send quote requests.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QuoteTracker;