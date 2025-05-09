import React, { useState } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  unit: string;
  imageUrl?: string;
  stockLevel?: 'low' | 'medium' | 'high';
  currentStock?: number;
  lastCountedAt?: string;
  onAddToRequest?: (id: string, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  originalPrice,
  unit,
  imageUrl,
  stockLevel = 'medium',
  currentStock,
  lastCountedAt,
  onAddToRequest
}) => {
  const [quantity, setQuantity] = useState(0);
  
  const discountPercentage = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
  
  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    if (onAddToRequest) {
      onAddToRequest(id, newQuantity);
    }
  };
  
  const handleDecrement = () => {
    if (quantity > 0) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      if (onAddToRequest) {
        onAddToRequest(id, newQuantity);
      }
    }
  };

  // Get color for stock level
  const getStockColor = () => {
    switch (stockLevel) {
      case 'low': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };
  
  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="relative h-36 bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
        
        {/* Quantity Controls */}
        <div className="absolute top-2 left-2 z-10">
          {quantity > 0 ? (
            <div className="flex items-center bg-white rounded-full shadow">
              <button 
                onClick={handleDecrement}
                className="w-8 h-8 flex items-center justify-center text-gray-600"
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button 
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center text-white bg-green-500 rounded-full"
              >
                +
              </button>
            </div>
          ) : (
            <button 
              onClick={handleIncrement}
              className="w-8 h-8 flex items-center justify-center text-white bg-green-500 rounded-full shadow"
            >
              +
            </button>
          )}
        </div>
        
        {/* Stock Level Badge */}
        <div className="absolute bottom-2 left-2">
          <div className={`text-xs font-bold px-2 py-1 ${getStockColor()} bg-white bg-opacity-90 rounded`}>
            {currentStock !== undefined ? `${currentStock} ${unit}` : stockLevel.toUpperCase()}
          </div>
        </div>
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute bottom-2 right-2">
            <div className="bg-yellow-400 text-xs font-bold px-2 py-1">
              -{discountPercentage}%
            </div>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <div className="text-lg font-bold">
            R${price.toFixed(2)}
          </div>
          {originalPrice && (
            <div className="text-sm line-through text-gray-400">
              R${originalPrice.toFixed(2)}
            </div>
          )}
        </div>
        <h3 className="font-medium text-gray-800 mb-1">{name}</h3>
        <div className="text-sm text-gray-500">
          {unit}
        </div>
        {lastCountedAt && (
          <div className="text-xs text-gray-400 mt-1">
            Last counted: {formatDate(lastCountedAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;