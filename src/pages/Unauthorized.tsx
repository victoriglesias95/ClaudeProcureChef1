// src/pages/Unauthorized.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        
        <p className="mb-4">
          You don't have permission to access this page. 
          {user && <span> Your current role is <strong>{user.role}</strong>.</span>}
        </p>
        
        <div className="flex flex-col space-y-2">
          <Link 
            to="/" 
            className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark text-center"
          >
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="border border-gray-300 py-2 px-4 rounded hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;