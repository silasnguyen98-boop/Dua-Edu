# Dua-Edu

Next.js admin dashboard for managing the Dua-Edu training database on Supabase.
It provides a clean interface for operators to browse, search, edit, import, and export core training records.

## What It Does

- Manage `students`, `teachers`, `courses`, `classes`, `enrollments`, and `certificates`
- Search and filter records quickly across the admin tables
- Create, update, and delete data with a dashboard UI
- Import from `.xlsx` / `.xls` spreadsheets
- Export filtered table data back to Excel
- Generate and verify electronic certificates

## Data Import Format

Imports avoid raw database IDs. Use readable lookup values instead:

- `course_code` for courses
- `teacher_email` for teachers
- `student_email` for students
- `class_code` for classes
- `enrollment_key` as `student_email|class_code` for certificates

## Requirements

- Node.js 20+
- Supabase project
- Python 3 for certificate image generation

## Environment

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nnkwzjkbzwehxryulshv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Local Development

```bash
npm install
npm run dev
```

Open the app at:

```bash
http://localhost:3000
```

## Docker

The Docker setup runs the app on port `3007`.

```bash
docker compose up --build
```

Open:

```bash
http://localhost:3007
```

## Project Notes

- Admin routing and certificate pages are built with Next.js App Router
- Certificate images are generated dynamically through a Python script
- The dashboard is configured to work with Supabase-backed training data

## Useful Commands

```bash
npm run dev
npm run build
npm run start
docker compose up --build
```
