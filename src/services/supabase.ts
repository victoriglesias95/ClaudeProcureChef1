import { createClient } from '@supabase/supabase-js';

// Type declaration for Vite environment variables
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Use the interface to type cast import.meta.env
const env = import.meta.env as ImportMetaEnv;

// Now we can access env variables with proper type checking
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example';

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  }
});

// Log if we're using the development database
if (supabaseUrl === 'https://example.supabase.co') {
  console.warn('Using development Supabase client - no real database connection');
}