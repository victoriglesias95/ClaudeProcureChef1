// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

const Login = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, isAuthenticated, authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Use effect to handle navigation AFTER auth state updates
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Login] User authenticated, redirecting');
      // Check for saved redirect path
      const redirectPath = localStorage.getItem('auth_redirect_path') || '/';
      localStorage.removeItem('auth_redirect_path');
      
      // Check for state from location (React Router's way)
      const locationState = location.state as { from?: { pathname: string } };
      const from = locationState?.from?.pathname || redirectPath;
      
      navigate(from);
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('[Login] Attempting to sign in with:', email);
      await signIn(email, password);
      // No navigation here - let the useEffect handle it
    } catch (err: any) {
      console.error('[Login] Error during sign in:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">ProcureChef Login</h1>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          <div className="text-sm mb-4 text-gray-500">
            Auth State: {authState}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <Button 
              type="submit" 
              variant="primary"
              fullWidth
              isLoading={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;