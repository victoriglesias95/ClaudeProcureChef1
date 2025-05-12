import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebugger: React.FC = () => {
  const auth = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  
  // Track renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });
  
  // Log auth state changes
  useEffect(() => {
    console.log('AuthDebugger detected auth state change:', {
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      user: auth.user?.email || null,
      timestamp: new Date().toISOString(),
      renderCount
    });
  }, [auth.isLoading, auth.isAuthenticated, auth.user, renderCount]);
  
  // Get auth logs from localStorage
  const getAuthLogs = () => {
    try {
      return JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
    } catch (e) {
      return [];
    }
  };
  
  if (!expanded) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded-full cursor-pointer"
        onClick={() => setExpanded(true)}
      >
        🔍
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-0 right-0 bg-black bg-opacity-80 text-white p-4 text-xs max-w-sm overflow-auto max-h-96 rounded-tl-lg">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold">Auth Debug Panel</h4>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => setExpanded(false)}
        >
          ✕
        </button>
      </div>
      
      <div className="mb-2 pb-2 border-b border-gray-700">
        <div className="mb-1"><span className="font-semibold">Render Count:</span> {renderCount}</div>
        <div className="mb-1"><span className="font-semibold">isLoading:</span> {auth.isLoading.toString()}</div>
        <div className="mb-1"><span className="font-semibold">isAuthenticated:</span> {auth.isAuthenticated.toString()}</div>
        <div className="mb-1"><span className="font-semibold">user:</span> {auth.user ? auth.user.email : 'null'}</div>
        <div className="mb-1"><span className="font-semibold">role:</span> {auth.user ? auth.user.role : 'null'}</div>
      </div>
      
      <div className="flex space-x-2 mb-2">
        <button 
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
          onClick={() => {
            console.log('Debug: Full auth state', auth);
            console.log('Debug: Auth logs', getAuthLogs());
            alert('Details logged to console');
          }}
        >
          Log Details
        </button>
        
        <button 
          className="px-2 py-1 bg-red-600 text-white text-xs rounded"
          onClick={() => {
            localStorage.removeItem('auth_debug_logs');
            alert('Auth logs cleared');
          }}
        >
          Clear Logs
        </button>
      </div>
      
      <div>
        <h5 className="font-semibold mb-1">Recent Events:</h5>
        <div className="overflow-y-auto max-h-32">
          {getAuthLogs().slice(-5).reverse().map((log: any, index: number) => (
            <div key={index} className="text-xs mb-1 pb-1 border-b border-gray-700">
              <div className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
              <div>[{log.area}] {log.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger;