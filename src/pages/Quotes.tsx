import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getQuoteComparisons, getSuppliers } from '../services/quotes';
import { Supplier, QuoteComparison } from '../types/quote';

const Quotes = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [comparisons, setComparisons] = useState<QuoteComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppliersData, comparisonsData] = await Promise.all([
          getSuppliers(),
          getQuoteComparisons()
        ]);
        
        setSuppliers(suppliersData);
        setComparisons(comparisonsData);
      } catch (error) {
        console.error('Failed to load quotes data:', error);
        toast.error('Failed to load quotes data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCompare = () => {
    navigate('/quote-comparison');
  };

  // Calculate totals
  const totalQuotes = comparisons.reduce((sum, comp) => sum + comp.supplier_quotes.length, 0);
  const openComparisons = comparisons.filter(comp => comp.status === 'open').length;

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600">Overview of supplier quotes</p>
        </div>
        <Button variant="primary" onClick={handleCompare}>
          Compare Prices
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading quotes...</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Quotes</h3>
                <p className="text-3xl font-bold text-primary mt-2">{totalQuotes}</p>
                <p className="text-sm text-gray-600 mt-1">From all suppliers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-500">Active Suppliers</h3>
                <p className="text-3xl font-bold text-primary mt-2">{suppliers.length}</p>
                <p className="text-sm text-gray-600 mt-1">Available for quotes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-500">Open Comparisons</h3>
                <p className="text-3xl font-bold text-primary mt-2">{openComparisons}</p>
                <p className="text-sm text-gray-600 mt-1">Awaiting decisions</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Quote Comparisons */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Quote Comparisons</CardTitle>
            </CardHeader>
            <CardContent>
              {comparisons.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No quote comparisons yet. Create requests to receive quotes from suppliers.
                </p>
              ) : (
                <div className="space-y-4">
                  {comparisons.slice(0, 3).map((comparison) => (
                    <div 
                      key={comparison.id} 
                      className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h4 className="font-medium">{comparison.request.title}</h4>
                        <p className="text-sm text-gray-500">
                          {comparison.supplier_quotes.length} quotes • 
                          Created {new Date(comparison.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        comparison.status === 'open' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {comparison.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 text-center">
                <Button onClick={handleCompare}>
                  View All Comparisons
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default Quotes;