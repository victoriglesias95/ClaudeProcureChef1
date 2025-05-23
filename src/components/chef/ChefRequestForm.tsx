// src/components/chef/ChefRequestForm.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import SearchBar from '../ui/SearchBar';
import { useAuth } from '../../hooks/useAuth';
import { getProductsByCategory, searchProducts } from '../../services/products';
import { createRequest } from '../../services/requests';
import { RequestPriority, RequestItem } from '../../types/request';
import { InventoryItem } from '../../types/product';

interface ChefRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated: () => void;
}

interface RequestFormData {
  title: string;
  priority: RequestPriority;
  neededBy: string;
  notes: string;
  menuName: string;
  expectedCovers: number;
  eventDate: string;
}

interface SelectedItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  urgency: 'normal' | 'urgent';
  notes: string;
  currentStock: number;
  stockLevel: 'low' | 'medium' | 'high';
}

const ChefRequestForm: React.FC<ChefRequestFormProps> = ({
  isOpen,
  onClose,
  onRequestCreated
}) => {
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<RequestFormData>({
    title: '',
    priority: 'medium',
    neededBy: '',
    notes: '',
    menuName: '',
    expectedCovers: 0,
    eventDate: ''
  });
  
  // Product search and selection
  const [searchTerm, setSearchTerm] = useState('');
  const [availableProducts, setAvailableProducts] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      // Set default dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + 3);
      
      setFormData(prev => ({
        ...prev,
        neededBy: tomorrow.toISOString().split('T')[0],
        eventDate: eventDate.toISOString().split('T')[0]
      }));
      
      loadProducts();
    }
  }, [isOpen]);

  // Load products and categories
  const loadProducts = async () => {
    try {
      const productsByCategory = await getProductsByCategory();
      const allProducts: InventoryItem[] = [];
      const categoryNames: string[] = [];
      
      Object.entries(productsByCategory).forEach(([category, products]) => {
        categoryNames.push(category);
        allProducts.push(...products);
      });
      
      setAvailableProducts(allProducts);
      setCategories(categoryNames);
      if (categoryNames.length > 0 && !activeCategory) {
        setActiveCategory(categoryNames[0]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  // Search products
  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.trim()) {
        try {
          const results = await searchProducts(searchTerm);
          setAvailableProducts(results);
        } catch (error) {
          console.error('Error searching products:', error);
        }
      } else {
        loadProducts();
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Add product to request
  const handleAddProduct = (product: InventoryItem) => {
    setSelectedItems(prev => ({
      ...prev,
      [product.id]: {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.default_unit,
        urgency: product.stock_level === 'low' ? 'urgent' : 'normal',
        notes: '',
        currentStock: product.current_stock,
        stockLevel: product.stock_level
      }
    }));
    toast.success(`Added ${product.name} to request`);
  };

  // Update selected item
  const handleUpdateItem = (productId: string, updates: Partial<SelectedItem>) => {
    setSelectedItems(prev => ({
      ...prev,
      [productId]: { ...prev[productId], ...updates }
    }));
  };

  // Remove product from request
  const handleRemoveProduct = (productId: string) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  // Auto-generate request title
  useEffect(() => {
    if (formData.menuName || formData.eventDate) {
      const title = formData.menuName 
        ? `${formData.menuName} - ${formData.eventDate ? new Date(formData.eventDate).toLocaleDateString() : 'Ingredients'}`
        : `Event Ingredients - ${formData.eventDate ? new Date(formData.eventDate).toLocaleDateString() : 'TBD'}`;
      
      setFormData(prev => ({ ...prev, title }));
    }
  }, [formData.menuName, formData.eventDate]);

  // Submit request
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a request');
      return;
    }

    if (Object.keys(selectedItems).length === 0) {
      toast.error('Please add at least one item to your request');
      return;
    }

    if (!formData.neededBy) {
      toast.error('Please specify when items are needed');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert selected items to request items
      const requestItems: RequestItem[] = Object.values(selectedItems).map(item => ({
        id: `item_${Date.now()}_${item.productId}`,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        price_per_unit: 0 // Will be filled during quote process
      }));

      // Create detailed notes
      const detailedNotes = [
        formData.notes,
        formData.menuName && `Menu: ${formData.menuName}`,
        formData.expectedCovers > 0 && `Expected covers: ${formData.expectedCovers}`,
        formData.eventDate && `Event date: ${new Date(formData.eventDate).toLocaleDateString()}`,
        // Add urgent items note
        Object.values(selectedItems).some(item => item.urgency === 'urgent') && 
          'URGENT ITEMS: ' + Object.values(selectedItems)
            .filter(item => item.urgency === 'urgent')
            .map(item => item.productName)
            .join(', ')
      ].filter(Boolean).join('\n\n');

      await createRequest({
        title: formData.title || 'Chef Request',
        created_by: user.id,
        needed_by: formData.neededBy,
        priority: formData.priority,
        notes: detailedNotes,
        items: requestItems,
        total_amount: 0 // Will be calculated during quote process
      });

      toast.success('Chef request created successfully');
      onRequestCreated();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        priority: 'medium',
        neededBy: '',
        notes: '',
        menuName: '',
        expectedCovers: 0,
        eventDate: ''
      });
      setSelectedItems({});
      setSearchTerm('');
      
    } catch (error) {
      console.error('Error creating chef request:', error);
      toast.error('Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredProducts = () => {
    if (searchTerm.trim()) {
      return availableProducts;
    }
    
    if (activeCategory) {
      return availableProducts.filter(product => product.category === activeCategory);
    }
    
    return availableProducts;
  };

  const selectedItemsCount = Object.keys(selectedItems).length;
  const urgentItemsCount = Object.values(selectedItems).filter(item => item.urgency === 'urgent').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Chef Request"
      maxWidth="xl"
      footer={
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedItemsCount > 0 && (
              <span>
                {selectedItemsCount} item(s) selected
                {urgentItemsCount > 0 && (
                  <span className="text-orange-600 ml-2">
                    • {urgentItemsCount} urgent
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="space-x-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={selectedItemsCount === 0}
            >
              Create Request ({selectedItemsCount})
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Request Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField id="menuName" label="Menu/Event Name">
            <input
              id="menuName"
              type="text"
              value={formData.menuName}
              onChange={(e) => setFormData(prev => ({ ...prev, menuName: e.target.value }))}
              placeholder="e.g., Weekend Special, Banquet Menu"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </FormField>

          <FormField id="expectedCovers" label="Expected Covers">
            <input
              id="expectedCovers"
              type="number"
              min="0"
              value={formData.expectedCovers || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedCovers: parseInt(e.target.value) || 0 }))}
              placeholder="Number of guests"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </FormField>

          <FormField id="eventDate" label="Event Date">
            <input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </FormField>

          <FormField id="neededBy" label="Ingredients Needed By">
            <input
              id="neededBy"
              type="date"
              value={formData.neededBy}
              onChange={(e) => setFormData(prev => ({ ...prev, neededBy: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </FormField>
        </div>

        <FormField id="priority" label="Priority">
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as RequestPriority }))}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </FormField>

        {/* Auto-generated title preview */}
        {formData.title && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Request title:</p>
            <p className="font-medium">{formData.title}</p>
          </div>
        )}

        {/* Selected Items */}
        {selectedItemsCount > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Selected Items ({selectedItemsCount})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.values(selectedItems).map(item => (
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
                      onChange={(e) => handleUpdateItem(item.productId, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-20 p-1 border border-gray-300 rounded text-center"
                    />
                    <span className="text-sm text-gray-500">{item.unit}</span>
                    <Button size="sm" variant="outline" onClick={() => handleRemoveProduct(item.productId)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Items Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Add Ingredients</h3>
            <Button size="sm" variant="outline" onClick={() => setShowProductSearch(!showProductSearch)}>
              {showProductSearch ? 'Hide' : 'Show'} Products
            </Button>
          </div>

          {showProductSearch && (
            <div className="border rounded-lg p-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search ingredients..."
                className="mb-4"
              />

              {/* Category filters */}
              {!searchTerm && (
                <div className="flex space-x-2 mb-4 overflow-x-auto">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
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

              {/* Products grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {getFilteredProducts().map(product => (
                  <div
                    key={product.id}
                    className={`p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                      selectedItems[product.id] ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => selectedItems[product.id] ? handleRemoveProduct(product.id) : handleAddProduct(product)}
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

        {/* Additional Notes */}
        <FormField id="notes" label="Additional Notes">
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            placeholder="Special requirements, preparation notes, dietary restrictions, etc."
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default ChefRequestForm;