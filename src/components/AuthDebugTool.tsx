// src/components/AuthDebugTool.tsx - Temporary debugging component
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

const AuthDebugTool: React.FC = () => {
  const auth = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  const runDiagnostics = async () => {
    const results: any = {
      timestamp: new Date().toISOString(),
      authContext: {
        authState: auth.authState,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        hasUser: !!auth.user,
        userEmail: auth.user?.email,
        hasError: !!auth.error,
        errorMessage: auth.error?.message
      }
    };

    // Test 1: Supabase connection
    try {
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      results.supabaseConnection = {
        success: !error,
        error: error?.message,
        canAccessUsersTable: !error
      };
    } catch (err) {
      results.supabaseConnection = {
        success: false,
        error: String(err),
        canAccessUsersTable: false
      };
    }

    // Test 2: Current session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      results.currentSession = {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        error: error?.message
      };
    } catch (err) {
      results.currentSession = {
        hasSession: false,
        error: String(err)
      };
    }

    // Test 3: Try to query/create user record (if we have a session)
    if (results.currentSession.hasSession && results.currentSession.userId) {
      try {
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('*')
          .eq('id', results.currentSession.userId)
          .single();

        results.userRecord = {
          exists: !!existingUser && !selectError,
          data: existingUser,
          selectError: selectError?.message,
          selectErrorCode: selectError?.code
        };

        // If user doesn't exist, try to create one
        if (!existingUser && selectError?.code === 'PGRST103') {
          const newUser = {
            id: results.currentSession.userId,
            email: results.currentSession.userEmail,
            role: 'chef',
            name: 'Debug User'
          };

          const { data: createdUser, error: insertError } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

          results.userCreation = {
            success: !!createdUser && !insertError,
            data: createdUser,
            error: insertError?.message,
            errorCode: insertError?.code
          };
        }
      } catch (err) {
        results.userRecord = {
          exists: false,
          error: String(err)
        };
      }
    }

    // Test 4: Environment variables
    results.environment = {
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      supabaseUrlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
      isDevelopment: process.env.NODE_ENV === 'development'
    };

    setDebugInfo(results);
  };

  useEffect(() => {
    if (auth.isLoading) {
      const timer = setTimeout(() => {
        runDiagnostics();
      }, 5000); // Run diagnostics after 5 seconds of loading

      return () => clearTimeout(timer);
    }
  }, [auth.isLoading]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <>
      {/* Debug trigger button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50 text-xs"
        title="Auth Debug Tool"
      >
        🔍 Debug
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-lg max-h-96 overflow-auto z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Auth Debug Info</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <button
              onClick={runDiagnostics}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
            >
              Run Diagnostics
            </button>
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded ml-2"
            >
              Go to Admin
            </button>
          </div>

          {Object.keys(debugInfo).length > 0 && (
            <div className="text-xs">
              <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {auth.error && (
            <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-sm font-medium text-red-800">Current Error:</p>
              <p className="text-xs text-red-700">{auth.error.message}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AuthDebugTool;