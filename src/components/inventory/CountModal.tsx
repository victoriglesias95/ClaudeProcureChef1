// src/components/inventory/CountModal.tsx - Updated version
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
  
  const handleIncrement = (id: string) => {
    setCounts(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };
  
  const handleDecrement = (id: string) => {
    setCounts(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1)
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
      maxWidth="xl" // Changed from lg to xl for more width
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
          Update the current quantities for each item after your physical count.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Showing {items.length} items
        </p>
      </div>
      
      {/* Make the grid scrollable with dynamic height */}
      <div className="max-h-[60vh] overflow-y-auto pr-2"> {/* 60% of viewport height */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-500">Current: {item.currentStock} {item.unit}</p>
                  {item.lastCountedAt && (
                    <p className="text-xs text-gray-400">
                      Last count: {new Date(item.lastCountedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleDecrement(item.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  -
                </button>
                
                <div className="flex-1 mx-4">
                  <input
                    type="number"
                    min="0"
                    value={counts[item.id] || 0}
                    onChange={(e) => handleCountChange(item.id, e.target.value)}
                    className="w-full text-center text-lg font-semibold p-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-center text-sm text-gray-500 mt-1">{item.unit}</p>
                </div>
                
                <button
                  onClick={() => handleIncrement(item.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary hover:bg-primary-dark text-white transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default CountModal;