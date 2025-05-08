import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'chef' | 'purchasing' | 'admin';
}

const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: ProtectedRouteProps): JSX.Element => {
  const { user, isAuthenticated } = useAuth();
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role (if specified)
  if (requiredRole && user?.role !== requiredRole) {
    // User doesn't have the required role - redirect to dashboard or unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }
  
  // User is authenticated and has required role (if any)
  return <>{children ? children : <Outlet />}</>;
};

export default ProtectedRoute;