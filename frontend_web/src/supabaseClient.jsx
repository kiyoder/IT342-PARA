import { createClient } from "@supabase/supabase-js"

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Verify environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables")
}

// Create Supabase client with improved configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
    // Add global error handler
    global: {
        fetch: (...args) => {
            return fetch(...args).catch((err) => {
                console.error("Supabase fetch error:", err)
                throw err
            })
        },
    },
    // Add retry configuration
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
})

// Log successful initialization
console.log("Supabase client initialized")
