-- Allow session_number = 0 (buổi 0) trong class_sessions.
-- Buổi 0 là buổi mở đầu, có metadata buổi học bình thường,
-- nhưng không tính vào điểm chuyên cần.

alter table public.class_sessions
  drop constraint if exists class_sessions_session_number_check;

alter table public.class_sessions
  add constraint class_sessions_session_number_check
  check (session_number >= 0);