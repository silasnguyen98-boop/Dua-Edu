"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import "../certificate.css";

const ChevronLeft = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const CheckCircle2 = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default function CertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCert() {

      const { data: cert, error } = await supabase
        .from("certificates")
        .select(`
          certificate_code, 
          issued_at, 
          certificate_type,
          enrollments (
            students (full_name),
            classes (
              courses (name)
            )
          )
        `)
        .eq("certificate_code", id)
        .maybeSingle();

      if (error) {
        console.error("Supabase Detailed Error:", error.message, error.details, error.hint);
      }

      if (cert) {
        setData(cert);
      }
      setLoading(false);
    }
    fetchCert();
  }, [id]);

  if (loading) return <div className="cert-system-body" style={{ display: 'grid', placeItems: 'center', color: '#70757a' }}>Đang xác thực thông tin...</div>;
  if (!data) return <div className="cert-system-body" style={{ display: 'grid', placeItems: 'center', color: '#70757a' }}>Không tìm thấy mã chứng nhận này.</div>;

  const imageUrl = `/api/certificate/${data.certificate_code}?v=${new Date().getTime()}`;

  return (
    <div className="cert-system-body">
      <nav className="pro-nav">
        <Link href="/certificate" className="pro-nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Logo" style={{ height: 32, width: 'auto' }} />
          <span>DUA Edu</span>
        </Link>
        <Link href="/certificate" style={{ color: '#5f6368', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <ChevronLeft /> Quay lại tra cứu
        </Link>
      </nav>

      <main className="pro-grid">
        <div className="pro-cert-card">
          <img src={imageUrl} alt="Chứng nhận" style={{ width: '100%', display: 'block', borderRadius: 4 }} />
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => window.open(imageUrl, '_blank')}
              className="google-btn google-btn-primary"
              style={{ height: 40, padding: '0 24px', borderRadius: 20 }}
            >
              Tải xuống bản gốc (.png)
            </button>
          </div>
        </div>

        <div className="pro-info-sidebar">
          <div className="pro-info-card">
            <div className="pro-verified-badge">
              <CheckCircle2 /> ĐÃ XÁC THỰC
            </div>
            
            <h2 className="pro-info-title">Thông tin chứng nhận</h2>
            
            <div className="pro-info-row">
              <div className="pro-info-label">LOẠI CHỨNG NHẬN</div>
              <div className="pro-info-value" style={{ color: (data.certificate_type?.toLowerCase() === 'participation' || data.certificate_type === 'Tham gia') ? '#e67e22' : '#0f9d58' }}>
                {(data.certificate_type?.toLowerCase() === 'participation' || data.certificate_type === 'Tham gia') ? 'CHỨNG NHẬN THAM GIA' : 'CHỨNG NHẬN HOÀN THÀNH'}
              </div>
            </div>

            <div className="pro-info-row">
              <div className="pro-info-label">HỌ TÊN HỌC VIÊN</div>
              <div className="pro-info-value" style={{ fontSize: 18 }}>{data.enrollments?.students?.full_name}</div>
            </div>

            <div className="pro-info-row">
              <div className="pro-info-label">KHÓA HỌC</div>
              <div className="pro-info-value">{data.enrollments?.classes?.courses?.name}</div>
            </div>

            <div className="pro-info-row">
              <div className="pro-info-label">NGÀY CẤP CHỨNG NHẬN</div>
              <div className="pro-info-value">
                {new Date(data.issued_at).toLocaleDateString("vi-VN", {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </div>
            </div>

            <div className="pro-info-row">
              <div className="pro-info-label">MÃ SỐ XÁC MINH</div>
              <div className="pro-info-value" style={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>{data.certificate_code}</div>
            </div>

            <div style={{ marginTop: 40, padding: 20, background: '#f8f9fa', borderRadius: 8, fontSize: 13, color: '#5f6368', lineHeight: 1.5 }}>
              Đây là chứng nhận điện tử chính thức được cấp bởi <strong>DUA Edu</strong>. Bạn có thể sử dụng mã số này để xác minh tính pháp lý của chứng nhận tại website của chúng tôi.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
