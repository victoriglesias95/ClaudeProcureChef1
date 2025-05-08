import { createClient } from '@supabase/supabase-js';

// Using placeholder values for development
const supabaseUrl = 'https://example.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);