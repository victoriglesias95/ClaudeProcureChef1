import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials - check your environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  }
});

// Helper function to check DB connection
export const checkDatabaseConnection = async () => {
  try {
    // Method 1: Just test if we can read from products table
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    return { connected: true, data };
  } catch (error) {
    console.error('Database connection error:', error);
    return { connected: false, error };
  }
};