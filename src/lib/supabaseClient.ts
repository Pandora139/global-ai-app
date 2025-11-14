// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Un único cliente para toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("✅ Conectando a Supabase:", process.env.NEXT_PUBLIC_SUPABASE_URL);

