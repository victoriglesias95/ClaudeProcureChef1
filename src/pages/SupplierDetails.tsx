// src/pages/SupplierDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import FormField from '@/components/ui/FormField';
import { supabase } from '@/services/supabase';

interface Supplier {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  delivery_days?: string[];
  minimum_order?: number;
  notes?: string;
}

interface SupplierProduct {
  supplier_id: string;
  product_id: string;
  product_name: string;
  category: string;
  price: number;
  supplier_product_code?: string;
  available: boolean;
  minimum_order_quantity?: number;
  last_price_update?: string;
  lead_time_days?: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  default_unit: string;
}

const SupplierDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'catalog' | 'history'>('details');
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [price, setPrice] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [minOrderQty, setMinOrderQty] = useState('');
  const [leadTime, setLeadTime] = useState('');

  useEffect(() => {
    if (id) {
      loadSupplierData();
    }
  }, [id]);

  const loadSupplierData = async () => {
    try {
      setLoading(true);
      
      // Load supplier details
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (supplierError) throw supplierError;
      setSupplier(supplierData);
      
      // Load supplier products with product details
      const { data: supplierProductsData, error: spError } = await supabase
        .from('supplier_products')
        .select(`
          *,
          product:products!inner(
            id,
            name,
            category,
            default_unit
          )
        `)
        .eq('supplier_id', id)
        .eq('available', true);
      
      if (spError) throw spError;
      
      // Transform data
      const transformedProducts = supplierProductsData?.map(sp => ({
        supplier_id: sp.supplier_id,
        product_id: sp.product_id,
        product_name: sp.product.name,
        category: sp.product.category,
        price: sp.price,
        supplier_product_code: sp.supplier_product_code,
        available: sp.available,
        minimum_order_quantity: sp.minimum_order_quantity,
        last_price_update: sp.last_price_update,
        lead_time_days: sp.lead_time_days
      })) || [];
      
      setSupplierProducts(transformedProducts);
      
      // Load all products for the add product modal
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (productsError) throw productsError;
      setAllProducts(productsData || []);
      
    } catch (error) {
      console.error('Error loading supplier data:', error);
      toast.error('Failed to load supplier data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProductId || !price) {
      toast.error('Please select a product and enter a price');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('supplier_products')
        .insert({
          supplier_id: id,
          product_id: selectedProductId,
          price: parseFloat(price),
          supplier_product_code: supplierCode || null,
          available: true,
          minimum_order_quantity: minOrderQty ? parseInt(minOrderQty) : null,
          lead_time_days: leadTime ? parseInt(leadTime) : null,
          last_price_update: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success('Product added to supplier catalog');
      setIsAddProductModalOpen(false);
      resetForm();
      loadSupplierData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleUpdatePrice = async () => {
    if (!selectedProduct || !price) return;
    
    try {
      const { error } = await supabase
        .from('supplier_products')
        .update({
          price: parseFloat(price),
          supplier_product_code: supplierCode || selectedProduct.supplier_product_code,
          minimum_order_quantity: minOrderQty ? parseInt(minOrderQty) : selectedProduct.minimum_order_quantity,
          lead_time_days: leadTime ? parseInt(leadTime) : selectedProduct.lead_time_days,
          last_price_update: new Date().toISOString()
        })
        .eq('supplier_id', id)
        .eq('product_id', selectedProduct.product_id);
      
      if (error) throw error;
      
      toast.success('Product updated');
      setIsEditPriceModalOpen(false);
      resetForm();
      loadSupplierData();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm('Remove this product from the supplier catalog?')) return;
    
    try {
      const { error } = await supabase
        .from('supplier_products')
        .update({ available: false })
        .eq('supplier_id', id)
        .eq('product_id', productId);
      
      if (error) throw error;
      
      toast.success('Product removed from catalog');
      loadSupplierData();
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Failed to remove product');
    }
  };

  const resetForm = () => {
    setSelectedProductId('');
    setPrice('');
    setSupplierCode('');
    setMinOrderQty('');
    setLeadTime('');
    setSelectedProduct(null);
  };

  const openEditModal = (product: SupplierProduct) => {
    setSelectedProduct(product);
    setPrice(product.price.toString());
    setSupplierCode(product.supplier_product_code || '');
    setMinOrderQty(product.minimum_order_quantity?.toString() || '');
    setLeadTime(product.lead_time_days?.toString() || '');
    setIsEditPriceModalOpen(true);
  };

  const filteredProducts = supplierProducts.filter(p => 
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableProductsToAdd = allProducts.filter(p => 
    !supplierProducts.some(sp => sp.product_id === p.id)
  );

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, SupplierProduct[]>);

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">Loading supplier details...</div>
      </MainLayout>
    );
  }

  if (!supplier) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-lg text-gray-500 mb-4">Supplier not found</p>
          <Button onClick={() => navigate('/suppliers')}>
            Back to Suppliers
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/suppliers')}
              className="mb-2"
            >
              ← Back to Suppliers
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
            <p className="text-gray-600">{supplier.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['details', 'catalog', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm capitalize
                  ${activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab === 'catalog' && `Product Catalog (${supplierProducts.length})`}
                {tab === 'details' && 'Supplier Details'}
                {tab === 'history' && 'Quote History'}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {supplier.contact && (
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium">{supplier.contact}</p>
                  </div>
                )}
                {supplier.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{supplier.phone}</p>
                  </div>
                )}
                {supplier.address && (
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{supplier.address}</p>
                  </div>
                )}
                {supplier.payment_terms && (
                  <div>
                    <p className="text-sm text-gray-500">Payment Terms</p>
                    <p className="font-medium">{supplier.payment_terms}</p>
                  </div>
                )}
                {supplier.minimum_order && (
                  <div>
                    <p className="text-sm text-gray-500">Minimum Order</p>
                    <p className="font-medium">R${supplier.minimum_order.toFixed(2)}</p>
                  </div>
                )}
                {supplier.delivery_days && supplier.delivery_days.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Delivery Days</p>
                    <p className="font-medium">{supplier.delivery_days.join(', ')}</p>
                  </div>
                )}
                {supplier.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium">{supplier.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-4">
            {/* Catalog Header */}
            <div className="flex justify-between items-center">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <Button 
                onClick={() => setIsAddProductModalOpen(true)}
                variant="primary"
                className="ml-4"
              >
                Add Product
              </Button>
            </div>

            {/* Products by Category */}
            {Object.keys(groupedProducts).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No products in catalog yet</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setIsAddProductModalOpen(true)}
                    className="mt-4"
                  >
                    Add First Product
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedProducts).map(([category, products]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {products.map((product) => (
                        <div 
                          key={product.product_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{product.product_name}</h4>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>R${product.price.toFixed(2)}/unit</span>
                              {product.supplier_product_code && (
                                <span>Code: {product.supplier_product_code}</span>
                              )}
                              {product.minimum_order_quantity && (
                                <span>Min: {product.minimum_order_quantity} units</span>
                              )}
                              {product.lead_time_days && (
                                <span>{product.lead_time_days} days lead time</span>
                              )}
                            </div>
                            {product.last_price_update && (
                              <p className="text-xs text-gray-500 mt-1">
                                Last updated: {new Date(product.last_price_update).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(product)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveProduct(product.product_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Quote history coming soon</p>
            </CardContent>
          </Card>
        )}

        {/* Add Product Modal */}
        <Modal
          isOpen={isAddProductModalOpen}
          onClose={() => {
            setIsAddProductModalOpen(false);
            resetForm();
          }}
          title="Add Product to Catalog"
          footer={
            <div className="flex justify-end space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsAddProductModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddProduct}>
                Add Product
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField id="product" label="Product">
              <select
                id="product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                required
              >
                <option value="">Select a product</option>
                {availableProductsToAdd.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.category})
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="price" label="Price per Unit">
              <input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </FormField>

            <FormField id="supplierCode" label="Supplier Product Code (Optional)">
              <input
                id="supplierCode"
                type="text"
                value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)}
                placeholder="e.g., SKU-123"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </FormField>

            <FormField id="minOrderQty" label="Minimum Order Quantity (Optional)">
              <input
                id="minOrderQty"
                type="number"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
                placeholder="1"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </FormField>

            <FormField id="leadTime" label="Lead Time in Days (Optional)">
              <input
                id="leadTime"
                type="number"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="1"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </FormField>
          </div>
        </Modal>

        {/* Edit Price Modal */}
        <Modal
          isOpen={isEditPriceModalOpen}
          onClose={() => {
            setIsEditPriceModalOpen(false);
            resetForm();
          }}
          title={`Edit ${selectedProduct?.product_name || 'Product'}`}
          footer={
            <div className="flex justify-end space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsEditPriceModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdatePrice}>
                Update
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <FormField id="editPrice" label="Price per Unit">
              <input
                id="editPrice"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </FormField>

            <FormField id="editSupplierCode" label="Supplier Product Code">
              <input
                id="editSupplierCode"
                type="text"
                value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)}
                placeholder="e.g., SKU-123"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </FormField>

            <FormField id="editMinOrderQty" label="Minimum Order Quantity">
              <input
                id="editMinOrderQty"
                type="number"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
                placeholder="1"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </FormField>

            <FormField id="editLeadTime" label="Lead Time in Days">
              <input
                id="editLeadTime"
                type="number"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="1"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </FormField>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default SupplierDetails;