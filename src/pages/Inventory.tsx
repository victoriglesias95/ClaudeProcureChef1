// src/pages/Inventory.tsx - Fixed version
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import { FormModal, FormInput } from '@/components/ui/FormModal';
import { useStore, useCartTotal } from '@/store/useStore';
import { getInventoryItems } from '@/services/products';
import { createRequest } from '@/services/requests';
import { useAuth } from '@/hooks/useAuth';

// Simple product grid component
const ProductGrid: React.FC<{
  products: any[];
  onAddToCart: (product: any) => void;
}> = ({ products, onAddToCart }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {products.map((product) => (
      <div key={product.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{product.category}</p>
        
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className={`text-sm font-medium ${
              product.stock_level === 'low' ? 'text-red-600' :
              product.stock_level === 'medium' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {product.current_stock} {product.default_unit}
            </span>
          </div>
          
          <Button
            size="sm"
            variant="primary"
            onClick={() => onAddToCart(product)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add
          </Button>
        </div>
      </div>
    ))}
  </div>
);

// Request submission schema
const requestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  neededBy: z.string().min(1, 'Date is required'),
  priority: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional()
});

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const clearCart = useStore((state) => state.clearCart);
  const { totalItems, totalPrice } = useCartTotal();
  
  // Load products
  useEffect(() => {
    loadProducts();
  }, []);
  
  const loadProducts = async () => {
    try {
      const data = await getInventoryItems();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
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
  
  // Handle add to cart - FIXED: Added unit property
  const handleAddToCart = (product: any) => {
    const currentItem = cart.get(product.id);
    const newQuantity = (currentItem?.quantity || 0) + 1;
    
    addToCart(product.id, {
      quantity: newQuantity,
      price: product.price || 10, // Default price
      name: product.name,
      unit: product.default_unit, // FIXED: Added missing unit
      currentStock: product.current_stock,
      stockLevel: product.stock_level
    });
    
    toast.success(`Added ${product.name} to cart`);
  };
  
  // Handle request submission
  const handleSubmitRequest = async (data: z.infer<typeof requestSchema>) => {
    if (!user) {
      toast.error('You must be logged in to create a request');
      return;
    }

    try {
      const requestItems = Array.from(cart.entries()).map(([productId, item]) => ({
        product_id: productId,
        product_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price_per_unit: item.price
      }));
      
      // Create request with proper type
      await createRequest({
        title: data.title,
        created_by: user.id,
        priority: data.priority,
        needed_by: data.neededBy,
        notes: data.notes,
        total_amount: totalPrice,
        items: requestItems.map((item, index) => ({
          id: `item_${Date.now()}_${index}`,
          ...item
        }))
      });
      
      toast.success('Request submitted successfully');
      clearCart();
      setIsRequestModalOpen(false);
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <Button variant="outline">
            Start Count
          </Button>
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
        
        {/* Products grid */}
        <ProductGrid 
          products={filteredProducts} 
          onAddToCart={handleAddToCart}
        />
        
        {/* Cart button */}
        {totalItems > 0 && (
          <div className="fixed bottom-6 right-6">
            <Button
              size="lg"
              onClick={() => setIsRequestModalOpen(true)}
              className="shadow-lg"
              leftIcon={
                <span className="bg-white text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {totalItems}
                </span>
              }
            >
              Create Request (${totalPrice.toFixed(2)})
            </Button>
          </div>
        )}
        
        {/* Request submission modal */}
        <FormModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          title="Submit Request"
          schema={requestSchema}
          onSubmit={handleSubmitRequest}
          defaultValues={{ priority: 'medium' }}
        >
          {(form) => (
            <>
              <FormInput
                label="Request Title"
                name="title"
                register={form.register}
                error={form.formState.errors.title}
                required
              />
              
              <FormInput
                label="Needed By"
                name="neededBy"
                type="date"
                register={form.register}
                error={form.formState.errors.neededBy}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
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
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-2">Cart Items ({totalItems})</h3>
                <div className="space-y-1 text-sm">
                  {Array.from(cart.entries()).map(([id, item]) => (
                    <div key={id} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{item.quantity} {item.unit}</span>
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