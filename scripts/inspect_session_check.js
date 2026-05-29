// Inspect the check constraint on attendance_records.session_number
const fs = require('fs');
const env = fs.readFileSync('/home/ubuntu/cuongdn_workspace_company/DuaEdu/.env.local', 'utf8');
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))[1].trim();
const URL = get('NEXT_PUBLIC_SUPABASE_URL');
const KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

(async () => {
  const sql = `
    select conname, pg_get_constraintdef(oid) as def
    from pg_constraint
    where conrelid in ('public.attendance_records'::regclass, 'public.class_sessions'::regclass)
      and contype = 'c';
  `;
  // PostgREST doesn't expose arbitrary SQL — use rpc if available, else inspect via information_schema
  // Try a public RPC; if absent, fall back to documenting the error.
  const r = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ sql }),
  });
  console.log('exec_sql status:', r.status);
  console.log(await r.text());
})().catch(e => { console.error(e); process.exit(1); });