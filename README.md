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
records for each table.

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

Run the admin dashboard on port `3002` with Docker Compose:

```bash
docker compose up --build
```

Open:

```bash
http://localhost:3002
```
