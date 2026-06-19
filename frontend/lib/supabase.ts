import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Guard — prevents crash during Docker build pre-rendering
if (!supabaseUrl || !supabaseKey) {
  if (typeof window !== "undefined") {
    // Only throw on the browser, not during server-side build
    throw new Error("Missing Supabase environment variables");
  }
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder-key"
);