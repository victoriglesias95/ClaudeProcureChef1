import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Supplier } from '../../types/quote';
import { supabase } from '../../services/supabase';

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
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>(suppliers);
  
  // Filter suppliers based on productIds if provided
  useEffect(() => {
    const filterSuppliers = async () => {
      if (!productIds || productIds.length === 0) {
        setAvailableSuppliers(suppliers);
        return;
      }
      
      try {
        // Get suppliers that carry ALL the requested products
        const supplierPromises = suppliers.map(async (supplier) => {
          const { data, error } = await supabase
            .from('supplier_products')
            .select('product_id')
            .eq('supplier_id', supplier.id)
            .eq('available', true)
            .in('product_id', productIds);
          
          if (error) {
            console.error(`Error checking products for supplier ${supplier.id}:`, error);
            return { supplier, hasAllProducts: false };
          }
          
          // Check if supplier has all requested products
          const suppliedProductIds = data?.map(sp => sp.product_id) || [];
          const hasAllProducts = productIds.every(pid => suppliedProductIds.includes(pid));
          
          return { supplier, hasAllProducts };
        });
        
        const results = await Promise.all(supplierPromises);
        const filteredSuppliers = results
          .filter(result => result.hasAllProducts)
          .map(result => result.supplier);
        
        setAvailableSuppliers(filteredSuppliers);
      } catch (error) {
        console.error('Error filtering suppliers:', error);
        setAvailableSuppliers(suppliers);
      }
    };
    
    filterSuppliers();
  }, [suppliers, productIds]);
  
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
        {productIds && productIds.length > 0 && availableSuppliers.length < suppliers.length && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            <p className="font-medium">ℹ️ Filtered Suppliers</p>
            <p>Showing only suppliers that carry all {productIds.length} requested products</p>
          </div>
        )}
        
        {availableSuppliers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No suppliers found that carry all requested products.</p>
            <p className="text-sm">Try selecting fewer products or add products to supplier catalogs.</p>
          </div>
        ) : (
          availableSuppliers.map(supplier => (
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
          ))
        )}
      </div>
    </Modal>
  );
};

export default SupplierSelectionModal;