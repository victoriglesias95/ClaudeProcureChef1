// src/pages/Orders.tsx - WITH RECEIVING INTEGRATION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ReceiveOrderForm from '../components/receiver/ReceiveOrderForm';
import { getOrders, updateOrderStatus } from '../services/orders';
import { Order } from '../types/quote';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: State for receiving modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [orderToReceive, setOrderToReceive] = useState<Order | null>(null);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `R$${amount.toFixed(2)}`;
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const OrderStatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeStyle(status)}`}>
      {status.toUpperCase()}
    </span>
  );

  const handleViewOrderDetails = (orderId: string) => {
    // Navigate to order details page (to be implemented)
    navigate(`/orders/${orderId}`);
  };

  const handleSubmitOrder = async (orderId: string) => {
    try {
      const success = await updateOrderStatus(orderId, 'submitted');
      if (success) {
        toast.success('Order submitted successfully');
        // Reload orders to show updated status
        loadOrders();
      } else {
        toast.error('Failed to submit order');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to submit order');
    }
  };

  // NEW: Handle receiving order
  const handleReceiveOrder = (order: Order) => {
    setOrderToReceive(order);
    setIsReceiveModalOpen(true);
  };

  // NEW: Handle order received successfully
  const handleOrderReceived = () => {
    // Reload orders to show updated status
    loadOrders();
    setOrderToReceive(null);
  };

  // NEW: Close receiving modal
  const handleCloseReceiveModal = () => {
    setIsReceiveModalOpen(false);
    setOrderToReceive(null);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Track and manage purchase orders</p>
        </div>
        {orders.length > 0 && (
          <Button 
            onClick={() => toast.info('Export functionality coming soon!')}
          >
            Export Orders
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading orders...</div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-lg text-gray-500 mb-4">No orders found</p>
            <p className="text-gray-400 mb-6">
              Create orders by selecting suppliers in the quote comparison view
            </p>
            <Button variant="primary" onClick={() => window.location.href = '/quote-comparison'}>
              Go to Quote Comparison
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.number}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Supplier: {order.supplierName}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivery Date</p>
                    <p className="font-medium">
                      {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <p className="font-medium">{order.items.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-gray-500 ml-2">x{item.quantity} {item.unit}</span>
                        </div>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-500">
                        ...and {order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons - ENHANCED */}
                <div className="flex justify-end items-center mt-4 pt-4 border-t">
                  <div className="space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewOrderDetails(order.id)}
                    >
                      View Details
                    </Button>
                    
                    {/* Submit Order Button */}
                    {order.status === 'draft' && (
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => handleSubmitOrder(order.id)}
                      >
                        Submit Order
                      </Button>
                    )}
                    
                    {/* NEW: Receive Order Button */}
                    {(order.status === 'submitted' || order.status === 'confirmed' || order.status === 'shipped') && (
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={() => handleReceiveOrder(order)}
                      >
                        Receive Order
                      </Button>
                    )}
                    
                    {/* Order Status Indicator */}
                    {order.status === 'delivered' && (
                      <span className="text-sm text-green-600 font-medium">
                        ✅ Received
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* NEW: Receive Order Modal */}
      <ReceiveOrderForm
        isOpen={isReceiveModalOpen}
        onClose={handleCloseReceiveModal}
        order={orderToReceive}
        onOrderReceived={handleOrderReceived}
      />
    </MainLayout>
  );
};

export default Orders;