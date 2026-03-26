import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://mxviqollhcndppuougkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dmlxb2xsaGNuZHBwdW91Z2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzA1NTUsImV4cCI6MjA5MDAwNjU1NX0.B0zKEFtM70YNWCSdCpm4mr4y7nV_Mf90ao2qkHBZ5xQ'; // Replace with actual key or use env vars

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
