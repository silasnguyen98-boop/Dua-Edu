import { supabase } from "../lib/supabase/client";

async function check() {
  const { data, error } = await supabase
    .from("students")
    .select("id, email, full_name")
    .eq("email", "nguyenlam.nt99@gmail.com")
    .single();
  
  if (error) {
    console.log("Error or Not Found:", error.message);
  } else {
    console.log("Found Student:", data);
  }
}
check();
