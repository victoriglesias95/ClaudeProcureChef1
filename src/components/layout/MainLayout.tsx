import React from 'react';
import { Link } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background-off">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">ProcureChef</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">John Doe</span>
            <button className="text-sm text-gray-600 hover:text-gray-900">Logout</button>
          </div>
        </div>
      </header>
      
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] hidden md:block">
          <nav className="p-4">
            <div className="space-y-1">
              <Link to="/" className="block px-3 py-2 rounded-md text-primary bg-primary-light/10">Dashboard</Link>
              <Link to="/inventory" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">Inventory</Link>
              <Link to="/requests" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">Requests</Link>
              <Link to="/quotes" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">Quotes</Link>
              <Link to="/orders" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">Orders</Link>
              <Link to="/suppliers" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50">Suppliers</Link>
            </div>
          </nav>
        </aside>
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;