import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Requests from './pages/Requests';
import Quotes from './pages/Quotes';
import ProductQuoteComparison from './pages/ProductQuoteComparison';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import RequestDetails from './pages/RequestDetails';
import QuoteDetails from './pages/QuotesDetails'; // NEW IMPORT
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
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
          <Route path="/quotes/:id" element={<QuoteDetails />} /> {/* NEW ROUTE */}
          <Route path="/quote-comparison" element={<ProductQuoteComparison />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/requests/:id" element={<RequestDetails />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;