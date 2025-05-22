import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/products';
import { Product } from '../types/product';
import { supabase } from '../services/supabase';


// Simplified Category type
type Category = {
  id: string;
  name: string;
  description?: string;
};

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Forms state
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    category: '',
    default_unit: '',
    sku: ''
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load products
      const productsData = await getProducts();
      setProducts(productsData);
      
      // Load categories
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error loading categories:", error);
        toast.error("Failed to load categories");
        return;
      }
      
      console.log("Categories loaded:", categoriesData); // Debug log
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Product handlers
  const handleOpenProductForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        default_unit: product.default_unit,
        sku: product.sku || ''
      });
    } else {
      setProductFormData({
        name: '',
        description: '',
        category: '',
        default_unit: '',
        sku: ''
      });
      setEditingProduct(null);
    }
    setIsProductFormOpen(true);
  };

  // For products - add this check before submitting
const handleProductSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Only check for duplicates when creating new products, not when editing
  if (!editingProduct) {
    const normalizedName = productFormData.name.trim().toLowerCase();
    const duplicate = products.find(p => p.name.toLowerCase() === normalizedName);
    
    if (duplicate) {
      toast.error('A product with this name already exists');
      return;
    }
  }
  
  try {
    if (editingProduct) {
      // Update existing product
      await updateProduct(editingProduct.id, productFormData);
      toast.success('Product updated successfully');
    } else {
      // Create new product
      await createProduct(productFormData);
      toast.success('Product created successfully');
    }
    setIsProductFormOpen(false);
    loadData();
  } catch (error: any) {
    console.error('Failed to save product:', error);
    
    // Check for unique constraint violations
    if (error.code === '23505') {
      toast.error('This product name is already in use. Please choose a different name.');
    } else {
      toast.error(`Failed to save product: ${error.message || 'Unknown error'}`);
    }
  }
};

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        toast.success('Product deleted successfully');
        loadData();
      } catch (error) {
        console.error('Failed to delete product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  // Replace the handleCreateCategory function with this version
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
        toast.error('Category name is required');
    return;
  }
  
    try {
    // First, check if the table exists by attempting to count records
    const { count, error: countError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('Error checking categories table:', countError);
      
      // If the error contains "relation does not exist", we need to create the table
      if (countError.message.includes('relation "categories" does not exist')) {
        toast.error('Categories table does not exist. Please create it first.');
        return;
      }
    }
    
    // Create the new category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || null
      })
      .select();
    
    if (error) {
      console.error('Failed to create category:', error);
      
      // More specific error messages based on the error code
      if (error.code === '23505') {
        toast.error('A category with this name already exists');
      } else if (error.code === '42P01') {
        toast.error('Categories table does not exist');
      } else if (error.code?.startsWith('42')) {
        toast.error('Database schema error: ' + error.message);
      } else if (error.code?.startsWith('28')) {
        toast.error('Permission denied: ' + error.message);
      } else {
        toast.error('Failed to create category: ' + error.message);
      }
      return;
    }
    
    console.log('Category created successfully:', data);
    toast.success('Category created successfully');
    loadData(); // Reload categories
    
    // Clear form fields
    setNewCategoryName('');
    setNewCategoryDescription('');
  } catch (error) {
    console.error('Exception creating category:', error);
    toast.error('Failed to create category due to an exception');
  }
};
  const handleDeleteCategory = async (id: string) => {
    // Check if any products use this category
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;
    
    const productsWithCategory = products.filter(p => p.category === categoryToDelete.name);
    
    if (productsWithCategory.length > 0) {
      toast.error(`Cannot delete category '${categoryToDelete.name}' because it's used by ${productsWithCategory.length} products`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the category '${categoryToDelete.name}'?`)) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        toast.success('Category deleted successfully');
        loadData();
      } catch (error) {
        console.error('Failed to delete category:', error);
        toast.error('Failed to delete category');
      }
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setIsCategoryModalOpen(true)}>
            Categories
          </Button>
          <Button onClick={() => handleOpenProductForm()}>
            Add Product
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Product List</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No products found.</p>
                {categories.length === 0 && (
                  <p className="mt-2 text-red-500">
                    Please create a category first before adding products.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500">{product.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.default_unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.sku || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenProductForm(product)} 
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product Form Modal */}
      {isProductFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleProductSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={productFormData.category}
                    onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No categories available. Please create a category first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    name="default_unit"
                    value={productFormData.default_unit}
                    onChange={(e) => setProductFormData({...productFormData, default_unit: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a unit</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="L">Liters (L)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="unit">Unit</option>
                    <option value="box">Box</option>
                    <option value="case">Case</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={productFormData.sku}
                    onChange={(e) => setProductFormData({...productFormData, sku: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="ghost" type="button" onClick={() => setIsProductFormOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Categories</h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List of existing categories */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Existing Categories</h3>
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No categories found.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-500">{category.description}</div>
                        )}
                      </div>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new category form */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">Add New Category</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <Button 
                  variant="primary" 
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                >
                  Create Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ProductList;