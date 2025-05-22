// src/components/AuthDebugger.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebugger: React.FC = () => {
  const auth = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  
  // Add state tracking to prevent infinite loops
  const prevStateRef = useRef<string>('');
  
  // Track renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, []);
  
  // Log auth state changes - with fix for infinite loop
  useEffect(() => {
    // Create a unique key from the auth state to detect real changes
    const stateKey = `${auth.authState}-${auth.isLoading}-${auth.isAuthenticated}-${auth.user?.id || 'none'}`;
    
    // Skip if the state hasn't meaningfully changed
    if (prevStateRef.current === stateKey) {
      return;
    }
    
    // Update reference to current state
    prevStateRef.current = stateKey;
    
    console.log('AuthDebugger detected auth state change:', {
      authState: auth.authState,
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      user: auth.user?.email || null,
      role: auth.user?.role || null,
      timestamp: new Date().toISOString(),
      renderCount
    });
    
    // Log to localStorage
    try {
      const logs = JSON.parse(localStorage.getItem('auth_debug_logs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        authState: auth.authState,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        user: auth.user?.email,
        role: auth.user?.role,
        area: 'state-change'
      });
      
      // Keep only last 20 logs
      if (logs.length > 20) logs.shift();
      localStorage.setItem('auth_debug_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Error logging auth debug:', e);
    }
  }, [auth.authState, auth.isAuthenticated, auth.isLoading, auth.user, renderCount]);
  
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
        className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded-full cursor-pointer z-50"
        onClick={() => setExpanded(true)}
      >
        🔍
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-0 right-0 bg-black bg-opacity-80 text-white p-4 text-xs max-w-sm overflow-auto max-h-96 rounded-tl-lg z-50">
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
        <div className="mb-1"><span className="font-semibold">Auth State:</span> {auth.authState}</div>
        <div className="mb-1"><span className="font-semibold">isLoading:</span> {auth.isLoading.toString()}</div>
        <div className="mb-1"><span className="font-semibold">isAuthenticated:</span> {auth.isAuthenticated.toString()}</div>
        <div className="mb-1"><span className="font-semibold">user:</span> {auth.user ? auth.user.email : 'null'}</div>
        <div className="mb-1"><span className="font-semibold">role:</span> {auth.user ? auth.user.role : 'null'}</div>
        {auth.error && (
          <div className="mb-1 text-red-400">
            <span className="font-semibold">Error:</span> {auth.error.message}
          </div>
        )}
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
            localStorage.removeItem('auth_redirect_path');
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
              <div>[{log.area}] {log.authState}</div>
              <div>{log.user ? `User: ${log.user}` : 'No user'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger;