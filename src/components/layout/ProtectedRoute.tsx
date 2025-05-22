// src/components/layout/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: ProtectedRouteProps): JSX.Element => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading, authState } = useAuth();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("ProtectedRoute rendering with auth state:", { 
        path: location.pathname,
        authState,
        isAuthenticated, 
        isLoading, 
        userEmail: user?.email,
        userRole: user?.role 
      });
    }
  }, [location.pathname, authState, isAuthenticated, isLoading, user]);
  
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
    // Save the location they were trying to go to for later redirect
    localStorage.setItem('auth_redirect_path', location.pathname + location.search);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Not authenticated at ${location.pathname}, redirecting to login`);
    }
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user has required role (if specified)
  if (requiredRole && user.role !== requiredRole) {
    if (process.env.NODE_ENV === 'development') {
      console.log("User does not have required role:", { 
        required: requiredRole, 
        actual: user.role 
      });
    }
    
    // User doesn't have the required role - redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }
  
  // User is authenticated and has required role (if any)
  return <>{children ? children : <Outlet />}</>;
};

export default ProtectedRoute;