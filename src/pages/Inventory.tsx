import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getProductsByCategory } from '../services/products';
import { InventoryItem, ProductCategory } from '../types/product';

const Inventory = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadInventory() {
      try {
        const groupedProducts = await getProductsByCategory();
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

  const getStockLevelClass = (level: string) => {
    switch (level) {
      case 'low': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Manage your ingredients and supplies</p>
        </div>
        <Button>Create Request</Button>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading inventory...</div>
      ) : (
        <div className="flex gap-6">
          {/* Category sidebar */}
          <div className="w-64 shrink-0 hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredCategories.map(category => (
                    <button
                      key={category.name}
                      className={`block w-full text-left px-4 py-2 hover:bg-gray-50 ${
                        activeCategory === category.name ? 'bg-gray-100' : ''
                      }`}
                      onClick={() => setActiveCategory(category.name)}
                    >
                      {category.name} ({category.items.length})
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Product grid */}
          <div className="flex-1">
            <Card>
              <CardHeader className="flex-row flex justify-between items-center">
                <CardTitle>{activeCategory || 'All Categories'}</CardTitle>
                <div className="text-sm text-gray-500">
                  {activeItems.length} items
                </div>
              </CardHeader>
              <CardContent>
                {activeItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No items found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="p-4">
                          <h3 className="font-medium">{item.name}</h3>
                          <div className="text-sm text-gray-500 mb-2">
                            {item.default_unit}
                          </div>
                          <div className="flex justify-between items-center">
                            <span 
                              className={`text-xs px-2 py-1 rounded-full ${getStockLevelClass(item.stock_level)}`}
                            >
                              {item.stock_level.toUpperCase()}
                            </span>
                            <div className="text-sm">
                              Stock: {item.current_stock}
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 flex justify-end">
                          <button 
                            className="text-primary text-sm hover:underline"
                          >
                            Add to Request
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Inventory;