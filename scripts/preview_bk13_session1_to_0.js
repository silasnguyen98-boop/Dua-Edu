// DRY-RUN preview: how many BK_13 attendance_records at session_number=1
// would be moved to session_number=0, and whether any session_number=0 already exists
// (which would conflict with the unique (enrollment_id, session_number) constraint).

const fs = require('fs');

const env = fs.readFileSync('/home/ubuntu/cuongdn_workspace_company/DuaEdu/.env.local', 'utf8');
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))[1].trim();
const URL = get('NEXT_PUBLIC_SUPABASE_URL');
const KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function rest(path) {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: HEADERS });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

(async () => {
  // 1) Find BK_13 class(es) — match common variants
  const orFilter = encodeURIComponent(
    'class_code.ilike.%BK_13%,class_code.ilike.%BK13%,class_name.ilike.%BK_13%,class_name.ilike.%BK13%'
  );
  const classes = await rest(`classes?select=id,class_code,class_name,total_sessions&or=(${orFilter})`);
  console.log('--- Lớp khớp BK_13 ---');
  for (const c of classes) {
    console.log(`  ${c.class_code || '(no code)'} — ${c.class_name} [id=${c.id}] · total_sessions=${c.total_sessions}`);
  }
  if (!classes.length) { console.log('Không tìm thấy lớp BK_13.'); return; }

  const classIds = classes.map(c => c.id);
  const classIn = `(${classIds.map(id => `"${id}"`).join(',')})`;

  // 2) Enrollments in those classes
  const enrollments = await rest(`enrollments?select=id,student_id,class_id&class_id=in.${classIn}`);
  console.log(`\n${enrollments.length} enrollments trong BK_13`);

  const enrollIds = enrollments.map(e => e.id);
  if (!enrollIds.length) return;

  // 3) Attendance records at session_number = 1 for those enrollments
  const enrollIn = `(${enrollIds.map(id => `"${id}"`).join(',')})`;
  const session1 = await rest(`attendance_records?select=id,enrollment_id,session_number,status&enrollment_id=in.${enrollIn}&session_number=eq.1`);
  console.log(`\nSố record attendance_records ở buổi 1: ${session1.length}`);
  const byStatus1 = session1.reduce((acc, r) => { acc[r.status || 'null'] = (acc[r.status || 'null'] || 0) + 1; return acc; }, {});
  console.log('  Phân bố status:', byStatus1);

  // 4) Existing session_number = 0 records (conflict check)
  const session0 = await rest(`attendance_records?select=id,enrollment_id,session_number,status&enrollment_id=in.${enrollIn}&session_number=eq.0`);
  console.log(`\nSố record attendance_records ĐÃ tồn tại ở buổi 0: ${session0.length}`);
  if (session0.length) {
    const conflictEnrollIds = new Set(session0.map(r => r.enrollment_id));
    const session1ConflictCount = session1.filter(r => conflictEnrollIds.has(r.enrollment_id)).length;
    console.log(`  -> Trong đó CONFLICT với buổi 1 (cùng enrollment_id): ${session1ConflictCount}`);
  }

  // 5) class_sessions: have a buổi 1 row for BK_13?
  const cs1 = await rest(`class_sessions?select=id,class_id,session_number,session_title&class_id=in.${classIn}&session_number=eq.1`);
  const cs0 = await rest(`class_sessions?select=id,class_id,session_number,session_title&class_id=in.${classIn}&session_number=eq.0`);
  console.log(`\nclass_sessions buổi 1: ${cs1.length}, buổi 0: ${cs0.length}`);
  for (const s of cs1) console.log(`  buổi 1: "${s.session_title}" [id=${s.id}]`);
  for (const s of cs0) console.log(`  buổi 0: "${s.session_title}" [id=${s.id}]`);
})().catch(e => { console.error(e); process.exit(1); });