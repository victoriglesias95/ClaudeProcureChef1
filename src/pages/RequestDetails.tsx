import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import QuoteTracker from '../components/quotes/QuoteTracker';
import { getRequestById, approveRequest, rejectRequest } from '../services/requests';
import { getSuppliers } from '../services/suppliers';
import { Request } from '../types/request';
import { Supplier } from '../types/quote';
import { useAuth } from '../hooks/useAuth';

const RequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuoteTracker, setShowQuoteTracker] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const [requestData, suppliersData] = await Promise.all([
          getRequestById(id),
          getSuppliers()
        ]);
        
        setRequest(requestData);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load request details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `R$${amount.toFixed(2)}`;
  };

  const handleApprove = async () => {
    if (!request) return;
    
    try {
      const success = await approveRequest(request.id);
      if (success) {
        toast.success('Request approved successfully');
        // Refresh the request data
        const updatedRequest = await getRequestById(request.id);
        if (updatedRequest) {
          setRequest(updatedRequest);
        }
      } else {
        toast.error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!request) return;
    
    try {
      const success = await rejectRequest(request.id);
      if (success) {
        toast.success('Request rejected successfully');
        // Refresh the request data
        const updatedRequest = await getRequestById(request.id);
        if (updatedRequest) {
          setRequest(updatedRequest);
        }
      } else {
        toast.error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleEdit = () => {
    toast.info('Edit functionality coming soon!');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">Loading request details...</div>
      </MainLayout>
    );
  }

  if (!request) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-lg text-gray-500 mb-4">Request not found</p>
          <Button onClick={() => navigate('/requests')}>
            Back to Requests
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Check if user can approve/reject
  const canApprove = user?.role === 'admin' || user?.role === 'purchasing';
  const showActionButtons = canApprove && request.status === 'submitted';

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/requests')}
            >
              ← Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
          <p className="text-gray-600">Request #{request.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          {showActionButtons && (
            <>
              <Button variant="outline" onClick={handleReject}>
                Reject
              </Button>
              <Button variant="primary" onClick={handleApprove}>
                Approve
              </Button>
            </>
          )}
          {request.status === 'approved' && (
            <Button variant="primary" onClick={() => setShowQuoteTracker(true)}>
              Get Supplier Quotes
            </Button>
          )}
          <Button variant="outline" onClick={handleEdit}>
            Edit
          </Button>
        </div>
      </div>

      {/* Status and Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <StatusBadge status={request.status} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">Priority</p>
            <StatusBadge status={request.priority} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(request.total_amount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">User #{request.created_by}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created On</p>
              <p className="font-medium">{formatDate(request.created_at)}</p>
            </div>
            {request.needed_by && (
              <div>
                <p className="text-sm text-gray-500">Needed By</p>
                <p className="font-medium">{formatDate(request.needed_by)}</p>
              </div>
            )}
            {request.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-medium whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Request Items ({request.items.length})</CardTitle>
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
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-500">ID: {item.product_id}</p>
                    </td>
                    <td className="text-right py-3 px-4">{item.quantity}</td>
                    <td className="py-3 px-4">{item.unit}</td>
                    <td className="text-right py-3 px-4">
                      {item.price_per_unit > 0 
                        ? formatCurrency(item.price_per_unit)
                        : '-'
                      }
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {item.price_per_unit > 0 
                        ? formatCurrency(item.quantity * item.price_per_unit)
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="text-right py-3 px-4 font-medium">
                    Total Amount:
                  </td>
                  <td className="text-right py-3 px-4 font-bold text-lg">
                    {formatCurrency(request.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quote Tracker Modal */}
      <QuoteTracker
        isOpen={showQuoteTracker}
        onClose={() => setShowQuoteTracker(false)}
        request={request}
        onComplete={() => {
          navigate(`/quote-comparison?requestIds=${request.id}`);
        }}
      />
    </MainLayout>
  );
};

export default RequestDetails;