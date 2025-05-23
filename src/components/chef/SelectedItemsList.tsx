// src/components/chef/SelectedItemsList.tsx
import React from 'react';

interface SelectedItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  urgency: 'normal' | 'urgent';
  currentStock: number;
  stockLevel: 'low' | 'medium' | 'high';
}

interface SelectedItemsListProps {
  items: Record<string, SelectedItem>;
  onUpdateItem: (productId: string, updates: Partial<SelectedItem>) => void;
  onRemoveItem: (productId: string) => void;
}

export const SelectedItemsList: React.FC<SelectedItemsListProps> = ({
  items,
  onUpdateItem,
  onRemoveItem
}) => {
  const itemCount = Object.keys(items).length;
  const urgentCount = Object.values(items).filter(item => item.urgency === 'urgent').length;

  if (itemCount === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">
        Selected Items ({itemCount})
        {urgentCount > 0 && (
          <span className="text-orange-600 ml-2">• {urgentCount} urgent</span>
        )}
      </h3>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {Object.values(items).map(item => (
          <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{item.productName}</span>
                {item.urgency === 'urgent' && (
                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                    URGENT
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.stockLevel === 'low' ? 'bg-red-100 text-red-800' :
                  item.stockLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.currentStock} {item.unit} in stock
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={item.quantity}
                onChange={(e) => onUpdateItem(item.productId, { quantity: parseFloat(e.target.value) || 0 })}
                className="w-20 p-1 border border-gray-300 rounded text-center"
              />
              <span className="text-sm text-gray-500">{item.unit}</span>
              <button
                onClick={() => onRemoveItem(item.productId)}
                className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};