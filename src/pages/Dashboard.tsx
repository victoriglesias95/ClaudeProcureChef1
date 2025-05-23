import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getRequests } from '../services/requests';
import { getQuoteComparisons } from '../services/comparisons';
import { getOrders } from '../services/orders';
import { Request } from '../types/request';
import { QuoteComparison, Order } from '../types/quote';

const Dashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [quoteComparisons, setQuoteComparisons] = useState<QuoteComparison[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [requestsData, comparisonsData, ordersData] = await Promise.all([
          getRequests(),
          getQuoteComparisons(),
          getOrders()
        ]);
        
        setRequests(requestsData);
        setQuoteComparisons(comparisonsData);
        setOrders(ordersData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);
  
  // Calculate dashboard metrics
  const pendingRequests = requests.filter(r => r.status === 'submitted').length;
  const activeQuotes = quoteComparisons.filter(q => q.status === 'open').length;
  const recentOrders = orders.slice(0, 3);
  
  // Find approved requests that don't have orders
  const unorderedRequests = requests.filter(request => {
    if (request.status !== 'approved') return false;
    
    // Check if this request has been converted to an order
    const hasOrder = orders.some(order => 
      order.items.some(item => 
        request.items.some(reqItem => reqItem.product_id === item.productId)
      )
    );
    
    return !hasOrder;
  });
  
  // Find requests needing attention (needed_by date is soon)
  const urgentRequests = unorderedRequests.filter(request => {
    if (!request.needed_by) return false;
    const daysUntilNeeded = Math.ceil((new Date(request.needed_by).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilNeeded <= 3 && daysUntilNeeded >= 0;
  });
  
  const handleViewRequests = () => navigate('/requests');
  const handleViewQuotes = () => navigate('/quotes');
  const handleViewOrders = () => navigate('/orders');

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">Loading dashboard...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to ProcureChef</p>
      </div>
      
      {/* Alert for unordered requests */}
      {urgentRequests.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>{urgentRequests.length} approved request{urgentRequests.length > 1 ? 's' : ''}</strong> need{urgentRequests.length === 1 ? 's' : ''} to be ordered soon!
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                These items are needed within the next 3 days.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => navigate('/requests')}
              >
                View Urgent Requests
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{pendingRequests}</div>
            <p className="text-sm text-gray-600 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Approved (Not Ordered)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{unorderedRequests.length}</div>
            <p className="text-sm text-gray-600 mt-1">Need to create orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeQuotes}</div>
            <p className="text-sm text-gray-600 mt-1">Awaiting decisions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{orders.length}</div>
            <p className="text-sm text-gray-600 mt-1">Total orders placed</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Unordered Requests Section */}
      {unorderedRequests.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Approved Requests Not Yet Ordered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unorderedRequests.map(request => (
                <div key={request.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{request.title}</h4>
                    <p className="text-sm text-gray-600">
                      {request.items.length} items • 
                      {request.needed_by && (
                        <span className="text-yellow-600">
                          {' '}Needed by {new Date(request.needed_by).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => navigate(`/quote-comparison?requestIds=${request.id}`)}
                  >
                    Process Order
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Vegetables</span>
                <span className="text-green-600">Good</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Meat</span>
                <span className="text-yellow-600">Low</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Dairy</span>
                <span className="text-red-600">Critical</span>
              </div>
            </div>
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={() => navigate('/inventory')}>
                View Inventory
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentOrders.map(order => (
                <div key={order.id} className="text-sm">
                  <div className="font-medium">Order #{order.number}</div>
                  <div className="text-gray-600">
                    {order.supplierName} • {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={handleViewOrders}>
                View All Orders
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={handleViewRequests} fullWidth variant="outline">
                View Requests
              </Button>
              <Button onClick={handleViewQuotes} fullWidth variant="outline">
                View Quotes
              </Button>
              <Button onClick={() => navigate('/inventory')} fullWidth variant="primary">
                Create Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;