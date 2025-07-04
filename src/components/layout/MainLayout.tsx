import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import MobileNavigation from './MobileNavigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const getLinkClasses = (path: string) => {
    const baseClasses = "block px-3 py-2 rounded-md";
    return isActive(path) 
      ? `${baseClasses} text-primary bg-primary-light/10` 
      : `${baseClasses} text-gray-700 hover:bg-gray-50`;
  };
  
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background-off">
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      {/* Desktop Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">ProcureChef</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
              <button 
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                  Logout
              </button>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] hidden md:block">
          <nav className="p-4">
            <div className="space-y-1">
              <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/inventory" className={getLinkClasses('/inventory')}>
                Inventory
              </Link>
              <Link to="/requests" className={getLinkClasses('/requests')}>
                Requests
              </Link>
              <Link to="/quotes" className={getLinkClasses('/quotes')}>
                Quotes
              </Link>
              <Link to="/orders" className={getLinkClasses('/orders')}>
                Orders
              </Link>
              <Link to="/suppliers" className={getLinkClasses('/suppliers')}>
                Suppliers
              </Link>
              <Link to="/products" className={getLinkClasses('/products')}>
                Products
              </Link>
              <Link to="/admin" className={getLinkClasses('/admin')}>
                Admin
              </Link>
            </div>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6 container-mobile">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;