// src/lib/supabase.js
// Supabase client for server-side API routes

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Safe initialization for build time
export const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : {
        // Mock client that throws only when used (runtime)
        from: () => { throw new Error('Supabase not initialized (Missing Env Vars)'); },
        rpc: () => { throw new Error('Supabase not initialized (Missing Env Vars)'); }
    };
