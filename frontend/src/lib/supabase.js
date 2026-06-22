import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqnqygjqsbyflxwumvrt.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbnF5Z2pxc2J5Zmx4d3VtdnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NjM3NDMsImV4cCI6MjA5NzQzOTc0M30.CL1xXtrfm5zGHRO-5ikDvC-XNGbAETuvLB8UjAYKxVg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
