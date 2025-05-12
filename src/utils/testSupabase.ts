import { supabase } from '../services/supabase';

export async function testSupabaseConnection() {
  console.log("Testing Supabase connection...");
  try {
    // Test a simple query to check connection
    const { data, error } = await supabase.from('users').select('*', { count: 'exact' });
    console.log("Supabase connection test result:", { data, error });
    
    // Check if the connection is successful
    if (error) {
      console.error("Supabase connection failed:", error);
      return { success: false, error };
    }
    
    // Test auth connection
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log("Supabase auth test result:", { hasSession: !!sessionData?.session, sessionError });
    
    return { 
      success: true, 
      data, 
      sessionData,
      message: "Connection successful"
    };
  } catch (err) {
    console.error("Supabase connection test error:", err);
    return { success: false, error: err };
  }
}