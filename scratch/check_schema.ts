import { supabase } from "../lib/supabase/client";

async function check() {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .limit(1);
  
  if (data) console.log("Cert Schema:", Object.keys(data[0]));
}
check();
