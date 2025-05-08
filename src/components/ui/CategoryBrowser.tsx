import React from 'react';
import Modal from './Modal.tsx';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface CategoryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  title?: string;
}

const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  isOpen,
  onClose,
  categories,
  onSelectCategory,
  title = 'Categories'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="xl">
      <div className="grid grid-cols-4 gap-4 p-4">
        {categories.map(category => (
          <button
            key={category.id}
            className="flex flex-col items-center"
            onClick={() => {
              onSelectCategory(category.id);
              onClose();
            }}
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              {category.icon ? (
                <img src={category.icon} alt={category.name} className="w-8 h-8" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                  {category.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="text-sm text-center">{category.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
};

export default CategoryBrowser;