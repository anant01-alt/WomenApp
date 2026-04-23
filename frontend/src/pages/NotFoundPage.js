import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-deep)', gap: 20, textAlign: 'center', padding: 32
    }}>
      <div style={{ fontSize: 64 }}>🛡️</div>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 42, fontWeight: 800, color: 'var(--pink)' }}>404</h1>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22 }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 300 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-block', marginTop: 8 }}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}
