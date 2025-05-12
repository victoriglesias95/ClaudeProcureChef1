// src/components/layout/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'chef' | 'purchasing' | 'admin';
}

const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: ProtectedRouteProps): JSX.Element => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    console.log("ProtectedRoute rendering with auth state:", { 
      path: location.pathname,
      isAuthenticated, 
      isLoading, 
      userEmail: user?.email,
      userRole: user?.role || 'undefined'
    });
  });
  
  // Show loading indicator while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-gray-700">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    console.log(`Not authenticated at ${location.pathname}, redirecting to login`);
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role (if specified)
  if (requiredRole && (!user.role || user.role !== requiredRole)) {
    console.log("User does not have required role:", { 
      required: requiredRole, 
      actual: user.role || 'undefined' 
    });
    // User doesn't have the required role - redirect to dashboard or unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }
  
  // User is authenticated and has required role (if any)
  console.log(`ProtectedRoute - auth checks passed for ${location.pathname}, rendering content`);
  return <>{children ? children : <Outlet />}</>;
};

export default ProtectedRoute;