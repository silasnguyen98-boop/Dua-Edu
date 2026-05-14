import { supabase } from "../lib/supabase/client";

async function check() {
  const { data: certs, error } = await supabase
    .from("certificates")
    .select("certificate_code, enrollment_id, enrollments(student_id, students(email))")
    .eq("enrollments.students.email", "nguyenlam.nt99@gmail.com");
  
  console.log("Certs for nguyenlam:", JSON.stringify(certs, null, 2));
  if (error) console.log("Error:", error);
}
check();
