"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./certificate.css";

const Search = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

export default function CertificateSearchPage() {
  const [certId, setCertId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setIsLoading(true);
    router.push(`/certificate/${certId.trim().toUpperCase()}`);
  };

  return (
    <div className="cert-system-body">
      <div className="google-search-container">
        {/* Official Brand Logo */}
        <div className="google-logo-area">
          <img 
            src="/logo.png" 
            alt="DUA Edu Logo" 
            style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 4 }} 
          />
          <p style={{ color: '#70757a', fontSize: 16, fontWeight: 500, letterSpacing: '0.02em', margin: 0 }}>Xác thực thành quả, khẳng định năng lực</p>
        </div>

        {/* Google-style Search Box */}
        <form onSubmit={handleSearch} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="google-search-box-wrap">
            <div className="google-search-box">
              <div className="google-search-icon">
                <Search />
              </div>
              <input
                type="text"
                placeholder="Nhập mã chứng nhận (Ví dụ: DA-COMP-A1B2)"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                className="google-search-input"
                autoFocus
              />
            </div>
          </div>

          <div className="google-button-row">
            <button type="submit" disabled={isLoading} className="google-btn google-btn-primary" style={{ minWidth: 160 }}>
              {isLoading ? "Đang xử lý..." : "Tra cứu ngay"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '5vh', color: '#70757a', fontSize: 13 }}>
          <p>Chứng nhận được xác thực bởi DUA Edu - Data Upgrade Ability</p>
        </div>
      </div>
    </div>
  );
}
