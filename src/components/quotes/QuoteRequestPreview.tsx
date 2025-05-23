// src/components/quotes/QuoteRequestPreview.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { supabase } from '@/services/supabase';
import { Request } from '@/types/request';

interface QuoteRequestPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request;
  onConfirmSend: (supplierSelections: SupplierSelection[]) => void;
}

interface SupplierSelection {
  supplierId: string;
  supplierName: string;
  selectedProductIds: string[];
  allProductsAvailable: boolean;
}

interface SupplierProductInfo {
  supplierId: string;
  supplierName: string;
  products: Array<{
    productId: string;
    productName: string;
    available: boolean;
    lastPrice?: number;
    lastQuoteDate?: string;
  }>;
}

const QuoteRequestPreview: React.FC<QuoteRequestPreviewProps> = ({
  isOpen,
  onClose,
  request,
  onConfirmSend
}) => {
  const [supplierInfo, setSupplierInfo] = useState<SupplierProductInfo[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && request) {
      loadSupplierProductInfo();
    }
  }, [isOpen, request]);

  const loadSupplierProductInfo = async () => {
    try {
      setLoading(true);
      
      // Get all product IDs from the request
      const productIds = request.items.map(item => item.product_id);
      
      // Get all suppliers
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*');
      
      if (suppliersError) throw suppliersError;
      
      // For each supplier, check which products they carry
      const supplierInfoData: SupplierProductInfo[] = [];
      
      for (const supplier of suppliers || []) {
        // Get supplier's product catalog
        const { data: supplierProducts, error: spError } = await supabase
          .from('supplier_products')
          .select('*')
          .eq('supplier_id', supplier.id)
          .in('product_id', productIds)
          .eq('available', true);
        
        if (spError) throw spError;
        
        // Get recent quote history for price reference
        const { data: recentQuotes, error: quoteError } = await supabase
          .from('quotes')
          .select(`
            created_at,
            items:quote_items(
              product_id,
              price_per_unit
            )
          `)
          .eq('supplier_id', supplier.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (quoteError) throw quoteError;
        
        // Build product info for this supplier
        const products = request.items.map(item => {
          const supplierProduct = supplierProducts?.find(sp => sp.product_id === item.product_id);
          
          // Find last quoted price
          let lastPrice: number | undefined;
          let lastQuoteDate: string | undefined;
          
          if (recentQuotes) {
            for (const quote of recentQuotes) {
              const quoteItem = quote.items?.find((qi: any) => qi.product_id === item.product_id);
              if (quoteItem) {
                lastPrice = quoteItem.price_per_unit;
                lastQuoteDate = quote.created_at;
                break;
              }
            }
          }
          
          return {
            productId: item.product_id,
            productName: item.product_name,
            available: !!supplierProduct,
            lastPrice: lastPrice || supplierProduct?.price,
            lastQuoteDate
          };
        });
        
        // Only include suppliers that carry at least one product
        const hasProducts = products.some(p => p.available);
        if (hasProducts) {
          supplierInfoData.push({
            supplierId: supplier.id,
            supplierName: supplier.name,
            products
          });
          
          // Auto-select suppliers that have all products
          const hasAllProducts = products.every(p => p.available);
          if (hasAllProducts) {
            setSelectedSuppliers(prev => new Set(prev).add(supplier.id));
          }
        }
      }
      
      setSupplierInfo(supplierInfoData);
    } catch (error) {
      console.error('Error loading supplier info:', error);
      toast.error('Failed to load supplier information');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedSuppliers(new Set(supplierInfo.map(s => s.supplierId)));
  };

  const handleDeselectAll = () => {
    setSelectedSuppliers(new Set());
  };

  const handleConfirmSend = () => {
    const selections: SupplierSelection[] = supplierInfo
      .filter(info => selectedSuppliers.has(info.supplierId))
      .map(info => ({
        supplierId: info.supplierId,
        supplierName: info.supplierName,
        selectedProductIds: info.products
          .filter(p => p.available)
          .map(p => p.productId),
        allProductsAvailable: info.products.every(p => p.available)
      }));
    
    if (selections.length === 0) {
      toast.error('Please select at least one supplier');
      return;
    }
    
    onConfirmSend(selections);
    onClose();
  };

  const formatPrice = (price?: number) => {
    return price ? `R$${price.toFixed(2)}` : '-';
  };

  const formatDate = (date?: string) => {
    return date ? new Date(date).toLocaleDateString() : '-';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quote Request Preview"
      maxWidth="xl"
      footer={
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSend}
              disabled={selectedSuppliers.size === 0}
            >
              Send to {selectedSuppliers.size} Supplier{selectedSuppliers.size !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="text-center py-8">Loading supplier information...</div>
      ) : (
        <div className="space-y-6">
          {/* Request Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Request Summary</h3>
            <p className="text-sm text-gray-600">
              {request.title} • {request.items.length} items • Needed by {new Date(request.needed_by || '').toLocaleDateString()}
            </p>
          </div>

          {/* Supplier Product Matrix */}
          <div className="space-y-4">
            {supplierInfo.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No suppliers found with products from this request.
                Please add products to supplier catalogs first.
              </div>
            ) : (
              supplierInfo.map(info => {
                const availableCount = info.products.filter(p => p.available).length;
                const totalCount = info.products.length;
                const allAvailable = availableCount === totalCount;
                
                return (
                  <div 
                    key={info.supplierId}
                    className={`border rounded-lg p-4 ${
                      selectedSuppliers.has(info.supplierId) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.has(info.supplierId)}
                          onChange={() => handleToggleSupplier(info.supplierId)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <div>
                          <h4 className="font-medium text-lg">{info.supplierName}</h4>
                          <p className="text-sm text-gray-600">
                            Will be asked for: {availableCount} of {totalCount} items
                          </p>
                        </div>
                      </div>
                      <StatusBadge 
                        status={allAvailable ? 'high' : availableCount > 0 ? 'medium' : 'low'}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-2 ml-7">
                      {info.products.map(product => (
                        <div 
                          key={product.productId}
                          className={`flex items-center justify-between text-sm p-2 rounded ${
                            product.available ? 'bg-green-50' : 'bg-red-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {product.available ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                            <span className={product.available ? '' : 'text-gray-500 line-through'}>
                              {product.productName}
                            </span>
                          </div>
                          {product.available && (
                            <div className="flex items-center space-x-4 text-gray-600">
                              <span>Last price: {formatPrice(product.lastPrice)}</span>
                              {product.lastQuoteDate && (
                                <span className="text-xs">
                                  ({formatDate(product.lastQuoteDate)})
                                </span>
                              )}
                            </div>
                          )}
                          {!product.available && (
                            <span className="text-xs text-red-600">Not in catalog</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {selectedSuppliers.has(info.supplierId) && !allAvailable && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        ⚠️ This supplier will only receive requests for products in their catalog
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Link to manage catalogs */}
          {supplierInfo.length > 0 && (
            <div className="text-center text-sm text-gray-500">
              Need to update supplier catalogs? 
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => window.open('/suppliers', '_blank')}
                className="ml-1"
              >
                Manage Catalogs
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default QuoteRequestPreview;