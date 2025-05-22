// src/components/receiver/ReceiveOrderForm.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import { Order, OrderItem } from '../../types/quote';
import { receiveOrder } from '../../services/orders';

interface ReceiveOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderReceived: () => void;
}

interface ReceivedItemData {
  id: string;
  expectedQuantity: number;
  receivedQuantity: number;
  notes: string;
  discrepancy: boolean;
}

const ReceiveOrderForm: React.FC<ReceiveOrderFormProps> = ({
  isOpen,
  onClose,
  order,
  onOrderReceived
}) => {
  const [receivedItems, setReceivedItems] = useState<Record<string, ReceivedItemData>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receivedDate, setReceivedDate] = useState('');

  // Initialize received items when order changes
  useEffect(() => {
    if (order) {
      const initialData: Record<string, ReceivedItemData> = {};
      order.items.forEach(item => {
        initialData[item.id] = {
          id: item.id,
          expectedQuantity: item.quantity,
          receivedQuantity: item.quantity, // Default to expected quantity
          notes: '',
          discrepancy: false
        };
      });
      setReceivedItems(initialData);
      setReceivedDate(new Date().toISOString().split('T')[0]); // Today's date
    }
  }, [order]);

  const handleQuantityChange = (itemId: string, receivedQuantity: number) => {
    setReceivedItems(prev => {
      const updated = {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          receivedQuantity,
          discrepancy: receivedQuantity !== prev[itemId].expectedQuantity
        }
      };
      return updated;
    });
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setReceivedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes
      }
    }));
  };

  const handleSubmit = async () => {
    if (!order) return;

    setIsSubmitting(true);
    try {
      // Prepare received quantities for the service
      const receivedQuantities: Record<string, number> = {};
      const itemNotes: Record<string, string> = {};

      Object.values(receivedItems).forEach(item => {
        receivedQuantities[item.id] = item.receivedQuantity;
        if (item.notes) {
          itemNotes[item.id] = item.notes;
        }
      });

      // Call the service to receive the order
      const success = await receiveOrder(order.id, receivedQuantities, itemNotes);

      if (success) {
        toast.success('Order received successfully and inventory updated');
        onOrderReceived();
        onClose();
      } else {
        toast.error('Failed to receive order');
      }
    } catch (error) {
      console.error('Error receiving order:', error);
      toast.error('Failed to receive order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetAllToExpected = () => {
    setReceivedItems(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(itemId => {
        updated[itemId] = {
          ...updated[itemId],
          receivedQuantity: updated[itemId].expectedQuantity,
          discrepancy: false
        };
      });
      return updated;
    });
  };

  const getTotalDiscrepancies = () => {
    return Object.values(receivedItems).filter(item => item.discrepancy).length;
  };

  const formatCurrency = (amount: number) => `R$${amount.toFixed(2)}`;

  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Order #${order.number}`}
      maxWidth="lg"
      footer={
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {getTotalDiscrepancies() > 0 && (
              <span className="text-yellow-600">
                ⚠️ {getTotalDiscrepancies()} item(s) with discrepancies
              </span>
            )}
          </div>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              Receive Order
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Order Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Supplier:</span> {order.supplierName}
            </div>
            <div>
              <span className="font-medium">Order Total:</span> {formatCurrency(order.total)}
            </div>
            <div>
              <span className="font-medium">Expected Delivery:</span>{' '}
              {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not specified'}
            </div>
            <div>
              <span className="font-medium">Items Count:</span> {order.items.length}
            </div>
          </div>
        </div>

        {/* Received Date */}
        <FormField id="receivedDate" label="Date Received">
          <input
            id="receivedDate"
            type="date"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </FormField>

        {/* Quick Actions */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Items Received</h3>
          <Button size="sm" variant="outline" onClick={handleSetAllToExpected}>
            Set All to Expected
          </Button>
        </div>

        {/* Items List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {order.items.map((item: OrderItem) => {
            const receivedData = receivedItems[item.id];
            if (!receivedData) return null;

            return (
              <div
                key={item.id}
                className={`border rounded-lg p-4 ${
                  receivedData.discrepancy ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{item.productName}</h4>
                    <p className="text-sm text-gray-500">
                      Expected: {item.quantity} {item.unit} @ {formatCurrency(item.price)} each
                    </p>
                    {item.sku && (
                      <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField id={`received-${item.id}`} label="Received Quantity">
                    <div className="flex items-center space-x-2">
                      <input
                        id={`received-${item.id}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={receivedData.receivedQuantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseFloat(e.target.value) || 0)
                        }
                        className={`flex-1 p-2 border rounded-md ${
                          receivedData.discrepancy ? 'border-yellow-400' : 'border-gray-300'
                        }`}
                      />
                      <span className="text-sm text-gray-500">{item.unit}</span>
                    </div>
                    {receivedData.discrepancy && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Difference: {(receivedData.receivedQuantity - receivedData.expectedQuantity).toFixed(1)} {item.unit}
                      </p>
                    )}
                  </FormField>

                  <FormField id={`notes-${item.id}`} label="Notes (optional)">
                    <input
                      id={`notes-${item.id}`}
                      type="text"
                      value={receivedData.notes}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      placeholder="Damage, quality issues, etc."
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>

        {/* General Notes */}
        <FormField id="generalNotes" label="General Notes">
          <textarea
            id="generalNotes"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={3}
            placeholder="Overall delivery condition, delivery person, etc."
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default ReceiveOrderForm;