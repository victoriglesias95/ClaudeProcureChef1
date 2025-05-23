// src/contexts/AuthContext.tsx - Clean component-only file for HMR compatibility
import { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { User, AuthState, AuthContextType } from '../types/auth';

export const AuthContext = createContext<AuthContextType | null>(null);

// Utility function with better error handling and timeout
async function ensureUserRecord(userId: string, email: string): Promise<User> {
  const timeoutMs = 8000; // 8 second timeout
  
  try {
    console.log('[Auth] Ensuring user record for:', { userId, email });
    
    // Wrap database operations in timeout
    const operation = async (): Promise<User> => {
      // First, check if the users table exists and is accessible
      console.log('[Auth] Checking for existing user...');
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('[Auth] User query result:', { 
        hasUser: !!existingUser, 
        errorCode: selectError?.code, 
        errorMessage: selectError?.message 
      });

      if (selectError) {
        if (selectError.code === 'PGRST116') {
          // Table doesn't exist
          console.error('[Auth] Users table does not exist');
          throw new Error('SETUP_REQUIRED: Users table not found - please run database setup');
        } else if (selectError.code === 'PGRST103') {
          // No user found, this is expected for new users
          console.log('[Auth] No existing user found, will create new user');
        } else if (selectError.code === 'PGRST301') {
          // Permission denied
          console.error('[Auth] Permission denied accessing users table');
          throw new Error('PERMISSION_DENIED: Cannot access users table - check RLS policies');
        } else {
          console.error('[Auth] Database error:', selectError);
          throw new Error(`DATABASE_ERROR: ${selectError.message}`);
        }
      }

      if (existingUser) {
        console.log('[Auth] Found existing user:', existingUser.email);
        return existingUser as User;
      }

      // Create new user with default chef role
      console.log('[Auth] Creating new user record...');
      const newUser: User = {
        id: userId,
        email: email,
        role: 'chef', // Secure default
        name: 'User'
      };

      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (insertError) {
        console.error('[Auth] Failed to create user record:', insertError);
        throw new Error(`USER_CREATION_FAILED: ${insertError.message}`);
      }

      console.log('[Auth] Successfully created user:', insertedUser.email);
      return insertedUser as User;
    };

    // Race between operation and timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT: User record operation timed out')), timeoutMs)
    );

    const result = await Promise.race([operation(), timeoutPromise]);
    return result;
    
  } catch (error) {
    console.error('[Auth] Error in ensureUserRecord:', error);
    
    // In development mode, provide a fallback to prevent complete blocking
    if (process.env.NODE_ENV === 'development') {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('SETUP_REQUIRED')) {
        // Don't provide fallback for setup issues - user needs to run setup
        throw error;
      }
      
      console.warn('[Auth] Development mode: using fallback user due to error');
      return {
        id: userId,
        email: email,
        role: 'chef',
        name: 'Dev User (Fallback)'
      };
    }
    
    throw error;
  }
}

// React component - clean export for HMR
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    async function initializeAuth() {
      try {
        console.log('[Auth] Initializing auth...');
        setError(null);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session error:', error);
          if (mounted) {
            setError(error);
            setAuthState('unauthenticated');
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('[Auth] Found existing session for:', session.user.email);
          
          try {
            setIsProcessingAuth(true);
            const userData = await ensureUserRecord(session.user.id, session.user.email!);
            console.log('[Auth] Initial user record ensured successfully');
            
            if (mounted) {
              setUser(userData);
              setAuthState('authenticated');
            }
          } catch (userError) {
            console.error('[Auth] Failed to ensure user record during init:', userError);
            if (mounted) {
              setError(userError instanceof Error ? userError : new Error(String(userError)));
              setAuthState('unauthenticated');
            }
          } finally {
            if (mounted) {
              setIsProcessingAuth(false);
            }
          }
        } else if (mounted) {
          console.log('[Auth] No session found');
          setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        if (mounted) {
          setError(error instanceof Error ? error : new Error(String(error)));
          setAuthState('unauthenticated');
          setIsProcessingAuth(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state change:', event, session?.user?.email, { isProcessing: isProcessingAuth, mounted });
        
        if (!mounted) return;
        
        // Prevent duplicate processing
        if (isProcessingAuth) {
          console.log('[Auth] Already processing auth event, skipping...');
          return;
        }
        
        setError(null);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth] Processing sign in for:', session.user.email);
          
          try {
            setIsProcessingAuth(true);
            const userData = await ensureUserRecord(session.user.id, session.user.email!);
            console.log('[Auth] Sign in processing completed successfully');
            
            if (mounted) {
              setUser(userData);
              setAuthState('authenticated');
            }
          } catch (userError) {
            console.error('[Auth] Failed to process sign in:', userError);
            if (mounted) {
              setError(userError instanceof Error ? userError : new Error(String(userError)));
              setAuthState('unauthenticated');
            }
          } finally {
            if (mounted) {
              setIsProcessingAuth(false);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out');
          if (mounted) {
            setUser(null);
            setAuthState('unauthenticated');
            setIsProcessingAuth(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to prevent infinite loops

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Sign in called for:', email);
    setAuthState('loading');
    setError(null);
    setIsProcessingAuth(false);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[Auth] Sign in error:', error);
        setAuthState('unauthenticated');
        throw error;
      }
      console.log('[Auth] Sign in request successful, waiting for auth state change...');
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      setAuthState('unauthenticated');
      setError(error instanceof Error ? error : new Error(String(error)));
      setIsProcessingAuth(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('[Auth] Sign out called');
    setError(null);
    setIsProcessingAuth(false);
    await supabase.auth.signOut();
  };

  const contextValue: AuthContextType = {
    user,
    authState,
    isAuthenticated: authState === 'authenticated',
    isLoading: authState === 'loading',
    signIn,
    signOut,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}