import React from 'react';

interface CategoryChipProps {
  name: string;
  isActive?: boolean;
  onClick?: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  name,
  isActive = false,
  onClick
}) => {
  return (
    <button
      className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
        isActive
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={onClick}
    >
      {name}
    </button>
  );
};

export default CategoryChip;