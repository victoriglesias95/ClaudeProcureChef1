import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getProducts } from '../services/products';
import { supabase } from '../services/supabase';
import { Product } from '../types/product';

// Define types for the component
interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  minimum_order?: number | null;
  notes?: string;
}

interface SupplierProduct {
  id?: string;
  supplier_id: string;
  product_id: string;
  price: number;
  supplier_product_code?: string;
  minimum_order_quantity?: number;
  available: boolean;
  product?: Product;
}

interface SupplierFormData {
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  minimumOrder: string;
  notes: string;
}

interface ProductFormData {
  product_id: string;
  price: string;
  supplier_product_code: string;
  minimum_order_quantity: string;
  available: boolean;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<Record<string, SupplierProduct[]>>({});
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  
  // Editing state
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [activeSupplierForProduct, setActiveSupplierForProduct] = useState<string | null>(null);
  
  // Form data
  const [supplierFormData, setSupplierFormData] = useState<SupplierFormData>({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: '',
    minimumOrder: '',
    notes: ''
  });
  
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    product_id: '',
    price: '',
    supplier_product_code: '',
    minimum_order_quantity: '',
    available: true
  });

  // Get suppliers from database
  const fetchSuppliers = async (): Promise<Supplier[]> => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
      return [];
    }
  };

  // Create a new supplier
  const createSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<Supplier | null> => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  };

  // Update a supplier
  const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  };

  // Delete a supplier
  const deleteSupplier = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get suppliers and products
      const suppliersData = await fetchSuppliers();
      const productsData = await getProducts();
      
      setSuppliers(suppliersData);
      setProducts(productsData);
      
      // Get supplier products for each supplier
      const supplierProductsData: Record<string, SupplierProduct[]> = {};
      
      for (const supplier of suppliersData) {
        const { data } = await supabase
          .from('supplier_products')
          .select(`
            *,
            product:product_id (*)
          `)
          .eq('supplier_id', supplier.id);
          
        supplierProductsData[supplier.id] = data || [];
      }
      
      setSupplierProducts(supplierProductsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Supplier form handlers
  const handleOpenSupplierForm = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierFormData({
        name: supplier.name,
        contact: supplier.contact || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        paymentTerms: supplier.payment_terms || '',
        minimumOrder: supplier.minimum_order?.toString() || '',
        notes: supplier.notes || ''
      });
    } else {
      setEditingSupplier(null);
      setSupplierFormData({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        paymentTerms: '',
        minimumOrder: '',
        notes: ''
      });
    }
    setIsSupplierFormOpen(true);
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only check for duplicates when creating new suppliers, not when editing
    if (!editingSupplier) {
      const normalizedName = supplierFormData.name.trim().toLowerCase();
      const duplicate = suppliers.find(s => s.name.toLowerCase() === normalizedName);
      
      if (duplicate) {
        toast.error('A supplier with this name already exists');
        return;
      }
    }
    
    try {
      // Prepare supplier data - transform camelCase to snake_case for DB
      const supplierData = {
        name: supplierFormData.name,
        contact: supplierFormData.contact,
        email: supplierFormData.email,
        phone: supplierFormData.phone,
        address: supplierFormData.address, 
        payment_terms: supplierFormData.paymentTerms,
        minimum_order: supplierFormData.minimumOrder 
          ? parseFloat(supplierFormData.minimumOrder) 
          : null,
        notes: supplierFormData.notes
      };

      if (editingSupplier) {
        // Update existing supplier
        await updateSupplier(editingSupplier.id, supplierData);
        toast.success('Supplier updated successfully');
      } else {
        // Create new supplier
        await createSupplier(supplierData);
        toast.success('Supplier created successfully');
      }
      
      setIsSupplierFormOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Failed to save supplier:', error);
      
      // Check for unique constraint violations
      if (error.code === '23505') {
        toast.error('This supplier name is already in use. Please choose a different name.');
      } else {
        toast.error(`Failed to save supplier: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        // First delete supplier products if they exist
        await supabase
          .from('supplier_products')
          .delete()
          .eq('supplier_id', id);
        
        // Then delete the supplier
        await deleteSupplier(id);
        toast.success('Supplier deleted successfully');
        loadData();
      } catch (error) {
        console.error('Failed to delete supplier:', error);
        toast.error('Failed to delete supplier');
      }
    }
  };

  // Product form handlers
  const handleOpenProductForm = (supplierId: string, product?: SupplierProduct) => {
    setActiveSupplierForProduct(supplierId);
    
    if (product) {
      setEditingProduct(product);
      setProductFormData({
        product_id: product.product_id,
        price: product.price.toString(),
        supplier_product_code: product.supplier_product_code || '',
        minimum_order_quantity: product.minimum_order_quantity?.toString() || '',
        available: product.available
      });
    } else {
      setEditingProduct(null);
      setProductFormData({
        product_id: '',
        price: '',
        supplier_product_code: '',
        minimum_order_quantity: '',
        available: true
      });
    }
    
    setIsProductFormOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeSupplierForProduct) return;
    
    try {
      const productData = {
        supplier_id: activeSupplierForProduct,
        product_id: productFormData.product_id,
        price: parseFloat(productFormData.price),
        supplier_product_code: productFormData.supplier_product_code || null,
        minimum_order_quantity: productFormData.minimum_order_quantity 
          ? parseFloat(productFormData.minimum_order_quantity) 
          : null,
        available: productFormData.available
      };
      
      if (editingProduct?.id) {
        await supabase
          .from('supplier_products')
          .update(productData)
          .eq('id', editingProduct.id);
          
        toast.success('Product updated successfully');
      } else {
        await supabase
          .from('supplier_products')
          .insert(productData);
          
        toast.success('Product added to supplier successfully');
      }
      
      setIsProductFormOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      
      if (error.code === '23505') {
        toast.error('This product is already associated with this supplier');
      } else {
        toast.error(`Failed to save product: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleRemoveProduct = async (supplierProductId: string) => {
    if (window.confirm('Are you sure you want to remove this product from the supplier?')) {
      try {
        await supabase
          .from('supplier_products')
          .delete()
          .eq('id', supplierProductId);
          
        toast.success('Product removed from supplier');
        loadData();
      } catch (error) {
        console.error('Failed to remove product:', error);
        toast.error('Failed to remove product');
      }
    }
  };

  // Available products for a supplier
  const getAvailableProducts = (supplierId: string) => {
    const existingProductIds = (supplierProducts[supplierId] || []).map(sp => sp.product_id);
    return products.filter(product => !existingProductIds.includes(product.id));
  };

  // Toggle supplier products visibility
  const toggleSupplierProducts = (supplierId: string) => {
    setExpandedSupplier(expandedSupplier === supplierId ? null : supplierId);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage your suppliers and their products</p>
        </div>
        <Button onClick={() => handleOpenSupplierForm()}>
          Add Supplier
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-lg text-gray-500 mb-4">No suppliers found</p>
            <Button variant="primary" onClick={() => handleOpenSupplierForm()}>
              Add Your First Supplier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <div className="space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleOpenSupplierForm(supplier)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => handleDeleteSupplier(supplier.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {supplier.contact && (
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium">{supplier.contact}</p>
                    </div>
                  )}
                  
                  {supplier.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-primary">{supplier.email}</p>
                    </div>
                  )}
                  
                  {supplier.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{supplier.phone}</p>
                    </div>
                  )}
                </div>
                
                {/* Products Section */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-900">
                      Products ({(supplierProducts[supplier.id] || []).length})
                    </h3>
                    <div className="space-x-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => toggleSupplierProducts(supplier.id)}
                      >
                        {expandedSupplier === supplier.id ? 'Hide Products' : 'Show Products'}
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleOpenProductForm(supplier.id)}
                        disabled={getAvailableProducts(supplier.id).length === 0}
                      >
                        Add Product
                      </Button>
                    </div>
                  </div>
                  
                  {expandedSupplier === supplier.id && (
                    <div className="mt-4">
                      {(supplierProducts[supplier.id] || []).length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No products associated with this supplier yet.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Price (R$)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Supplier Code
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(supplierProducts[supplier.id] || []).map((product) => (
                                <tr key={product.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {product.product?.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {product.product?.category}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {product.price.toFixed(2)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {product.supplier_product_code || '-'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleOpenProductForm(supplier.id, product)} 
                                      className="mr-2"
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="danger" 
                                      size="sm" 
                                      onClick={() => handleRemoveProduct(product.id!)}
                                    >
                                      Remove
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Supplier Form Modal */}
      {isSupplierFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <form onSubmit={handleSupplierSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    name="name"
                    value={supplierFormData.name}
                    onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    name="contact"
                    value={supplierFormData.contact}
                    onChange={(e) => setSupplierFormData({...supplierFormData, contact: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={supplierFormData.email}
                    onChange={(e) => setSupplierFormData({...supplierFormData, email: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={supplierFormData.phone}
                    onChange={(e) => setSupplierFormData({...supplierFormData, phone: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData({...supplierFormData, address: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    name="paymentTerms"
                    value={supplierFormData.paymentTerms}
                    onChange={(e) => setSupplierFormData({...supplierFormData, paymentTerms: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="e.g. Net 30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order (R$)</label>
                  <input
                    type="number"
                    name="minimumOrder"
                    value={supplierFormData.minimumOrder}
                    onChange={(e) => setSupplierFormData({...supplierFormData, minimumOrder: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    value={supplierFormData.notes}
                    onChange={(e) => setSupplierFormData({...supplierFormData, notes: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="ghost" type="button" onClick={() => setIsSupplierFormOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingSupplier ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {isProductFormOpen && activeSupplierForProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product to Supplier'}
            </h2>
            <form onSubmit={handleProductSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  {editingProduct ? (
                    <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
                      {products.find(p => p.id === editingProduct.product_id)?.name || 'Unknown Product'}
                    </div>
                  ) : (
                    <select
                      name="product_id"
                      value={productFormData.product_id}
                      onChange={(e) => setProductFormData({...productFormData, product_id: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select a product</option>
                      {getAvailableProducts(activeSupplierForProduct).map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.category})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (R$)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={productFormData.price}
                    onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Product Code
                  </label>
                  <input
                    type="text"
                    name="supplier_product_code"
                    value={productFormData.supplier_product_code}
                    onChange={(e) => setProductFormData({...productFormData, supplier_product_code: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Quantity
                  </label>
                  <input
                    type="number"
                    name="minimum_order_quantity"
                    value={productFormData.minimum_order_quantity}
                    onChange={(e) => setProductFormData({...productFormData, minimum_order_quantity: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    step="1"
                    min="0"
                    placeholder="Optional"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    name="available"
                    checked={productFormData.available}
                    onChange={(e) => setProductFormData({...productFormData, available: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="available" className="text-sm font-medium text-gray-700">
                    Product is available from this supplier
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="ghost" type="button" onClick={() => setIsProductFormOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingProduct ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Suppliers;