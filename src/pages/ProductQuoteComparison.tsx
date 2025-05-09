import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProductQuoteComparisonTable from '../components/quotes/ProductQuoteComparisonTable';
import { ProductQuoteComparison } from '../types/quote';
import { getProductQuoteComparison, getRequests, createOrdersFromProductSelections } from '../services/quotes';

const ProductQuoteComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductQuoteComparison[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductQuoteComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [requestFilter, setRequestFilter] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [requests, setRequests] = useState<{id: string, title: string}[]>([]);

  useEffect(() => {
    // Get request IDs from URL params
    const requestIds = searchParams.get('requestIds')?.split(',') || [];
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all requests for filtering
        const requestsData = await getRequests();
        setRequests(requestsData.map(r => ({ id: r.id, title: r.title })));
        
        // Load product quotes
        const productData = await getProductQuoteComparison(requestIds);
        setProducts(productData);
        setFilteredProducts(productData);
        
        // Extract categories
        const uniqueCategories = [...new Set(productData.map(p => p.category))];
        setCategories(uniqueCategories);
        
      } catch (error) {
        console.error('Error loading product quotes:', error);
        toast.error('Failed to load quote comparison data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [searchParams]);
  
  // Apply filters
  useEffect(() => {
    let filtered = [...products];
    
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (requestFilter) {
      filtered = filtered.filter(p => p.requestIds.includes(requestFilter));
    }
    
    setFilteredProducts(filtered);
  }, [products, categoryFilter, requestFilter]);
  
  // Handle supplier selection
  const handleSelectSupplier = (productId: string, supplierId: string) => {
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.productId === productId 
          ? {...p, selectedSupplierId: supplierId} 
          : p
      )
    );
  };
  
  // Handle quantity change
  const handleQuantityChange = (productId: string, quantity: number) => {
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.productId === productId 
          ? {...p, quantity} 
          : p
      )
    );
  };
  
  // Generate orders from selections
  const handleGenerateOrders = async () => {
    const selectedProducts = products.filter(p => p.selectedSupplierId);
    
    if (selectedProducts.length === 0) {
      toast.error('Please select suppliers for at least one product');
      return;
    }
    
    try {
      // Map selections to format expected by service
      const selections = selectedProducts.map(p => ({
        productId: p.productId,
        supplierId: p.selectedSupplierId!,
        quantity: p.quantity
      }));
      
      // Create orders
      const orders = await createOrdersFromProductSelections(selections);
      
      toast.success(`Created ${orders.length} orders successfully`);
      navigate('/orders');
    } catch (error) {
      console.error('Error creating orders:', error);
      toast.error('Failed to create orders');
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">Loading price comparison data...</div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Price Comparison</h1>
          <p className="text-gray-600">
            Compare prices and select the best supplier for each product
          </p>
        </div>
        <div>
          <Button 
            variant="primary" 
            onClick={handleGenerateOrders}
            disabled={products.filter(p => p.selectedSupplierId).length === 0}
          >
            Generate Orders ({products.filter(p => p.selectedSupplierId).length})
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md p-2 w-48"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Request
              </label>
              <select 
                value={requestFilter} 
                onChange={(e) => setRequestFilter(e.target.value)}
                className="border border-gray-300 rounded-md p-2 w-48"
              >
                <option value="">All Requests</option>
                {requests.map(request => (
                  <option key={request.id} value={request.id}>{request.title}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Product comparison table */}
      <Card>
        <CardHeader>
          <CardTitle>Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No products found matching your filters
            </div>
          ) : (
            <ProductQuoteComparisonTable
              products={filteredProducts}
              onSelectSupplier={handleSelectSupplier}
              onQuantityChange={handleQuantityChange}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default ProductQuoteComparisonPage;