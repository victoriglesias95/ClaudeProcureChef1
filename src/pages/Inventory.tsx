import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import SearchBar from '../components/ui/SearchBar';
import CategoryChip from '../components/ui/CategoryChip';
import CategoryBrowser from '../components/ui/CategoryBrowser';
import ProductCard from '../components/ui/ProductCard';
import CartButton from '../components/ui/CartButton';
import SectionHeader from '../components/ui/SectionHeader';
import { getProductsByCategory } from '../services/products';
import type { InventoryItem } from '../types/product';
import { ProductCategory } from '../types/product';
import { mockCategoryPrices } from '../mocks/data';

const Inventory = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Map<string, {quantity: number, price: number, name: string}>>(new Map());

  useEffect(() => {
    async function loadInventory() {
      try {
        console.log("Loading inventory data...");
        const groupedProducts = await getProductsByCategory();
        console.log("Loaded products:", groupedProducts);
        
        const categoryList = Object.keys(groupedProducts).map(name => ({
          name,
          items: groupedProducts[name]
        }));
        
        setCategories(categoryList);
        
        // Set first category as active if there are categories
        if (categoryList.length > 0) {
          setActiveCategory(categoryList[0].name);
        }
      } catch (error) {
        console.error('Failed to load inventory:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadInventory();
  }, []);

  // Filter products based on search term
  const filteredCategories = categories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  // Get the items for the active category
  const activeItems = activeCategory 
    ? categories.find(c => c.name === activeCategory)?.items || []
    : [];
    
  const handleAddToRequest = (productId: string, quantity: number) => {
    const newCartItems = new Map(cartItems);
    
    // Find the product from the categories
    let product: InventoryItem | undefined;
    for (const category of categories) {
      product = category.items.find(item => item.id === productId);
      if (product) break;
    }
    
    if (!product) return;
    
    if (quantity === 0) {
      newCartItems.delete(productId);
    } else {
      // Use the category to get the mock price
      const categoryName = product.category;
      const { price } = mockCategoryPrices[categoryName] || { price: 10.99 };
      
      newCartItems.set(productId, {
        quantity,
        price,
        name: product.name
      });
    }
    
    setCartItems(newCartItems);
  };
  
  const totalItems = [...cartItems.values()].reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = [...cartItems.values()].reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCreateRequest = () => {
    // Here you would implement the logic to create a request
    console.log('Creating request with items:', cartItems);
    alert(`Creating request with ${totalItems} items totaling R$${totalPrice.toFixed(2)}`);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-600">Find and request ingredients</p>
      </div>
      
      {/* Search Bar */}
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
      
      {/* Category chips */}
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
          {/* Section header */}
          <SectionHeader 
            title={activeCategory || 'All Products'} 
            onViewMore={() => console.log('View more products')}
          />
          
          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeItems.map((item) => {
              // Get price info based on category
              const categoryName = item.category;
              const priceInfo = mockCategoryPrices[categoryName] || { price: 12.99 };
              
              return (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={priceInfo.price}
                  originalPrice={item.stock_level === 'low' ? priceInfo.originalPrice : undefined}
                  unit={`${item.default_unit}`}
                  onAddToRequest={(id, quantity) => handleAddToRequest(id, quantity)}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* Cart summary button */}
      {totalItems > 0 && (
        <CartButton
          totalItems={totalItems}
          totalPrice={totalPrice}
          onClick={handleCreateRequest}
        />
      )}
      
      {/* Category browser modal */}
      <CategoryBrowser
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories.map(cat => ({ id: cat.name, name: cat.name }))}
        onSelectCategory={(catId) => setActiveCategory(catId)}
        title="Food Categories"
      />
    </MainLayout>
  );
};

export default Inventory;