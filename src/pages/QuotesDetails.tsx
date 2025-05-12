import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { getQuoteById, acceptQuote, rejectQuote } from '../services/quotes';
import { SupplierQuote } from '../types/quote';
import { getQuoteValidityStatus, isQuoteValid } from '../utils/quoteUtils';

const QuoteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<SupplierQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadQuote = async () => {
      if (!id) return;
      
      try {
        const data = await getQuoteById(id);
        setQuote(data);
      } catch (error) {
        console.error('Failed to load quote:', error);
        toast.error('Failed to load quote details');
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `R$${amount.toFixed(2)}`;
  };

  const handleAccept = async () => {
    if (!quote) return;
    
    setProcessing(true);
    try {
      await acceptQuote(quote.id);
      toast.success('Quote accepted successfully');
      navigate('/quotes');
    } catch (error) {
      console.error('Failed to accept quote:', error);
      toast.error('Failed to accept quote');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!quote) return;
    
    setProcessing(true);
    try {
      await rejectQuote(quote.id);
      toast.success('Quote rejected successfully');
      navigate('/quotes');
    } catch (error) {
      console.error('Failed to reject quote:', error);
      toast.error('Failed to reject quote');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateOrder = () => {
    if (!quote) return;
    navigate(`/quote-comparison?quoteId=${quote.id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">Loading quote details...</div>
      </MainLayout>
    );
  }

  if (!quote) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-lg text-gray-500 mb-4">Quote not found</p>
          <Button onClick={() => navigate('/quotes')}>
            Back to Quotes
          </Button>
        </div>
      </MainLayout>
    );
  }

  const validityStatus = getQuoteValidityStatus(quote);
  const isValid = isQuoteValid(quote);

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/quotes')}
            >
              ← Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Details</h1>
          <p className="text-gray-600">Quote #{quote.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          {quote.status === 'received' && isValid && (
            <>
              <Button 
                variant="outline" 
                onClick={handleReject}
                disabled={processing}
              >
                Reject Quote
              </Button>
              <Button 
                variant="primary" 
                onClick={handleAccept}
                isLoading={processing}
              >
                Accept Quote
              </Button>
            </>
          )}
          {quote.status === 'approved' && (
            <Button 
              variant="primary" 
              onClick={handleCreateOrder}
            >
              Create Order
            </Button>
          )}
        </div>
      </div>

      {/* Status and Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <StatusBadge status={quote.status as any} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">Validity</p>
            <div className={`font-medium ${validityStatus.color}`}>
              {validityStatus.text}
            </div>
            {quote.is_blanket_quote && (
              <span className="text-xs text-blue-600">Blanket Quote</span>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(quote.total_amount)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">Items</p>
            <p className="text-lg font-semibold">{quote.items.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Supplier Name</p>
              <p className="font-medium">{quote.supplier_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Quote Date</p>
              <p className="font-medium">{formatDate(quote.created_at)}</p>
            </div>
            {quote.expiry_date && (
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="font-medium">{formatDate(quote.expiry_date)}</p>
              </div>
            )}
            {quote.delivery_date && (
              <div>
                <p className="text-sm text-gray-500">Expected Delivery</p>
                <p className="font-medium">{formatDate(quote.delivery_date)}</p>
              </div>
            )}
            {quote.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-medium">{quote.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quote Items */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Quantity</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Unit</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Price/Unit</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">In Stock</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4">
                      <p className="font-medium">{item.product_name}</p>
                      {item.supplier_product_code && (
                        <p className="text-sm text-gray-500">Code: {item.supplier_product_code}</p>
                      )}
                    </td>
                    <td className="text-right py-3 px-4">{item.quantity}</td>
                    <td className="py-3 px-4">{item.unit}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(item.price_per_unit)}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        item.in_stock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.in_stock ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatCurrency(item.quantity * item.price_per_unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="text-right py-3 px-4 font-medium">
                    Total Amount:
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-lg">
                    {formatCurrency(quote.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default QuoteDetails;