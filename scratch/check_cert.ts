import { supabase } from "../lib/supabase/client";

async function check() {
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("email", "nguyenlam.nt99@gmail.com")
    .single();

  if (student) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id, class_id, certificates(certificate_code)")
      .eq("student_id", student.id);
    
    console.log("Enrollments & Certs:", JSON.stringify(enrollments, null, 2));
  } else {
    console.log("Student not found");
  }
}
check();
