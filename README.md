# Dua-Edu

## Admin system

Dua-Edu includes a Next.js admin dashboard for the Supabase tables in the
training schema:

- students
- teachers
- courses
- classes
- enrollments
- certificates

The dashboard supports listing, searching, creating, editing, and deleting
records for each table. It also supports Excel workflows:

- download a sample Excel file for the active table
- import rows from `.xlsx` or `.xls`
- export the current filtered rows to `.xlsx`

Import files avoid raw database IDs. Relationship columns use readable lookup
values instead:

- `course_code` for courses
- `teacher_email` for teachers
- `student_email` for students
- `class_code` for classes
- `enrollment_key` as `student_email|class_code` for certificates

## Supabase setup

This project uses Supabase through `@supabase/supabase-js`.

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nnkwzjkbzwehxryulshv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Then run:

```bash
npm install
npm run dev
```

## Docker

Run the admin dashboard on port `3007` with Docker Compose:

```bash
docker compose up --build
```

Open:

```bash
http://localhost:3007
```
