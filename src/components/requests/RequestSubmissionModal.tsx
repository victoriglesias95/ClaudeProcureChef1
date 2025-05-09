import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import RequestItemsList from './RequestItemsList';
import { useAuth } from '../../contexts/AuthContext';
import { RequestItem, RequestPriority } from '../../types/request';
import { createRequest } from '../../services/requests';

interface RequestSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Map<string, { 
    quantity: number; 
    price: number; 
    name: string;
    currentStock?: number;
    stockLevel?: 'low' | 'medium' | 'high';
  }>;
  totalAmount: number;
  onRequestSubmitted: () => void;
}

const RequestSubmissionModal: React.FC<RequestSubmissionModalProps> = ({
  isOpen,
  onClose,
  items,
  totalAmount,
  onRequestSubmitted,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('Ingredient Request');
  const [neededBy, setNeededBy] = useState('');
  const [priority, setPriority] = useState<RequestPriority>('medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate tomorrow's date for the default "needed by" date
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNeededBy(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to submit a request');
      return;
    }

    if (!neededBy) {
      toast.error('Please specify when these items are needed');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert map to array of request items
      const requestItems: RequestItem[] = Array.from(items.entries()).map(
        ([productId, item]) => ({
          id: `item_${Date.now()}_${productId}`,
          product_id: productId,
          product_name: item.name,
          quantity: item.quantity,
          unit: 'unit', // This could be improved by storing unit with the product
          price_per_unit: item.price, // We'll still store this for reference, but not show it
        })
      );

      // Create the request
      await createRequest({
        title,
        created_by: user.id,
        needed_by: neededBy,
        priority,
        notes,
        items: requestItems,
        total_amount: totalAmount, // Still storing for later reference
      });

      toast.success('Request submitted successfully');
      onRequestSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Ingredient Request"
      maxWidth="md"
      footer={
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Submit Request
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Request Title */}
        <FormField id="requestTitle" label="Request Title">
          <input
            id="requestTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </FormField>

        {/* Needed By Date */}
        <FormField id="neededBy" label="Needed By">
          <input
            id="neededBy"
            type="date"
            value={neededBy}
            onChange={(e) => setNeededBy(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </FormField>

        {/* Priority */}
        <FormField id="priority" label="Priority">
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as RequestPriority)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </FormField>

        {/* Notes */}
        <FormField id="notes" label="Notes">
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Add any special instructions or notes here..."
          />
        </FormField>

        {/* Items Summary - Notice we pass showPrice={false} */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Items ({items.size})
          </h3>
          <RequestItemsList 
            items={items} 
            showPrice={false}
            showTotal={false}
          />
        </div>
      </div>
    </Modal>
  );
};

export default RequestSubmissionModal;