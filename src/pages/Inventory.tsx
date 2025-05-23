// src/pages/Inventory.tsx - Complete file with Record instead of Map
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import { FormModal, FormInput } from '@/components/ui/FormModal';
import CountModal from '@/components/inventory/CountModal';
import { useStore, useCartTotal } from '@/store/useStore';
import { getInventoryItems } from '@/services/products';
import { updateInventoryCount } from '@/services/inventory';
import { createRequest } from '@/services/requests';
import { useAuth } from '@/hooks/useAuth';

// Enhanced product grid component with better visual feedback
const ProductGrid: React.FC<{
  products: any[];
  cart: Record<string, any>; // Changed from Map to Record
  onAddToCart: (product: any) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
}> = ({ products, cart, onAddToCart, onUpdateQuantity, onRemoveFromCart }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {products.map((product) => {
      const cartItem = cart[product.id]; // Changed from cart.get(product.id)
      const quantity = cartItem?.quantity || 0;
      const isInCart = quantity > 0;
      
      return (
        <div 
          key={product.id} 
          className={`relative bg-white rounded-lg shadow-sm p-4 transition-all duration-300 ${
            isInCart 
              ? 'ring-2 ring-primary shadow-lg transform scale-105' 
              : 'hover:shadow-md'
          }`}
        >
          {/* Added badge */}
          {isInCart && (
            <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-bounce">
              ✓
            </div>
          )}
          
          <h3 className="font-medium text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{product.category}</p>
          
          <div className="mt-3 space-y-2">
            <div>
              <span className={`text-sm font-medium ${
                product.stock_level === 'low' ? 'text-red-600' :
                product.stock_level === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {product.current_stock} {product.default_unit} in stock
              </span>
            </div>
            
            {isInCart ? (
              <div className="bg-primary-50 rounded-lg p-2 border-2 border-primary">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (quantity === 1) {
                        onRemoveFromCart(product.id);
                      } else {
                        onUpdateQuantity(product.id, quantity - 1);
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-gray-600 transition-colors shadow-sm"
                  >
                    -
                  </button>
                  
                  <span className="font-bold text-primary text-lg">
                    {quantity} {product.default_unit}
                  </span>
                  
                  <button
                    onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-primary hover:bg-primary-dark text-white transition-colors shadow-sm"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => onRemoveFromCart(product.id)}
                  className="w-full mt-2 text-xs text-red-600 hover:text-red-700"
                >
                  Remove from request
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onAddToCart(product)}
                fullWidth
                className="hover:scale-105 transition-transform"
              >
                Add to Request
              </Button>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// Request submission schema with date validation
const requestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  neededBy: z.string().min(1, 'Date is required').refine((date) => {
    return new Date(date) >= new Date(new Date().toDateString());
  }, 'Date must be today or in the future'),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional()
});

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [selectedCategoryForCount, setSelectedCategoryForCount] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const clearCart = useStore((state) => state.clearCart);
  const { totalItems } = useCartTotal();
  
  // Load products
  useEffect(() => {
    loadProducts();
  }, []);
  
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getInventoryItems();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category))];
  
  // Handle add to cart with better feedback
  const handleAddToCart = (product: any) => {
    addToCart(product.id, {
      quantity: 1,
      price: 0,
      name: product.name,
      unit: product.default_unit,
      currentStock: product.current_stock,
      stockLevel: product.stock_level
    });
    
    // Better toast with action
    toast.success(
      <div className="flex items-center justify-between w-full">
        <span>Added {product.name} to request</span>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="ml-2 text-xs bg-white px-2 py-1 rounded text-primary font-medium"
        >
          View Cart ({totalItems + 1})
        </button>
      </div>,
      { duration: 5000 }
    );
  };
  
  // Handle update quantity
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product && quantity > 0) {
      addToCart(productId, {
        quantity,
        price: 0,
        name: product.name,
        unit: product.default_unit,
        currentStock: product.current_stock,
        stockLevel: product.stock_level
      });
    }
  };
  
  // Handle remove from cart
  const handleRemoveFromCart = (productId: string) => {
    removeFromCart(productId);
    toast.info('Removed from request');
  };
  
  // Handle count modal
  const handleStartCount = () => {
    setSelectedCategoryForCount(activeCategory !== 'all' ? activeCategory : undefined);
    setIsCountModalOpen(true);
  };
  
  // Handle inventory count submission
  const handleSubmitCount = async (counts: Record<string, number>) => {
    try {
      const success = await updateInventoryCount(counts);
      if (success) {
        await loadProducts();
      } else {
        toast.error('Failed to update inventory count');
      }
    } catch (error) {
      toast.error('Error updating inventory count');
    }
  };
  
  // Get items for count modal
  const getItemsForCount = () => {
    const itemsToCount = selectedCategoryForCount 
      ? products.filter(p => p.category === selectedCategoryForCount)
      : filteredProducts;
      
    return itemsToCount.map(p => ({
      id: p.id,
      name: p.name,
      currentStock: p.current_stock,
      unit: p.default_unit,
      lastCountedAt: p.last_counted_at
    }));
  };
  
  // Handle request submission
  const handleSubmitRequest = async (data: z.infer<typeof requestSchema>) => {
    if (!user) {
      toast.error('You must be logged in to create a request');
      return;
    }

    if (Object.keys(cart).length === 0) { // Changed from cart.size
      toast.error('Please add items to your request first');
      return;
    }

    try {
      const requestItems = Object.entries(cart).map(([productId, item]) => ({ // Changed from Array.from(cart.entries())
        product_id: productId,
        product_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price_per_unit: 0
      }));
      
      await createRequest({
        title: data.title,
        created_by: user.id,
        priority: data.priority,
        needed_by: data.neededBy,
        notes: data.notes,
        total_amount: 0,
        items: requestItems.map((item, index) => ({
          id: `item_${Date.now()}_${index}`,
          ...item
        }))
      });
      
      toast.success('Request submitted successfully! 🎉');
      clearCart();
      setIsRequestModalOpen(false);
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };
  
  const today = new Date().toISOString().split('T')[0];
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with cart indicator */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <div className="flex items-center space-x-3">
            {totalItems > 0 && (
              <div className="bg-primary-100 text-primary px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                {totalItems} items in cart
              </div>
            )}
            <Button variant="outline" onClick={handleStartCount}>
              Start Count
            </Button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <Button
                key={category}
                size="sm"
                variant={activeCategory === category ? 'primary' : 'ghost'}
                onClick={() => setActiveCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Products grid or empty state */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
            {searchTerm && (
              <p className="text-gray-400 mt-2">
                Try adjusting your search or filters
              </p>
            )}
          </div>
        ) : (
          <ProductGrid 
            products={filteredProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
          />
        )}
        
        {/* Floating cart button - more prominent */}
        {totalItems > 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              size="lg"
              onClick={() => setIsRequestModalOpen(true)}
              className="shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 pr-8"
              leftIcon={
                <span className="bg-white text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-2 animate-pulse">
                  {totalItems}
                </span>
              }
            >
              Create Request →
            </Button>
          </div>
        )}
        
        {/* Count Modal */}
        <CountModal
          isOpen={isCountModalOpen}
          onClose={() => setIsCountModalOpen(false)}
          items={getItemsForCount()}
          category={selectedCategoryForCount}
          onSubmitCount={handleSubmitCount}
        />
        
        {/* Request submission modal */}
        <FormModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          title="Submit Request"
          schema={requestSchema}
          onSubmit={handleSubmitRequest}
          defaultValues={{ 
            priority: 'medium',
            neededBy: today
          }}
        >
          {(form) => (
            <>
              <FormInput
                label="Request Title"
                name="title"
                register={form.register}
                error={form.formState.errors.title}
                required
                placeholder="e.g., Weekly vegetables order"
              />
              
              <FormInput
                label="Needed By"
                name="neededBy"
                type="date"
                register={form.register}
                error={form.formState.errors.neededBy}
                required
                min={today}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  {...form.register('priority')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  {...form.register('notes')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Any special instructions..."
                />
              </div>
              
              <div className="border-2 border-primary rounded-lg p-4 bg-primary-50">
                <h3 className="font-medium mb-2 text-primary">Request Items ({totalItems})</h3>
                <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                  {Object.entries(cart).map(([id, item]) => ( // Changed from Array.from(cart.entries())
                    <div key={id} className="flex justify-between py-1 border-b border-primary-100 last:border-0">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-primary font-bold">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </FormModal>
      </div>
    </MainLayout>
  );
};

export default Inventory;