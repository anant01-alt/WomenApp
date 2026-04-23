import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePwChange = (e) => setPwForm({ ...pwForm, [e.target.name]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Min 6 characters');
    setSaving(true);
    try {
      await authAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setSaving(false); }
  };

  return (
    <div className={`fade-in ${styles.page}`}>
      <h1 className="section-title">My Profile</h1>

      {/* Profile card */}
      <div className="card">
        <div className={styles.profileHero}>
          <div className={styles.heroAvatar}>{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22 }}>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <span className={`badge ${user?.role === 'admin' ? 'badge-amber' : 'badge-pink'}`}>
                {user?.role === 'admin' ? '⚙️ Admin' : '👤 User'}
              </span>
              <span className={`badge ${user?.safetyStatus === 'safe' ? 'badge-success' : 'badge-danger'}`}>
                {user?.safetyStatus === 'safe' ? '✅ Safe' : '🚨 Emergency'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['profile', 'security'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`}
            onClick={() => setTab(t)}>
            {t === 'profile' ? '👤 Profile Info' : '🔒 Security'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card fade-in">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, marginBottom: 20 }}>Personal Information</h3>
          <form onSubmit={saveProfile} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
              </div>
              <div className={styles.field}>
                <label>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
              </div>
              <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="Your address" />
              </div>
              <div className={styles.field}>
                <label>Email (cannot change)</label>
                <input value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="card fade-in">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={savePassword} className={styles.form}>
            <div className={styles.field}>
              <label>Current Password</label>
              <input type="password" name="currentPassword" value={pwForm.currentPassword}
                onChange={handlePwChange} placeholder="Your current password" required />
            </div>
            <div className={styles.field}>
              <label>New Password</label>
              <input type="password" name="newPassword" value={pwForm.newPassword}
                onChange={handlePwChange} placeholder="Min 6 characters" required />
            </div>
            <div className={styles.field}>
              <label>Confirm New Password</label>
              <input type="password" name="confirm" value={pwForm.confirm}
                onChange={handlePwChange} placeholder="Re-enter new password" required />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
