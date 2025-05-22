import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import SearchBar from '../components/ui/SearchBar';
import CategoryChip from '../components/ui/CategoryChip';
import CategoryBrowser from '../components/ui/CategoryBrowser';
import ProductCard from '../components/ui/ProductCard';
import CartButton from '../components/ui/CartButton';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';
import RequestSubmissionModal from '../components/requests/RequestSubmissionModal';
import CountModal from '../components/inventory/CountModal';
import { getProductsByCategory } from '../services/products';
import { updateInventoryCount } from '../services/inventory';
import { supabase } from '../services/supabase';
import type { InventoryItem } from '../types/product';
import { ProductCategory } from '../types/product';

const Inventory = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [productPrices, setProductPrices] = useState<Record<string, number>>({});
  const [cartItems, setCartItems] = useState<Map<string, {
    quantity: number; 
    price: number; 
    name: string;
    currentStock?: number;
    stockLevel?: 'low' | 'medium' | 'high';
  }>>(new Map());

  const loadInventoryData = async () => {
    try {
      console.log("Loading inventory data...");
      setLoading(true);
      
      const groupedProducts = await getProductsByCategory();
      console.log("Loaded products:", groupedProducts);
      
      const categoryList = Object.keys(groupedProducts).map(name => ({
        name,
        items: groupedProducts[name]
      }));
      
      setCategories(categoryList);
      
      // Load prices for all products from database
      await loadProductPrices();
      
      if (categoryList.length > 0 && !activeCategory) {
        setActiveCategory(categoryList[0].name);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  // Load actual prices from database instead of mock data
  const loadProductPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select(`
          product_id,
          price,
          supplier:supplier_id(name)
        `)
        .eq('available', true);
      
      if (error) throw error;
      
      // Get the best (lowest) price for each product
      const prices: Record<string, number> = {};
      data?.forEach(item => {
        const currentPrice = prices[item.product_id];
        if (!currentPrice || item.price < currentPrice) {
          prices[item.product_id] = item.price;
        }
      });
      
      setProductPrices(prices);
    } catch (error) {
      console.error('Failed to load product prices:', error);
      toast.error('Failed to load product prices');
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Filter products based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const activeItems = activeCategory 
    ? categories.find(c => c.name === activeCategory)?.items || []
    : [];
    
  const handleAddToRequest = (productId: string, quantity: number) => {
    const newCartItems = new Map(cartItems);
    
    let product: InventoryItem | undefined;
    for (const category of categories) {
      product = category.items.find(item => item.id === productId);
      if (product) break;
    }
    
    if (!product) return;
    
    if (quantity === 0) {
      newCartItems.delete(productId);
    } else {
      // Use actual database price instead of mock price
      const price = productPrices[productId] || 0;
      
      newCartItems.set(productId, {
        quantity,
        price,
        name: product.name,
        currentStock: product.current_stock,
        stockLevel: product.stock_level
      });
    }
    
    setCartItems(newCartItems);
  };
  
  const totalItems = [...cartItems.values()].reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = [...cartItems.values()].reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCreateRequest = () => {
    setIsRequestModalOpen(true);
  };
  
  const handleRequestSubmitted = () => {
    setCartItems(new Map());
  };

  const handleStartCount = () => {
    setIsCountModalOpen(true);
  };
  
  const handleSubmitCount = async (counts: Record<string, number>) => {
    try {
      await updateInventoryCount(counts);
      await loadInventoryData();
      toast.success('Inventory count updated successfully');
    } catch (error) {
      console.error('Error updating inventory count:', error);
      toast.error('Failed to update inventory count');
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Find and request ingredients</p>
        </div>
        <Button 
          variant="primary"
          onClick={handleStartCount}
        >
          Start Count
        </Button>
      </div>
      
      <div className="mb-6 flex gap-2">
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search ingredients..."
          className="flex-1"
        />
        <button 
          className="p-3 rounded-full border border-gray-200 hover:bg-gray-50"
          onClick={() => setIsCategoryModalOpen(true)}
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {filteredCategories.map(category => (
          <CategoryChip
            key={category.name}
            name={category.name}
            isActive={activeCategory === category.name}
            onClick={() => setActiveCategory(category.name)}
          />
        ))}
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading inventory...</div>
      ) : (
        <div>
          <SectionHeader 
            title={activeCategory || 'All Products'} 
            onViewMore={() => console.log('View more products')}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeItems.map((item) => {
              // Use actual database price instead of mock price
              const price = productPrices[item.id] || 0;
              
              return (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={price}
                  unit={`${item.default_unit}`}
                  stockLevel={item.stock_level}
                  currentStock={item.current_stock}
                  lastCountedAt={item.last_counted_at}
                  onAddToRequest={(id, quantity) => handleAddToRequest(id, quantity)}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {totalItems > 0 && (
        <CartButton
          totalItems={totalItems}
          totalPrice={totalPrice}
          onClick={handleCreateRequest}
        />
      )}
      
      <CategoryBrowser
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories.map(cat => ({ id: cat.name, name: cat.name }))}
        onSelectCategory={(catId) => setActiveCategory(catId)}
        title="Food Categories"
      />
      
      <RequestSubmissionModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        items={cartItems}
        totalAmount={totalPrice}
        onRequestSubmitted={handleRequestSubmitted}
      />
      
      <CountModal
        isOpen={isCountModalOpen}
        onClose={() => setIsCountModalOpen(false)}
        items={activeItems.map(item => ({
          id: item.id,
          name: item.name,
          currentStock: item.current_stock,
          unit: item.default_unit,
          lastCountedAt: item.last_counted_at
        }))}
        category={activeCategory || undefined}
        onSubmitCount={handleSubmitCount}
      />
    </MainLayout>
  );
};

export default Inventory;