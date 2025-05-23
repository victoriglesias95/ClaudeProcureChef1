import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import AuthProvider from './contexts/AuthContext'; // Default import - no curly braces
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Requests from './pages/Requests';
import Quotes from './pages/Quotes';
import ProductQuoteComparison from './pages/ProductQuoteComparison';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import SupplierDetails from './pages/SupplierDetails';
import ProductList from './pages/ProductList';
import RequestDetails from './pages/RequestDetails';
import QuoteDetails from './pages/QuotesDetails';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Admin from './pages/Admin';
import { useEffect } from 'react';
import { measurePageLoad } from './utils/performance';


measurePageLoad();

// Enhanced loading screen component
const LoadingScreen = () => {
  const { error, authState } = useAuth();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center max-w-md p-6">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-gray-700 mb-2">Loading authentication...</p>
        <p className="text-sm text-gray-500">Auth State: {authState}</p>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">Authentication Error:</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
            
            {error.message.includes('Users table not found') && (
              <div className="mt-3 text-xs text-red-600">
                <p>Database setup required:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Go to /admin page</li>
                  <li>Run "Setup Database"</li>
                  <li>Try logging in again</li>
                </ol>
              </div>
            )}
            
            {(error.message.includes('timeout') || error.message.includes('network')) && (
              <div className="mt-3 text-xs text-red-600">
                <p>Connection issue detected. Please check:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Internet connection</li>
                  <li>Supabase URL and API key</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
        
        {!error && (
          <div className="mt-4 text-xs text-gray-500">
            <p>If this takes more than 10 seconds, try refreshing the page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// App content with enhanced error handling
const AppContent = () => {
  const auth = useAuth();
  
  // Enhanced logging with error information
  useEffect(() => {
    console.log('AppContent rendering with auth state:', { 
      authState: auth.authState,
      isAuthenticated: auth.isAuthenticated, 
      isLoading: auth.isLoading,
      hasUser: auth.user ? true : false,
      userEmail: auth.user?.email,
      userRole: auth.user?.role,
      hasError: auth.error ? true : false,
      errorMessage: auth.error?.message
    });
  });

  // Show loading screen during initial auth check
  if (auth.isLoading) {
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
          <Route path="/suppliers/:id" element={<SupplierDetails />} />
          <Route path="/products" element={<ProductList />} />
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