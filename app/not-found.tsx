import Link from 'next/link';

export default function NotFound() {
  const logoUrl = "https://i.ibb.co/3yKrstMS/Thie-t-ke-chu-a-co-te-n-20.png";
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f6f8fb 0%, #eef4f8 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        borderRadius: '24px',
        padding: '48px 32px',
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.1)'
      }}>
        <img src={logoUrl} alt="Dua Edu Logo" style={{ width: '80px', marginBottom: '24px' }} />
        <div style={{
          fontSize: '84px',
          fontWeight: '900',
          color: '#10b981',
          marginBottom: '16px',
          letterSpacing: '-0.04em'
        }}>404</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>
          Không tìm thấy trang
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', marginBottom: '32px' }}>
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển. 
          Vui lòng kiểm tra lại địa chỉ hoặc quay về trang chủ.
        </p>
        <Link href="/" style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '14px 28px',
          borderRadius: '12px',
          fontWeight: '700',
          textDecoration: 'none',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
        }}>
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
