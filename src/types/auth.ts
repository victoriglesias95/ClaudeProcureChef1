// src/types/auth.ts - Clean type definitions
export type UserRole = 'chef' | 'purchasing' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  user: User | null;
  authState: AuthState;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: Error | null;
}