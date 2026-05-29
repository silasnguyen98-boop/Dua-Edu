// Query students enrolled in BK_13 / BK_14 who have >= 2 total enrollments.
// Uses Supabase PostgREST directly (no SDK realtime websocket).

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

const chunk = (arr, n) => arr.length <= n ? [arr] : [arr.slice(0, n), ...chunk(arr.slice(n), n)];

(async () => {
  // 1) Find BK_13 / BK_14 classes
  const orFilter = encodeURIComponent(
    'class_code.ilike.%BK_13%,class_code.ilike.%BK_14%,class_code.ilike.%BK13%,class_code.ilike.%BK14%,' +
    'class_name.ilike.%BK_13%,class_name.ilike.%BK_14%,class_name.ilike.%BK13%,class_name.ilike.%BK14%'
  );
  const classes = await rest(`classes?select=id,class_code,class_name&or=(${orFilter})`);
  console.log('--- Lớp khớp BK_13 / BK_14 ---');
  for (const c of classes) console.log(`  ${c.class_code || '(no code)'} — ${c.class_name} [${c.id}]`);
  if (!classes.length) { console.log('Không tìm thấy lớp nào.'); return; }

  const targetIds = classes.map(c => c.id);

  // 2) Enrollments in those classes
  const targetEnrolls = await rest(
    `enrollments?select=student_id,class_id,status&class_id=in.(${targetIds.join(',')})`
  );
  const studentIds = [...new Set(targetEnrolls.map(e => e.student_id))];
  console.log(`\n${targetEnrolls.length} enrollments trong BK_13/BK_14 — ${studentIds.length} học viên duy nhất`);

  // 3) All enrollments for those students
  let allEnroll = [];
  for (const ids of chunk(studentIds, 80)) {
    const part = await rest(
      `enrollments?select=student_id,class_id,status,classes(class_code,class_name)&student_id=in.(${ids.join(',')})`
    );
    allEnroll = allEnroll.concat(part);
  }

  // 4) Group by student
  const perStudent = {};
  for (const e of allEnroll) {
    (perStudent[e.student_id] ||= []).push({
      class_code: e.classes?.class_code,
      class_name: e.classes?.class_name,
      status: e.status,
    });
  }

  // 5) Keep students with >= 2 total enrollments
  const qualifying = Object.entries(perStudent).filter(([, list]) => list.length >= 2);

  // 6) Hydrate students
  const qIds = qualifying.map(([id]) => id);
  let students = [];
  for (const ids of chunk(qIds, 80)) {
    const part = await rest(`students?select=id,full_name,email,phone&id=in.(${ids.join(',')})`);
    students = students.concat(part);
  }
  const byId = Object.fromEntries(students.map(s => [s.id, s]));

  console.log(`\n=== TONG: ${qualifying.length} hoc vien thuoc BK_13/BK_14 va da hoc >= 2 lop ===\n`);
  const rows = qualifying.map(([sid, list]) => {
    const s = byId[sid] || { full_name: '?', email: '?', phone: '' };
    return {
      full_name: s.full_name,
      email: s.email,
      phone: s.phone || '',
      total_classes: list.length,
      classes: list.map(x => `${x.class_code || x.class_name || '?'}(${x.status})`).join(' | '),
    };
  });
  rows.sort((a, b) => b.total_classes - a.total_classes || a.full_name.localeCompare(b.full_name));

  console.log('| # | Ho ten | Email | SDT | So lop | Danh sach lop |');
  console.log('|---|--------|-------|-----|--------|---------------|');
  rows.forEach((r, i) =>
    console.log(`| ${i + 1} | ${r.full_name} | ${r.email} | ${r.phone} | ${r.total_classes} | ${r.classes} |`)
  );
})().catch(e => { console.error(e); process.exit(1); });
