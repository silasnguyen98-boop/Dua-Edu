// Verify whether class_sessions allows session_number=0.
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
  const text = await r.text();
  return { status: r.status, body: text };
}

(async () => {
  const cls = await rest('GET', `classes?select=id,class_code&class_code=eq.BK_13`);
  console.log('BK_13:', cls.body);
  const classes = JSON.parse(cls.body);
  if (!classes.length) return console.error('Không tìm thấy BK_13');
  const classId = classes[0].id;

  // First check if session_number=0 already exists
  const existing = await rest('GET', `class_sessions?class_id=eq.${classId}&session_number=eq.0`);
  console.log('Existing session 0:', existing.body);

  // Try to insert a session_number=0 row
  const insert = await rest('POST', 'class_sessions', {
    class_id: classId,
    session_number: 0,
    session_title: '__test_session_zero__',
  });
  console.log(`Insert session 0 -> status ${insert.status}`);
  console.log(insert.body);

  // Clean up if insert succeeded
  if (insert.status === 201) {
    const row = JSON.parse(insert.body)[0];
    const del = await rest('DELETE', `class_sessions?id=eq.${row.id}`);
    console.log(`Cleanup -> status ${del.status}`);
  }
})().catch(e => { console.error(e); process.exit(1); });