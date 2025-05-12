import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Requests from './pages/Requests';
import Quotes from './pages/Quotes';
import ProductQuoteComparison from './pages/ProductQuoteComparison';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import RequestDetails from './pages/RequestDetails';
import QuoteDetails from './pages/QuotesDetails';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Admin from './pages/Admin';

// Loading screen component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      <p className="mt-2 text-gray-700">Loading authentication...</p>
    </div>
  </div>
);

// App content with loading state handled
const AppContent = () => {
  const { isLoading, isAuthenticated } = useAuth();
  
  // Show loading screen only during initial auth check
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/:id" element={<QuoteDetails />} />
          <Route path="/quote-comparison" element={<ProductQuoteComparison />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/requests/:id" element={<RequestDetails />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;