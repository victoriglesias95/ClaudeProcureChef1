import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { toast } from 'sonner';

interface CountItem {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  lastCountedAt?: string;
}

interface CountModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CountItem[];
  category?: string;
  onSubmitCount: (counts: Record<string, number>) => Promise<void>;
}

const CountModal: React.FC<CountModalProps> = ({
  isOpen,
  onClose,
  items,
  category,
  onSubmitCount
}) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize counts with current values
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    items.forEach(item => {
      initialCounts[item.id] = item.currentStock;
    });
    setCounts(initialCounts);
  }, [items]);
  
  const handleCountChange = (id: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setCounts(prev => ({
      ...prev,
      [id]: numValue
    }));
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitCount(counts);
      toast.success('Inventory count updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating count:', error);
      toast.error('Failed to update inventory count');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Count Inventory${category ? `: ${category}` : ''}`}
      maxWidth="lg"
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
            Update Inventory
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Enter the current quantities for each item after your physical count.
        </p>
      </div>
      
      <div className="overflow-hidden border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Previous
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Count
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    {item.lastCountedAt 
                      ? `Last count: ${new Date(item.lastCountedAt).toLocaleDateString()}`
                      : 'Not counted yet'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.currentStock} {item.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={counts[item.id] || 0}
                      onChange={(e) => handleCountChange(item.id, e.target.value)}
                      className="w-20 p-2 border border-gray-300 rounded-md mr-2"
                    />
                    <span className="text-sm text-gray-500">{item.unit}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default CountModal;