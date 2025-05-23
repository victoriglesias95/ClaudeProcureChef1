// src/pages/Suppliers.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { getSuppliers } from '../services/suppliers';
import { supabase } from '../services/supabase';
import { Supplier } from '../types/quote';

const Suppliers = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      // Load suppliers
      const data = await getSuppliers();
      setSuppliers(data);
      
      // Load product counts for each supplier
      const counts: Record<string, number> = {};
      
      for (const supplier of data) {
        const { count, error } = await supabase
          .from('supplier_products')
          .select('*', { count: 'exact', head: true })
          .eq('supplier_id', supplier.id)
          .eq('available', true);
        
        if (!error && count !== null) {
          counts[supplier.id] = count;
        }
      }
      
      setProductCounts(counts);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    navigate('/suppliers/new');
  };

  const handleViewSupplier = (supplierId: string) => {
    navigate(`/suppliers/${supplierId}`);
  };

  const handleEditSupplier = (supplierId: string) => {
    navigate(`/suppliers/${supplierId}/edit`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">Loading suppliers...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage your suppliers and their product catalogs</p>
        </div>
        <Button onClick={handleAddSupplier}>
          Add Supplier
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-lg text-gray-500 mb-4">No suppliers found</p>
            <p className="text-gray-400 mb-6">
              Add suppliers to start receiving quotes
            </p>
            <Button variant="primary" onClick={handleAddSupplier}>
              Add Your First Supplier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <Card 
              key={supplier.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewSupplier(supplier.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <StatusBadge 
                    status={productCounts[supplier.id] > 0 ? 'high' : 'low'} 
                    className="text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Product Catalog Summary */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Product Catalog</p>
                    <p className="text-2xl font-bold text-primary">
                      {productCounts[supplier.id] || 0} products
                    </p>
                  </div>
                  
                  {supplier.contact && (
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium">{supplier.contact}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-primary">
                      <a 
                        href={`mailto:${supplier.email}`} 
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {supplier.email}
                      </a>
                    </p>
                  </div>
                  
                  {supplier.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">
                        <a 
                          href={`tel:${supplier.phone}`} 
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {supplier.phone}
                        </a>
                      </p>
                    </div>
                  )}
                  
                  {supplier.paymentTerms && (
                    <div>
                      <p className="text-sm text-gray-500">Payment Terms</p>
                      <p className="font-medium">{supplier.paymentTerms}</p>
                    </div>
                  )}
                  
                  {supplier.minimumOrder && (
                    <div>
                      <p className="text-sm text-gray-500">Minimum Order</p>
                      <p className="font-medium">R${supplier.minimumOrder.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t flex justify-end space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewSupplier(supplier.id);
                    }}
                  >
                    View Catalog
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSupplier(supplier.id);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default Suppliers;