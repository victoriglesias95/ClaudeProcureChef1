// src/components/quotes/QuoteRequestsTable.tsx
import { useState } from 'react';
import { QuoteRequest } from '../../types/quote';
import Button from '../ui/Button';

interface QuoteRequestsTableProps {
  quoteRequests: QuoteRequest[];
  onSendReminder: (requestId: string) => void;
  onCancel: (requestId: string) => void;
  onViewQuote: (quoteId: string) => void;
}

const QuoteRequestsTable: React.FC<QuoteRequestsTableProps> = ({
  quoteRequests,
  onSendReminder,
  onCancel,
  onViewQuote
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'received' | 'expired'>('all');
  
  const filteredRequests = filter === 'all' 
    ? quoteRequests 
    : quoteRequests.filter(req => req.status === filter);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const getStatusBadge = (status: string) => {
    let classes = "px-2 py-1 text-xs font-medium rounded-full ";
    switch (status) {
      case 'pending':
        classes += "bg-yellow-100 text-yellow-800";
        break;
      case 'sent':
        classes += "bg-blue-100 text-blue-800";
        break;
      case 'received':
        classes += "bg-green-100 text-green-800";
        break;
      case 'expired':
        classes += "bg-red-100 text-red-800";
        break;
      default:
        classes += "bg-gray-100 text-gray-800";
    }
    return <span className={classes}>{status.toUpperCase()}</span>;
  };
  
  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="text-red-600">{Math.abs(diffDays)} days overdue</span>;
    if (diffDays === 0) return <span className="text-orange-600">Due today</span>;
    if (diffDays <= 2) return <span className="text-orange-600">{diffDays} days left</span>;
    return <span className="text-green-600">{diffDays} days left</span>;
  };
  
  return (
    <div>
      {/* Filter Controls */}
      <div className="flex space-x-2 mb-4">
        <button 
          className={`px-3 py-1 text-sm rounded-full ${filter === 'all' ? 'bg-gray-200' : 'bg-gray-100'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`px-3 py-1 text-sm rounded-full ${filter === 'pending' ? 'bg-yellow-200' : 'bg-yellow-50'}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`px-3 py-1 text-sm rounded-full ${filter === 'sent' ? 'bg-blue-200' : 'bg-blue-50'}`}
          onClick={() => setFilter('sent')}
        >
          Sent
        </button>
        <button 
          className={`px-3 py-1 text-sm rounded-full ${filter === 'received' ? 'bg-green-200' : 'bg-green-50'}`}
          onClick={() => setFilter('received')}
        >
          Received
        </button>
        <button 
          className={`px-3 py-1 text-sm rounded-full ${filter === 'expired' ? 'bg-red-200' : 'bg-red-50'}`}
          onClick={() => setFilter('expired')}
        >
          Expired
        </button>
      </div>
      
      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timeline
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No quote requests found matching the selected filter.
                </td>
              </tr>
            ) : (
              filteredRequests.map(request => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Request #{request.request_id.substring(0, 8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Sent on {formatDate(request.sent_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.supplier_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div>Deadline: {formatDate(request.response_deadline)}</div>
                      <div>{getDaysRemaining(request.response_deadline)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {request.status === 'received' ? (
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => request.quote_id && onViewQuote(request.quote_id)}
                      >
                        View Quote
                      </Button>
                    ) : request.status === 'expired' ? (
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onCancel(request.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onSendReminder(request.id)}
                        >
                          Send Reminder
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onCancel(request.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuoteRequestsTable;