import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './AuthPage.module.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}! 💙`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authLeft}>
        <div className={styles.brandArea}>
          <div className={styles.brandIcon}>🛡️</div>
          <h1 className={styles.brandTitle}>SafeGuard</h1>
          <p className={styles.brandSubtitle}>AI-Powered Women Safety & Emergency Response System</p>
          <div className={styles.features}>
            {['One-tap SOS alerts', 'Real-time GPS tracking', 'Emergency contact notifications', 'AI threat detection'].map(f => (
              <div key={f} className={styles.featureItem}><span>✓</span> {f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.authRight}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Welcome back</h2>
            <p>Sign in to your SafeGuard account</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Email Address</label>
              <input type="email" name="email" placeholder="your@email.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••"
                value={form.password} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className={styles.demoBox}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Demo credentials</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>User: demo@safeguard.com / demo123</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Admin: admin@safeguard.com / admin123</div>
          </div>

          <p className={styles.switchLink}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
