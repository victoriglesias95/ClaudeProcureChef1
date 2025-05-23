// src/pages/Quotes.tsx - PERFORMANCE IMPROVED
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import QuoteRequestsTable from '../components/quotes/QuoteRequestsTable';
import { getQuoteComparisons } from '../services/comparisons';
import { getSuppliers } from '../services/suppliers';
import { 
  getQuoteRequests,
  sendQuoteRequestReminder,
  cancelQuoteRequest
} from '../services/quote-requests';
import { Supplier, QuoteComparison, QuoteRequest } from '../types/quote';

const Quotes = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'requests' | 'comparisons'>(
    searchParams.get('tab') === 'comparisons' ? 'comparisons' : 'requests'
  );
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [comparisons, setComparisons] = useState<QuoteComparison[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Define loadData function outside useEffect so handlers can use it
  const loadData = async () => {
    try {
      setLoading(true);
      const [suppliersData, comparisonsData, requestsData] = await Promise.all([
        getSuppliers(),
        getQuoteComparisons(),
        getQuoteRequests()
      ]);
      
      setSuppliers(suppliersData);
      setComparisons(comparisonsData);
      setQuoteRequests(requestsData);
    } catch (error) {
      console.error('Failed to load quotes data:', error);
      toast.error('Failed to load quotes data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // PERFORMANCE IMPROVED: Reduced polling from 5 seconds to 30 seconds
    // This reduces server load and improves user experience
    const intervalId = setInterval(loadData, 30000); // Changed from 5000 to 30000
    return () => clearInterval(intervalId);
  }, []);

  const formatCurrency = (amount: number) => {
    return `R$${amount.toFixed(2)}`;
  };

  const handleCompare = () => {
    navigate('/quote-comparison');
  };
  
  const handleSendReminder = (requestId: string) => {
    sendQuoteRequestReminder(requestId)
      .then(() => {
        toast.success(`Reminder sent for quote request ${requestId}`);
        loadData();
      })
      .catch(error => {
        console.error('Error sending reminder:', error);
        toast.error('Failed to send reminder');
      });
  };
  
  const handleCancelRequest = (requestId: string) => {
    cancelQuoteRequest(requestId)
      .then(() => {
        toast.success(`Quote request ${requestId} cancelled`);
        loadData();
      })
      .catch(error => {
        console.error('Error cancelling request:', error);
        toast.error('Failed to cancel request');
      });
  };
  
  const handleViewQuote = (quoteId: string) => {
    navigate(`/quotes/${quoteId}`);
  };

  // Calculate statistics
  const pendingRequests = quoteRequests.filter(req => req.status === 'pending' || req.status === 'sent').length;
  const receivedQuotes = quoteRequests.filter(req => req.status === 'received').length;
  // Remove unused totalQuotes variable to fix TypeScript error

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600">Track quote requests and compare prices</p>
        </div>
        <Button variant="primary" onClick={handleCompare}>
          Compare Prices
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Pending Requests</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingRequests}</p>
            <p className="text-sm text-gray-600 mt-1">Awaiting supplier response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Received Quotes</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{receivedQuotes}</p>
            <p className="text-sm text-gray-600 mt-1">Ready for comparison</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Suppliers</h3>
            <p className="text-3xl font-bold text-primary mt-2">{suppliers.length}</p>
            <p className="text-sm text-gray-600 mt-1">Available for quotes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'requests'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          Quote Requests
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'comparisons'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('comparisons')}
        >
          Quote Comparisons
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading quotes data...</div>
      ) : (
        <>
          {/* Quote Requests Tab */}
          {activeTab === 'requests' && (
            <Card>
              <CardHeader>
                <CardTitle>Quote Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {quoteRequests.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">
                    No quote requests found. Generate quotes from approved requests.
                  </p>
                ) : (
                  <QuoteRequestsTable 
                    quoteRequests={quoteRequests}
                    onSendReminder={handleSendReminder}
                    onCancel={handleCancelRequest}
                    onViewQuote={handleViewQuote}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Quote Comparisons Tab */}
          {activeTab === 'comparisons' && (
            <Card>
              <CardHeader>
                <CardTitle>Quote Comparisons</CardTitle>
              </CardHeader>
              <CardContent>
                {comparisons.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">
                    No quote comparisons yet. Wait for suppliers to respond to your quote requests.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comparisons.slice(0, 3).map((comparison) => (
                      <div 
                        key={comparison.id} 
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{comparison.request.title}</h4>
                            <p className="text-sm text-gray-500">
                              {comparison.supplier_quotes.length} quotes • 
                              Created {new Date(comparison.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            comparison.status === 'open' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {comparison.status.toUpperCase()}
                          </span>
                        </div>
                        
                        {/* Quote list with links */}
                        <div className="space-y-2">
                          {comparison.supplier_quotes.map((quote) => (
                            <div key={quote.id} className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="font-medium">{quote.supplier_name}</span>
                                <span className="text-gray-500 ml-2">
                                  {formatCurrency(quote.total_amount)}
                                </span>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/quotes/${quote.id}`)}
                              >
                                View Details
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <Button onClick={handleCompare}>
                    View All Comparisons
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default Quotes;