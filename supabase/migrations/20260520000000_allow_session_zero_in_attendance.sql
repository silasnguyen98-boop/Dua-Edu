-- Allow session_number = 0 (buổi 0) trong attendance_records.
-- Buổi 0 là buổi mở đầu, được điểm danh nhưng không tính vào điểm chuyên cần.

alter table public.attendance_records
  drop constraint if exists attendance_records_session_number_check;

alter table public.attendance_records
  add constraint attendance_records_session_number_check
  check (session_number >= 0);