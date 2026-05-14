import { supabase } from "@/lib/supabase/client";

export async function debug() {
  const { data, error } = await supabase.from("classes").select("id, class_code, class_name").limit(5);
  console.log("DEBUG CLASSES:", data, error);
}
