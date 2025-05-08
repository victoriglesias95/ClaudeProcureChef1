import React from 'react';

interface CartButtonProps {
  totalItems: number;
  totalPrice: number;
  onClick: () => void;
}

const CartButton: React.FC<CartButtonProps> = ({
  totalItems,
  totalPrice,
  onClick
}) => {
  if (totalItems === 0) return null;
  
  return (
    <div className="fixed bottom-6 right-0 left-0 flex justify-center z-50 px-4">
      <button
        onClick={onClick}
        className="bg-green-500 text-white py-3 px-6 rounded-full shadow-lg flex items-center justify-center w-full max-w-sm"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <span className="bg-white text-green-500 rounded-full h-8 w-8 flex items-center justify-center mr-2">
              {totalItems}
            </span>
            <span>Create request</span>
          </div>
          <span>R${totalPrice.toFixed(2)}</span>
        </div>
      </button>
    </div>
  );
};

export default CartButton;