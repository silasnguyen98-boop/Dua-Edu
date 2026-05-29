// Move BK_13 attendance_records from session_number=1 to session_number=0,
// then recompute attendance_score for affected enrollments
// using the same formula as syncAttendanceScore (session 0 excluded).

const fs = require('fs');

const env = fs.readFileSync('/home/ubuntu/cuongdn_workspace_company/DuaEdu/.env.local', 'utf8');
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))[1].trim();
const URL = get('NEXT_PUBLIC_SUPABASE_URL');
const KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function rest(method, path, body) {
  const opts = { method, headers: { ...HEADERS, Prefer: 'return=representation' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const r = await fetch(`${URL}/rest/v1/${path}`, opts);
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${await r.text()}`);
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

const POINTS = { present: 1, late: 0.75, excused: 0.5, absent: 0 };

(async () => {
  // 1) Find BK_13
  const orFilter = encodeURIComponent(
    'class_code.ilike.%BK_13%,class_code.ilike.%BK13%,class_name.ilike.%BK_13%,class_name.ilike.%BK13%'
  );
  const classes = await rest('GET', `classes?select=id,class_code,class_name,total_sessions&or=(${orFilter})`);
  if (!classes.length) throw new Error('Không tìm thấy BK_13');
  if (classes.length > 1) throw new Error(`Có ${classes.length} lớp match BK_13 — dừng để tránh ảnh hưởng nhầm.`);
  const cls = classes[0];
  console.log(`Target: ${cls.class_code} — ${cls.class_name} [${cls.id}] · total_sessions=${cls.total_sessions}`);

  const totalSessions = Number(cls.total_sessions);
  if (!Number.isFinite(totalSessions) || totalSessions <= 0) {
    throw new Error(`total_sessions không hợp lệ: ${cls.total_sessions}`);
  }

  // 2) Enrollments in BK_13
  const enrollments = await rest('GET', `enrollments?select=id&class_id=eq.${cls.id}`);
  const enrollIds = enrollments.map(e => e.id);
  console.log(`Enrollments: ${enrollIds.length}`);
  if (!enrollIds.length) return;
  const enrollIn = `(${enrollIds.map(id => `"${id}"`).join(',')})`;

  // 3) Move attendance_records: session_number 1 -> 0 (scoped to BK_13 enrollments only)
  const moved = await rest(
    'PATCH',
    `attendance_records?enrollment_id=in.${enrollIn}&session_number=eq.1`,
    { session_number: 0 },
  );
  console.log(`Moved ${moved?.length ?? 0} attendance_records from session 1 -> 0`);

  // 4) Recompute attendance_score for each enrollment (same formula as syncAttendanceScore)
  const allRecords = await rest(
    'GET',
    `attendance_records?select=enrollment_id,session_number,status&enrollment_id=in.${enrollIn}`,
  );
  const byEnroll = new Map();
  for (const r of allRecords) {
    if (!byEnroll.has(r.enrollment_id)) byEnroll.set(r.enrollment_id, []);
    byEnroll.get(r.enrollment_id).push(r);
  }

  let updated = 0;
  for (const enrollId of enrollIds) {
    const rows = byEnroll.get(enrollId) || [];
    let totalPoints = 0;
    for (const r of rows) {
      if (Number(r.session_number) === 0) continue;
      totalPoints += POINTS[r.status] ?? 0;
    }
    const score = Number(((totalPoints / totalSessions) * 10).toFixed(2));
    await rest('PATCH', `enrollments?id=eq.${enrollId}`, { attendance_score: score });
    updated++;
  }
  console.log(`Recomputed attendance_score for ${updated} enrollments`);

  // 5) Verify
  const v1 = await rest('GET', `attendance_records?select=id&enrollment_id=in.${enrollIn}&session_number=eq.1`);
  const v0 = await rest('GET', `attendance_records?select=id&enrollment_id=in.${enrollIn}&session_number=eq.0`);
  console.log(`Verify: buổi 1 còn ${v1.length} record, buổi 0 hiện có ${v0.length} record`);
})().catch(e => { console.error(e); process.exit(1); });