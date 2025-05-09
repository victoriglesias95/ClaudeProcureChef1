import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Requests from './pages/Requests';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ProductQuoteComparison from './pages/ProductQuoteComparison';
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
          <Route path="/quote-comparison" element={<ProductQuoteComparison />} />
          {/* Add more routes here */}
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;