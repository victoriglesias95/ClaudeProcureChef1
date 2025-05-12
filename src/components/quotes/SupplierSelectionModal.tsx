import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Supplier } from '../../types/quote';

interface SupplierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onConfirm: (selectedSupplierIds: string[]) => void;
  productIds?: string[]; // Optional: to show only suppliers that carry these products
}

const SupplierSelectionModal: React.FC<SupplierSelectionModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onConfirm,
  productIds
}) => {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  
  // Filter suppliers that can supply the requested products (if productIds provided)
  const availableSuppliers = productIds ? 
    suppliers.filter(supplier => {
      // Check if supplier has any of the requested products
      // This would need to check against supplier product catalog
      return true; // Simplified for now - in real implementation, check supplier catalog
    }) : suppliers;
  
  const handleToggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };
  
  const handleSelectAll = () => {
    setSelectedSuppliers(availableSuppliers.map(s => s.id));
  };
  
  const handleDeselectAll = () => {
    setSelectedSuppliers([]);
  };
  
  const handleConfirm = () => {
    onConfirm(selectedSuppliers);
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Suppliers for Quote Request"
      maxWidth="md"
      footer={
        <div className="flex justify-between">
          <div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll} className="ml-2">
              Deselect All
            </Button>
          </div>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={selectedSuppliers.length === 0}
            >
              Send Quote Request ({selectedSuppliers.length})
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {availableSuppliers.map(supplier => (
          <div 
            key={supplier.id} 
            className="flex items-center p-3 border rounded-lg hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selectedSuppliers.includes(supplier.id)}
              onChange={() => handleToggleSupplier(supplier.id)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium">{supplier.name}</div>
              <div className="text-sm text-gray-500">
                {supplier.contact} • {supplier.email}
              </div>
              {supplier.notes && (
                <div className="text-sm text-gray-400 mt-1">{supplier.notes}</div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Min Order: R${supplier.minimumOrder?.toFixed(2) || '0.00'}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default SupplierSelectionModal;