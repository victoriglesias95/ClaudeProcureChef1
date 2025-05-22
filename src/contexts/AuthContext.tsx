// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '../services/supabase';

// ======= Type Definitions =======
export type UserRole = 'chef' | 'purchasing' | 'admin';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
};

type AuthState = 'initial' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authState: AuthState;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// ======= Create Context =======
// CHANGED: Named export instead of default export
export const AuthContext = createContext<AuthContextType | null>(null);

// ======= Custom Hook =======
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ======= Provider Component =======
export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('initial');
  const [error, setError] = useState<Error | null>(null);
  
  // Boot flag to prevent race conditions
  const hasBooted = useRef(false);
  
  // For debugging
  const debugRef = useRef({
    lastAuthState: '',
    lastAction: '',
    lastTime: Date.now()
  });

  // Convenience boolean flags - these are what components actually use
  const isLoading = authState === 'initial' || authState === 'loading';
  const isAuthenticated = authState === 'authenticated' && user !== null;

  // Log state changes in development
  useEffect(() => {
    const now = Date.now();
    console.log(`[Auth] State changed to: ${authState}`, { 
      user: user?.email, 
      role: user?.role,
      isLoading,
      isAuthenticated,
      hasBooted: hasBooted.current,
      error: error?.message,
      previousState: debugRef.current.lastAuthState,
      timeSinceLast: now - debugRef.current.lastTime + 'ms'
    });
    
    // Update debug info
    debugRef.current = {
      lastAuthState: authState,
      lastAction: 'state change',
      lastTime: now
    };
  }, [authState, user, isLoading, isAuthenticated, error]);

  // ENHANCED: Function to create a user record if it doesn't exist
  const ensureUserRecord = async (userId: string, email: string | undefined): Promise<User> => {
    try {
      console.log('[Auth] Ensuring user record exists for:', userId);
      
      // Add timeout for database operation
      const timeoutPromise = new Promise<User>((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timed out')), 3000);
      });
      
      // Try to get existing user with a race against timeout
      const fetchPromise = (async () => {
        console.log('[Auth] Fetching user from database');
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
  
        console.log('[Auth] Database response:', { existingUser, fetchError });
  
        if (fetchError) {
          console.log('[Auth] Creating new user record in database');
          // User record doesn't exist, create one with default role
          const newUser: User = {
            id: userId,
            email: email || '',
            role: 'admin' as UserRole, // Add type assertion here too
            name: 'User'
          };
  
          const { error: insertError } = await supabase
            .from('users')
            .insert(newUser);
  
          if (insertError) {
            console.error('[Auth] Failed to create user record:', insertError);
            throw insertError;
          }
  
          console.log('[Auth] Created new user record:', newUser);
          return newUser;
        }
  
        console.log('[Auth] Found existing user record:', existingUser);
        
        // Ensure role is valid, update if not
        if (!existingUser.role) {
          console.log('[Auth] User missing role, setting default role');
          const updatedUser = { ...existingUser, role: 'admin' as UserRole };
          
          await supabase
            .from('users')
            .update({ role: 'admin' })
            .eq('id', userId);

          return updatedUser;
        }
        
        return existingUser as User;
      })();
  
      // Race database operation against timeout
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err) {
      console.error('[Auth] Error in ensureUserRecord:', err);
      
      // CRITICAL: Return a fallback user even on error
      const fallbackUser = {
      id: userId,
      email: email || '',
      role: 'admin' as UserRole,  // Add type assertion
      name: 'User (Fallback)'
      };
      
      console.log('[Auth] Returning fallback user:', fallbackUser);
      return fallbackUser;
    }
  };

  // Check session on initial load
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('[Auth] Checking for existing session');
        
        // Don't set loading state if we're already authenticated
        if (!isAuthenticated) {
          setAuthState('loading');
        }
        
        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (authState === 'loading' && !hasBooted.current) {
            console.warn('[Auth] Session check timed out - forcing unauthenticated state');
            setUser(null);
            setAuthState('unauthenticated');
            setError(new Error('Authentication check timed out'));
            // Don't set hasBooted here - we want the listener to still be able to authenticate
          }
        }, 5000);

        // Check for existing session
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // Clear timeout since we got a response
        clearTimeout(timeoutId);

        // CRITICAL FIX: Ensure we handle auth state transition correctly
        if (data?.session && !hasBooted.current) {
          console.log('[Auth] Found existing session, fetching user data');
          // Session exists, get or create user record
          const userData = await ensureUserRecord(
            data.session.user.id,
            data.session.user.email
          );
          
          console.log('[Auth] Setting user and authenticated state');
          setUser(userData);
          setAuthState('authenticated');
          hasBooted.current = true;
        } else if (!data?.session && !hasBooted.current) {
          console.log('[Auth] No session found or already booted, setting unauthenticated state');
          // No session or already handled by listener
          setUser(null);
          setAuthState('unauthenticated');
          // Don't set hasBooted - initial state is 'not booted'
        }
      } catch (err) {
        console.error('[Auth] Session check failed:', err);
        if (!hasBooted.current) {
          setUser(null);
          setAuthState('unauthenticated'); // Changed to unauthenticated instead of error
          setError(err instanceof Error ? err : new Error('Session check failed'));
        }
      }
    };

    checkSession();
  }, []);

  // Set up auth listener
  useEffect(() => {
    console.log('[Auth] Setting up auth state change listener');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[Auth] Auth event: ${event}`, { 
          hasSession: !!session, 
          hasBooted: hasBooted.current,
          currentAuthState: authState
        });

        if (event === 'SIGNED_IN' && session) {
          console.log('[Auth] Processing SIGNED_IN event');
          
          try {
            // Update regardless of boot state - sign in is explicit
            const userData = await ensureUserRecord(
              session.user.id,
              session.user.email
            );
            
            console.log('[Auth] SIGNED_IN: User record retrieved, updating state');
            setUser(userData);
            setAuthState('authenticated');
            hasBooted.current = true;
          } catch (err) {
            console.error('[Auth] Error handling sign in:', err);
            
            // Only update state if we haven't booted yet
            if (!hasBooted.current) {
              setUser(null);
              setAuthState('error');
              setError(err instanceof Error ? err : new Error('Error processing sign in'));
            }
          }
        } 
        else if (event === 'SIGNED_OUT') {
          console.log('[Auth] Processing SIGNED_OUT event');
          setUser(null);
          setAuthState('unauthenticated');
          setError(null);
          // Reset boot flag on sign out
          hasBooted.current = false;
        }
        else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed - no state change needed');
          // No state change needed, just log it
        }
      }
    );

    // Safety timeout for the auth listener setup
    const listenerTimeoutId = setTimeout(() => {
      if (authState === 'initial' && !hasBooted.current) {
        console.warn('[Auth] Auth listener setup timed out - forcing unauthenticated state');
        setAuthState('unauthenticated');
      }
    }, 3000);

    // Cleanup subscription and timeout
    return () => {
      console.log('[Auth] Cleaning up auth listener');
      clearTimeout(listenerTimeoutId);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log('[Auth] Attempting sign in for:', email);
      setAuthState('loading');
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      console.log('[Auth] Sign in successful, auth state will be updated by listener');
      // Auth state will be updated by the onAuthStateChange listener
      
      // Safety timeout for sign-in process
      setTimeout(() => {
        if (authState === 'loading') {
          console.warn('[Auth] Sign-in state update timed out - forcing check');
          // Force a re-check of the session
          supabase.auth.getSession().then(({ data }) => {
            if (data?.session && !hasBooted.current) {
              ensureUserRecord(data.session.user.id, data.session.user.email)
                .then(userData => {
                  setUser(userData);
                  setAuthState('authenticated');
                  hasBooted.current = true;
                });
            }
          });
        }
      }, 2000);
    } catch (err) {
      console.error('[Auth] Sign-in failed:', err);
      setAuthState('error');
      setError(err instanceof Error ? err : new Error('Sign in failed'));
      throw err;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      console.log('[Auth] Signing out');
      setAuthState('loading');
      
      await supabase.auth.signOut();
      
      // Reset boot flag
      hasBooted.current = false;
      
      // Force state update in case the listener doesn't trigger
      setTimeout(() => {
        if (authState !== 'unauthenticated') {
          console.log('[Auth] Forcing sign-out state update');
          setUser(null);
          setAuthState('unauthenticated');
        }
      }, 500);
      
      // Auth state will be updated by the onAuthStateChange listener
    } catch (err) {
      console.error('[Auth] Sign-out failed:', err);
      setAuthState('error');
      setError(err instanceof Error ? err : new Error('Sign out failed'));
      
      // Force reset state even on error
      setUser(null);
      setAuthState('unauthenticated');
      hasBooted.current = false;
      throw err;
    }
  };

  // Create context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    authState,
    error,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// NO default export here - use named exports only