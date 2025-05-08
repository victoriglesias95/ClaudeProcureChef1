import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the User type
type User = {
  id: string;
  email: string;
  role: 'chef' | 'purchasing' | 'admin';
};

// Define the context type
export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Props type for the provider
type AuthProviderProps = {
  children: ReactNode;
};

// The Auth Provider component
export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for existing session on mount
  useEffect(() => {
    // This would normally connect to Supabase to check for an active session
    const checkSession = async () => {
      // Placeholder for actual authentication logic
      const storedUser = localStorage.getItem('procurechef_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    };
    
    checkSession();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log(`Attempting to sign in with email: ${email} and password length: ${password.length}`);
      // Placeholder for actual sign-in logic
      // In a real app, this would verify credentials with Supabase
      const mockUser = {
        id: '1',
        email,
        role: 'admin' as const // Mock role for testing
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('procurechef_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Sign-in error:', error);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Placeholder for actual sign-out logic
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('procurechef_user');
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;