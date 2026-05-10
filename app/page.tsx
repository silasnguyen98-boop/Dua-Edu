import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const isConfigured = Boolean(supabase);

  return (
    <main>
      <section className="panel">
        <h1>Dua-Edu</h1>
        <p>
          Supabase client is configured with your public project URL and
          publishable key.
        </p>
        <div className="status" aria-live="polite">
          <span className="dot" aria-hidden="true" />
          {isConfigured ? "Supabase ready" : "Supabase not configured"}
        </div>
      </section>
    </main>
  );
}
