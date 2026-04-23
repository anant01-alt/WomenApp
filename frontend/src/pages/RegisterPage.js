import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      login(data.user, data.token);
      toast.success(`Welcome to SafeGuard, ${data.user.name}! 🛡️`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authWrapper}>
      <div className={styles.authLeft}>
        <div className={styles.brandArea}>
          <div className={styles.brandIcon}>🛡️</div>
          <h1 className={styles.brandTitle}>Join SafeGuard</h1>
          <p className={styles.brandSubtitle}>
            Create your account and take the first step toward a safer life. Your safety is our mission.
          </p>
          <div className={styles.features}>
            {['Free to use, always', 'Add up to 5 trusted contacts', 'Real-time emergency alerts', 'Your data is private & secure'].map(f => (
              <div key={f} className={styles.featureItem}><span>✓</span> {f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.authRight}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Create account</h2>
            <p>Set up your SafeGuard profile</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Full Name</label>
              <input name="name" placeholder="Your full name" value={form.name} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Email Address</label>
              <input type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Phone Number</label>
              <input name="phone" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label>Confirm Password</label>
              <input type="password" name="confirm" placeholder="Re-enter password" value={form.confirm} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p className={styles.switchLink}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
