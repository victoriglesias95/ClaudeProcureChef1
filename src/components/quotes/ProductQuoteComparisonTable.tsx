import React from 'react';
import { ProductQuoteComparison, QuoteItem, SupplierQuote } from '../../types/quote';
import { isQuoteValid, getQuoteValidityStatus } from '../../utils/quoteUtils';

interface ProductQuoteComparisonTableProps {
  products: ProductQuoteComparison[];
  onSelectSupplier: (productId: string, supplierId: string) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  existingQuotes?: SupplierQuote[]; // Properly type this prop
}

const ProductQuoteComparisonTable: React.FC<ProductQuoteComparisonTableProps> = ({
  products,
  onSelectSupplier,
  onQuantityChange,
  existingQuotes = []
}) => {
  // Get the best price for a product
  const getBestPrice = (product: ProductQuoteComparison) => {
    if (product.supplierQuotes.length === 0) return null;
    
    return product.supplierQuotes.reduce((best, current) => 
      current.price < best.price ? current : best, 
      product.supplierQuotes[0]
    );
  };
  
  // Check if supplier has a valid existing quote
  const getExistingQuote = (productId: string, supplierId: string): SupplierQuote | undefined => {
    return existingQuotes.find(quote => 
      quote.supplier_id === supplierId &&
      quote.items.some((item: QuoteItem) => item.product_id === productId)
    );
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Best Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              All Suppliers
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => {
            const bestPrice = getBestPrice(product);
            
            return (
              <tr key={product.productId}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {product.productName}
                  </div>
                  {product.sku && (
                    <div className="text-xs text-gray-500">
                      SKU: {product.sku}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {product.category}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {product.unit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="1"
                    value={product.quantity}
                    onChange={(e) => onQuantityChange(
                      product.productId, 
                      parseInt(e.target.value) || 1
                    )}
                    className="w-16 p-1 border border-gray-300 rounded-md"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {bestPrice && (
                    <div>
                      <div className="text-lg font-semibold">
                        R${bestPrice.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {bestPrice.supplierName}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-2">
                    {product.supplierQuotes.map((supplier) => {
                      const isMinOrderReached = !supplier.minimumOrderQuantity || 
                        product.quantity >= supplier.minimumOrderQuantity;
                      
                      // Check for existing quote
                      const existingQuote = getExistingQuote(product.productId, supplier.supplierId);
                      const quoteStatus = existingQuote ? getQuoteValidityStatus(existingQuote) : null;
                      const hasValidQuote = existingQuote && isQuoteValid(existingQuote);
                        
                      return (
                        <button
                          key={supplier.supplierId}
                          onClick={() => onSelectSupplier(product.productId, supplier.supplierId)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            product.selectedSupplierId === supplier.supplierId
                              ? 'bg-primary text-white'
                              : supplier.price === bestPrice?.price
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : hasValidQuote && quoteStatus
                                  ? `${quoteStatus.bgColor} ${quoteStatus.color} border`
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                          disabled={!supplier.inStock}
                        >
                          <div className="flex flex-col items-start">
                            <div className="flex justify-between items-center w-full">
                              <span>{supplier.supplierName}: R${supplier.price.toFixed(2)}</span>
                              {!supplier.inStock && (
                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-1 rounded">
                                  Out of stock
                                </span>
                              )}
                            </div>
                            
                            {/* Quote validity indicator */}
                            {existingQuote && quoteStatus && (
                              <div className={`text-xs mt-1 ${quoteStatus.color}`}>
                                {hasValidQuote ? '✓ ' : '⚠️ '}{quoteStatus.text}
                                {existingQuote.is_blanket_quote && ' (Blanket)'}
                              </div>
                            )}
                            
                            {supplier.minimumOrderQuantity && !isMinOrderReached && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded mt-1">
                                Min: {supplier.minimumOrderQuantity}
                              </span>
                            )}
                          </div>
                          
                          {/* Package conversion info */}
                          {supplier.packageConversion && (
                            <div className="text-xs mt-1">
                              {supplier.packageConversion.supplierUnit} ({supplier.packageConversion.supplierUnitSize} {product.unit}): 
                              R${supplier.packageConversion.supplierUnitPrice.toFixed(2)}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductQuoteComparisonTable;