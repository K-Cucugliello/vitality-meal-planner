import { createClient } from '@supabase/supabase-js'

// These variables must match the names in your .env file and Vercel settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Use 'export const' so you can import { supabase } in your pages
export const supabase = createClient(supabaseUrl, supabaseAnonKey)