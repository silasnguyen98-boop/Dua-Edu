export default function HomePage() {
  return (
    <main className="update-page">
      <section className="update-card">
        <img alt="Dua Edu" src="https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png" />
        <h1>Hệ thống đang update!</h1>
      </section>

      <style jsx>{`
        .update-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 32%),
            linear-gradient(135deg, #f7fbf8, #eef7f3);
          color: #10231d;
          font-family: var(--font-geist-sans);
        }

        .update-card {
          width: min(100%, 460px);
          padding: 36px;
          text-align: center;
          border: 1px solid #dbe7e1;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 24px 70px rgba(15, 35, 29, 0.12);
        }

        .update-card img {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          object-fit: cover;
          background: white;
          box-shadow: 0 14px 30px rgba(16, 35, 29, 0.12);
        }

        .update-card h1 {
          margin: 22px 0 0;
          font-size: clamp(30px, 6vw, 44px);
          line-height: 1.08;
          letter-spacing: 0;
        }
      `}</style>
    </main>
  );
}
