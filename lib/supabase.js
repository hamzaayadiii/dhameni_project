import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://agvzxgkusdrxgijbzwtt.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndnp4Z2t1c2RyeGdpamJ6d3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTgzMDgsImV4cCI6MjA5MjM3NDMwOH0.4rvSYaSzupEcOzrrV022I6wydJHjx6FMvo-L9J7iJh0"


//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
//const  supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 


export const supabase = createClient(supabaseUrl,  supabaseKey)



