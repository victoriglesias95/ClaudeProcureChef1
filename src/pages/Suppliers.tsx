import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getSuppliers, createSupplier, updateSupplier } from '../services/suppliers';
import { Supplier } from '../types/quote';

const Suppliers = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error('Failed to load suppliers:', error);
        toast.error('Failed to load suppliers');
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  const handleAddSupplier = () => {
    // Navigate to add supplier form (to be implemented)
    navigate('/suppliers/new');
  };

  const handleEditSupplier = (supplierId: string) => {
    // Navigate to edit supplier form (to be implemented)
    navigate(`/suppliers/${supplierId}/edit`);
  };

  const handleViewSupplierDetails = (supplierId: string) => {
    // Navigate to supplier details page (to be implemented)
    navigate(`/suppliers/${supplierId}`);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage your suppliers and their information</p>
        </div>
        <Button onClick={handleAddSupplier}>
          Add Supplier
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
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
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{supplier.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supplier.contact && (
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium">{supplier.contact}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-primary">
                      <a href={`mailto:${supplier.email}`} className="hover:underline">
                        {supplier.email}
                      </a>
                    </p>
                  </div>
                  
                  {supplier.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">
                        <a href={`tel:${supplier.phone}`} className="hover:underline">
                          {supplier.phone}
                        </a>
                      </p>
                    </div>
                  )}
                  
                  {supplier.address && (
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{supplier.address}</p>
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
                  
                  {supplier.deliveryDays && supplier.deliveryDays.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Delivery Days</p>
                      <p className="font-medium">{supplier.deliveryDays.join(', ')}</p>
                    </div>
                  )}
                  
                  {supplier.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="font-medium text-gray-600">{supplier.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t flex justify-end space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewSupplierDetails(supplier.id)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => handleEditSupplier(supplier.id)}
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