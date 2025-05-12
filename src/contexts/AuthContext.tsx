// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';

// Define types
type User = {
  id: string;
  email: string;
  role: 'chef' | 'purchasing' | 'admin';
  name?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Hook for using auth context
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Debug log state changes
  useEffect(() => {
    console.log("[AUTH:Debug] Auth state:", { 
      isAuthenticated, 
      isLoading, 
      hasUser: !!user,
      userEmail: user?.email,
      userRole: user?.role
    });
  }, [user, isAuthenticated, isLoading]);

  // Function to create a standardized user record
  const createUserRecord = async (userId: string, email: string | undefined) => {
    // CRITICAL: Always ensure role is set to a valid value
    const newUser = {
      id: userId,
      email: email || '',
      role: 'admin' as const, // Default role
      name: 'User'
    };
    
    console.log("[AUTH:createUser] Creating user record:", newUser);
    
    try {
      const { error } = await supabase
        .from('users')
        .insert(newUser);
        
      if (error) {
        console.error("[AUTH:error] Failed to create user record:", error);
        // Still return the user object even if DB insert failed
      }
      
      return newUser;
    } catch (error) {
      console.error("[AUTH:error] Exception creating user record:", error);
      return newUser;
    }
  };

  // Function to get or create user from DB
  const getUserFromDB = async (userId: string, email: string | undefined): Promise<User> => {
    try {
      console.log("[AUTH:getUser] Fetching user data for:", userId);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, name')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn("[AUTH:getUser] Error fetching user:", error);
        // Create user if not found
        return await createUserRecord(userId, email);
      }
      
      if (!data) {
        console.warn("[AUTH:getUser] User not found in database");
        // Create user if not found
        return await createUserRecord(userId, email);
      }
      
      // Verify role exists and is valid
      if (!data.role) {
        console.warn("[AUTH:getUser] User missing role, setting default role");
        data.role = 'admin';
        
        // Update the user record with the role
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', userId);
          
        if (updateError) {
          console.error("[AUTH:error] Failed to update user role:", updateError);
        }
      }
      
      console.log("[AUTH:getUser] User data retrieved:", data);
      return data as User;
    } catch (error) {
      console.error("[AUTH:error] Exception in getUserFromDB:", error);
      // Return fallback user
      return {
        id: userId,
        email: email || '',
        role: 'admin',
        name: 'User'
      };
    }
  };

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        console.log("[AUTH:init] Checking initial session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AUTH:error] Session check error:", error);
          setIsLoading(false);
          return;
        }
        
        if (data?.session) {
          console.log("[AUTH:session] Found existing session");
          // Get or create user
          const userData = await getUserFromDB(
            data.session.user.id, 
            data.session.user.email
          );
          
          // CRITICAL: Always ensure userData has a role
          if (!userData.role) {
            userData.role = 'admin';
          }
          
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          console.log("[AUTH:session] No active session");
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("[AUTH:error] Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Setup auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AUTH:event] ${event}`, { hasSession: !!session });
        
        if (event === 'SIGNED_IN' && session) {
          setIsLoading(true);
          
          try {
            // Get or create user
            const userData = await getUserFromDB(
              session.user.id, 
              session.user.email
            );
            
            // CRITICAL: Always ensure userData has a role
            if (!userData.role) {
              userData.role = 'admin';
            }
            
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error("[AUTH:error] Error handling sign in:", error);
            // Fallback user
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'admin',
              name: 'User'
            });
            setIsAuthenticated(true);
          } finally {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    );
    
    // Run initial check
    checkSession();
    
    // Safety timeout
    const timeout = setTimeout(() => {
      console.log("[AUTH:timeout] Safety timeout triggered");
      setIsLoading(false);
    }, 5000);
    
    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    console.log("[AUTH:signIn] Attempting sign in with:", email);
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("[AUTH:error] Sign-in failed:", error);
        throw error;
      }
      
      console.log("[AUTH:signIn] Sign in successful, data:", data.user?.id);
      
      if (data.user) {
        // Get or create user
        const userData = await getUserFromDB(
          data.user.id, 
          data.user.email
        );
        
        // CRITICAL: Always ensure userData has a role
        if (!userData.role) {
          userData.role = 'admin';
        }
        
        console.log("[AUTH:signIn] Setting authenticated state with user:", userData);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("[AUTH:error] Sign-in process failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    console.log("[AUTH:signOut] Signing out");
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("[AUTH:error] Sign-out failed:", error);
      // Force state reset even if sign-out fails
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export
export { AuthContext, useAuth, AuthProvider };
export default AuthContext;