// src/components/chef/ProductSelector.tsx
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

interface ProductSelectorProps {
  products: any[];
  categories: string[];
  activeCategory: string;
  searchTerm: string;
  selectedItems: Record<string, SelectedItem>;
  onCategoryChange: (category: string) => void;
  onSearchChange: (term: string) => void;
  onAddProduct: (product: any) => void;
  onRemoveProduct: (productId: string) => void;
  onToggleVisibility: () => void;
  isVisible: boolean;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  categories,
  activeCategory,
  searchTerm,
  selectedItems,
  onCategoryChange,
  onSearchChange,
  onAddProduct,
  onRemoveProduct,
  onToggleVisibility,
  isVisible
}) => {
  const getFilteredProducts = () => {
    if (searchTerm.trim()) return products;
    return products.filter(product => product.category === activeCategory);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Add Ingredients</h3>
        <button
          onClick={onToggleVisibility}
          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          {isVisible ? 'Hide' : 'Show'} Products
        </button>
      </div>

      {isVisible && (
        <div className="border rounded-lg p-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search ingredients..."
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
          />

          {!searchTerm && (
            <div className="flex space-x-2 mb-4 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap text-sm ${
                    activeCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {getFilteredProducts().map(product => (
              <div
                key={product.id}
                className={`p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                  selectedItems[product.id] ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
                onClick={() => selectedItems[product.id] ? onRemoveProduct(product.id) : onAddProduct(product)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {product.current_stock} {product.default_unit} in stock
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.stock_level === 'low' ? 'bg-red-100 text-red-800' :
                    product.stock_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {product.stock_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};