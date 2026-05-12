import Link from 'next/link';

export default function NotFound() {
  const logoUrl = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";
  
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <img src={logoUrl} alt="Dua Edu Logo" className="not-found-logo" />
        <div className="error-code">404</div>
        <h1 className="not-found-title">Không tìm thấy trang</h1>
        <p className="not-found-text">
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển. 
          Vui lòng kiểm tra lại địa chỉ hoặc quay về trang chủ.
        </p>
        <Link href="/" className="not-found-button">
          Quay lại trang chủ
        </Link>
      </div>
      
      <style jsx>{`
        .not-found-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f6f8fb 0%, #eef4f8 100%);
          padding: 20px;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .not-found-card {
          max-width: 480px;
          width: 100%;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 24px;
          padding: 48px 32px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
        }
        .not-found-logo {
          width: 80px;
          height: auto;
          margin-bottom: 24px;
        }
        .error-code {
          font-size: 84px;
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(135deg, #0fb981, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px;
          letter-spacing: -0.04em;
        }
        .not-found-title {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }
        .not-found-text {
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .not-found-button {
          display: inline-block;
          background: linear-gradient(135deg, #0fb981, #059669);
          color: white;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 8px 20px rgba(15, 185, 129, 0.25);
        }
        .not-found-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(15, 185, 129, 0.35);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}
