// src/components/ui/TouchOptimized.tsx
import React, { useState } from 'react';

// Touch-friendly product cards for mobile inventory
export const TouchProductCard: React.FC<{
  product: any;
  onAddToCart: (id: string, quantity: number) => void;
}> = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 touch-manipulation">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-base">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.current_stock} {product.unit} in stock</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          product.stock_level === 'low' ? 'bg-red-100 text-red-800' :
          product.stock_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {product.stock_level}
        </span>
      </div>
      
      {/* Touch-friendly quantity controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              const newQty = Math.max(0, quantity - 1);
              setQuantity(newQty);
              onAddToCart(product.id, newQty);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 touch-manipulation"
          >
            -
          </button>
          
          <span className="min-w-8 text-center font-medium">{quantity}</span>
          
          <button
            onClick={() => {
              const newQty = quantity + 1;
              setQuantity(newQty);
              onAddToCart(product.id, newQty);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white active:bg-primary-dark touch-manipulation"
          >
            +
          </button>
        </div>
        
        <div className="text-right">
          <div className="font-semibold">R${product.price?.toFixed(2) || '0.00'}</div>
          <div className="text-xs text-gray-500">per {product.unit}</div>
        </div>
      </div>
    </div>
  );
};

// Swipeable order cards
export const SwipeableOrderCard: React.FC<{
  order: any;
  onReceive: () => void;
  onView: () => void;
}> = ({ order, onReceive, onView }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const offset = Math.max(-100, Math.min(0, touch.clientX - 100));
    setSwipeOffset(offset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (swipeOffset < -50) {
      // Trigger action
      onReceive();
    }
    setSwipeOffset(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg border">
      {/* Action buttons revealed by swipe */}
      <div className="absolute right-0 top-0 h-full w-24 bg-green-500 flex items-center justify-center">
        <button onClick={onReceive} className="text-white font-medium">
          Receive
        </button>
      </div>
      
      {/* Main card content */}
      <div 
        className="bg-white p-4 transition-transform duration-200"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">Order #{order.number}</h3>
            <p className="text-sm text-gray-500">{order.supplierName}</p>
            <p className="text-sm">R${order.total.toFixed(2)}</p>
          </div>
          <button 
            onClick={onView}
            className="px-3 py-1 bg-gray-100 rounded text-sm"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};