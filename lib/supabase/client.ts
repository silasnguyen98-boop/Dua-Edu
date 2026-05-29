import { createClient } from "@supabase/supabase-js";

const directUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!directUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabasePublishableKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

// Browser uses same-origin proxy (/api/sb/*) to bypass networks that block supabase.co.
// Server-side keeps the direct URL.
const supabaseUrl =
  typeof window !== "undefined" ? `${window.location.origin}/api/sb` : directUrl;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
