// src/contexts/AuthContext.tsx - Replace your current file with this
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';

export type UserRole = 'chef' | 'purchasing' | 'admin';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
};

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextType = {
  user: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  const ensureUserRecord = async (userId: string, email: string): Promise<User> => {
    try {
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !existingUser) {
        // Create new user with default chef role
        const newUser: User = {
          id: userId,
          email: email,
          role: 'chef',
          name: 'User'
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert(newUser);

        if (insertError) {
          console.error('Failed to create user record:', insertError);
          // Return the user anyway, don't block login
        }

        return newUser;
      }

      return existingUser as User;
    } catch (error) {
      console.error('Error in ensureUserRecord:', error);
      // Return fallback user to prevent blocking
      return {
        id: userId,
        email: email,
        role: 'chef',
        name: 'User'
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Session error:', error);
          if (mounted) {
            setAuthState('unauthenticated');
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('[Auth] Found existing session');
          const userData = await ensureUserRecord(session.user.id, session.user.email!);
          setUser(userData);
          setAuthState('authenticated');
        } else if (mounted) {
          console.log('[Auth] No session found');
          setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        if (mounted) {
          setAuthState('unauthenticated');
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state change:', event);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth] User signed in');
          const userData = await ensureUserRecord(session.user.id, session.user.email!);
          setUser(userData);
          setAuthState('authenticated');
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out');
          setUser(null);
          setAuthState('unauthenticated');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Sign in called');
    setAuthState('loading');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[Auth] Sign in error:', error);
        setAuthState('unauthenticated');
        throw error;
      }
      console.log('[Auth] Sign in successful');
      // Don't set state here - let the auth listener handle it
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      setAuthState('unauthenticated');
      throw error;
    }
  };

  const signOut = async () => {
    console.log('[Auth] Sign out called');
    await supabase.auth.signOut();
    // Don't set state here - let the auth listener handle it
  };

  const contextValue = {
    user,
    authState,
    isAuthenticated: authState === 'authenticated',
    isLoading: authState === 'loading',
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};