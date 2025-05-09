import React from 'react';
import { Card, CardContent } from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { Request } from '../../types/request';

interface RequestCardProps {
  request: Request;
  onViewDetails?: (requestId: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onViewDetails }) => {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 flex items-center justify-between border-b">
          <div>
            <h3 className="text-lg font-medium">{request.title}</h3>
            <p className="text-sm text-gray-500">
              Created on {formatDate(request.created_at)}
            </p>
          </div>
          <StatusBadge status={request.priority} />
        </div>
        <div className="p-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Status:</span>
            <StatusBadge status={request.status} />
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Items:</span>
            <span>{request.items.length}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Total:</span>
            <span className="font-medium">
              R${request.total_amount.toFixed(2)}
            </span>
          </div>
          {request.needed_by && (
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Needed by:</span>
              <span>{formatDate(request.needed_by)}</span>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button 
              size="sm" 
              onClick={() => onViewDetails && onViewDetails(request.id)}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;