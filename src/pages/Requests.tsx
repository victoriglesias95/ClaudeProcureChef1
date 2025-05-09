import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import RequestCard from '../components/requests/RequestCard';
import { getRequests } from '../services/requests';
import { Request } from '../types/request';

const Requests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await getRequests();
        setRequests(data);
      } catch (error) {
        console.error('Failed to load requests:', error);
        toast.error('Failed to load request data');
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  const handleViewDetails = (requestId: string) => {
    // This will be implemented in the future
    console.log('View details for request:', requestId);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
          <p className="text-gray-600">Manage your ingredient requests</p>
        </div>
        <Button>New Request</Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-lg text-gray-500 mb-4">No requests found</p>
            <p className="text-gray-400 mb-6">
              Start by creating a request from the inventory page
            </p>
            <Button variant="primary" onClick={() => window.location.href = '/inventory'}>
              Go to Inventory
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard 
              key={request.id} 
              request={request} 
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default Requests;