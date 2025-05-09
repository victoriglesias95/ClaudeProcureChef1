import React from 'react';

interface RequestItemsListProps {
  items: Map<string, { 
    quantity: number; 
    price?: number; 
    name: string;
    currentStock?: number;
    stockLevel?: 'low' | 'medium' | 'high';
  }>;
  showPrice?: boolean;
  showTotal?: boolean;
  className?: string;
}

const RequestItemsList: React.FC<RequestItemsListProps> = ({
  items,
  showPrice = false,
  showTotal = false,
  className = ''
}) => {
  // Convert Map to array
  const itemsArray = Array.from(items.entries()).map(([id, item]) => ({
    id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    currentStock: item.currentStock,
    stockLevel: item.stockLevel
  }));

  // Calculate total if showing prices
  const totalAmount = showPrice ? itemsArray.reduce(
    (sum, item) => sum + item.quantity * (item.price || 0),
    0
  ) : 0;

  // Helper to get stock level color
  const getStockLevelColor = (level?: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`border border-gray-200 rounded-md ${className}`}>
      <div className="p-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              {showPrice && (
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
              )}
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {itemsArray.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                {showPrice && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                    {item.price ? `R$${item.price.toFixed(2)}` : '-'}
                  </td>
                )}
                <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                  {item.currentStock !== undefined ? (
                    <span className={getStockLevelColor(item.stockLevel)}>
                      {item.currentStock} {item.stockLevel && `(${item.stockLevel})`}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showPrice && showTotal && (
        <div className="flex justify-between items-center p-3 border-t border-gray-200 bg-gray-50 rounded-b-md">
          <span className="font-medium">Total:</span>
          <span className="font-medium">R${totalAmount.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

export default RequestItemsList;