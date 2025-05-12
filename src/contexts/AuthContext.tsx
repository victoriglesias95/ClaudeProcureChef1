// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';

// Define the User type
type User = {
  id: string;
  email: string;
  role: 'chef' | 'purchasing' | 'admin';
  name?: string;
};

// Define the context type
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | null>(null);

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
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking session...");
        // Get session from Supabase
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        console.log("Session response received:", !!data?.session);
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setIsLoading(false);
          return;
        }
        
        if (data?.session) {
          // Get user details from users table
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, email, role, name')
              .eq('id', data.session.user.id)
              .single();
            
            console.log("User data query executed");
            
            if (userError) {
              console.error("User data error:", userError);
              setIsLoading(false);
              return;
            }
            
            if (userData) {
              console.log("Setting user data:", userData);
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              console.warn("No user data found in the users table");
              // Auto-create a user record if it doesn't exist
              try {
                const newUser = {
                  id: data.session.user.id,
                  email: data.session.user.email,
                  role: 'admin', // Default role
                  name: 'User'
                };
                
                const { error: createError } = await supabase
                  .from('users')
                  .insert(newUser);
                
                if (createError) {
                  console.error("Error creating user record:", createError);
                } else {
                  console.log("Created missing user record");
                  setUser(newUser as User);
                  setIsAuthenticated(true);
                }
              } catch (createError) {
                console.error("Failed to create user record:", createError);
              }
            }
          } catch (userDataError) {
            console.error("Error in user data fetch:", userDataError);
          }
        } else {
          console.log("No active session found");
        }
        
        console.log("About to finish checkSession, isLoading will be set to false");
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        console.log("Setting isLoading to false in finally block");
        setIsLoading(false);
      }
    };
    
    // Setup auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change event:", event, "Session:", !!session);
      
      if (event === 'SIGNED_IN' && session) {
        setIsLoading(true);
        try {
          console.log("User signed in, fetching user data...");
          // Get user details from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, role, name')
            .eq('id', session.user.id)
            .single();
          
          if (userError) {
            console.error("User data error on auth change:", userError);
            setIsLoading(false);
            return;
          }
          
          console.log("User data on auth change:", userData);
          
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.warn("No user record found for authenticated user");
            // Auto-create a user record if it doesn't exist
            try {
              const newUser = {
                id: session.user.id,
                email: session.user.email,
                role: 'admin', // Default role
                name: 'User'
              };
              
              const { error: createError } = await supabase
                .from('users')
                .insert(newUser);
              
              if (createError) {
                console.error("Error creating user record:", createError);
              } else {
                console.log("Created missing user record");
                setUser(newUser as User);
                setIsAuthenticated(true);
              }
            } catch (createError) {
              console.error("Failed to create user record:", createError);
            }
          }
        } catch (error) {
          console.error("Error fetching user data on auth change:", error);
        } finally {
          console.log("Setting isLoading to false after auth change");
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });
    
    // Run initial session check
    checkSession();
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.log("Safety timeout triggered after 5 seconds");
      setIsLoading(false);
    }, 5000);
    
    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Attempting sign in with:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign-in error:', error);
        throw error;
      }
      
      console.log("Sign in successful, user:", data.user);
      
      if (data.user) {
        // Get user details from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, role, name')
          .eq('id', data.user.id)
          .single();
        
        if (userError) {
          console.error('User data fetch error:', userError);
          
          // Auto-create a user record if it doesn't exist
          try {
            const newUser = {
              id: data.user.id,
              email: data.user.email,
              role: 'admin', // Default role
              name: 'User'
            };
            
            const { error: createError } = await supabase
              .from('users')
              .insert(newUser);
            
            if (createError) {
              console.error("Error creating user record:", createError);
            } else {
              console.log("Created missing user record");
              setUser(newUser as User);
              setIsAuthenticated(true);
            }
          } catch (createError) {
            console.error("Failed to create user record:", createError);
            throw createError;
          }
        } else if (userData) {
          console.log("User data after sign in:", userData);
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Sign-in process error:', error);
      throw error;
    } finally {
      console.log("Setting isLoading to false after sign in");
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign-out error:', error);
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

  // ONLY CHANGE: Remove UI rendering logic from the provider
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Add this for backward compatibility with any code importing the default export