import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [alertFilter, setAlertFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, userSearch]);
  useEffect(() => { if (tab === 'alerts') loadAlerts(); }, [tab, alertFilter]);

  const loadStats = async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data);
    } catch {}
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const { data } = await adminAPI.getUsers({ search: userSearch });
      setUsers(data.users);
    } catch {}
  };

  const loadAlerts = async () => {
    try {
      const params = alertFilter ? { status: alertFilter } : {};
      const { data } = await adminAPI.getAlerts(params);
      setAlerts(data.alerts);
    } catch {}
  };

  const toggleUser = async (id, name, current) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success(`${name} ${current ? 'deactivated' : 'activated'}`);
      loadUsers();
    } catch { toast.error('Action failed'); }
  };

  const resolveAlert = async (id, status) => {
    try {
      await adminAPI.resolveAlert(id, { status });
      toast.success('Alert updated');
      loadAlerts();
      loadStats();
    } catch { toast.error('Failed to update alert'); }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.stats.totalUsers, icon: '👥', color: 'var(--pink)' },
    { label: 'Active Users', value: stats.stats.activeUsers, icon: '✅', color: 'var(--success)' },
    { label: 'Total Alerts', value: stats.stats.totalAlerts, icon: '🚨', color: 'var(--danger)' },
    { label: 'Active Emergencies', value: stats.stats.activeAlerts, icon: '⚡', color: 'var(--amber)' },
    { label: 'Resolved', value: stats.stats.resolvedAlerts, icon: '🔒', color: 'var(--teal)' },
  ] : [];

  return (
    <div className={`fade-in ${styles.page}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="section-title">Admin Panel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>System overview and management</p>
        </div>
        <span className="badge badge-amber">⚙️ Administrator</span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['overview', 'users', 'alerts'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.active : ''}`}
            onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : '🚨 Alerts'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="fade-in">
          <div className={styles.statsGrid}>
            {statCards.map(s => (
              <div key={s.label} className={`card ${styles.statCard}`}>
                <div style={{ fontSize: 28, background: s.color + '22', width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {stats?.recentAlerts?.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, marginBottom: 16 }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.recentAlerts.map(a => (
                  <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                    <span style={{ fontSize: 20 }}>🚨</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {format(new Date(a.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </div>
                    </div>
                    <span className={`badge badge-${a.status === 'active' ? 'danger' : a.status === 'resolved' ? 'success' : 'muted'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {tab === 'users' && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: 16 }}>
            <input placeholder="Search users by name or email..." value={userSearch}
              onChange={e => setUserSearch(e.target.value)} />
          </div>
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: 'var(--pink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-amber' : 'badge-muted'}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }}
                          onClick={() => toggleUser(u._id, u.name, u.isActive)}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No users found</div>}
          </div>
        </div>
      )}

      {/* Alerts tab */}
      {tab === 'alerts' && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)} style={{ width: 'auto' }}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
              <option value="false-alarm">False Alarm</option>
            </select>
          </div>
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead><tr><th>User</th><th>Type</th><th>Location</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontSize: 13 }}>{a.user?.name || 'Unknown'}</td>
                    <td><span className="badge badge-danger">{a.type.toUpperCase()}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {a.location?.lat?.toFixed(3)}, {a.location?.lng?.toFixed(3)}
                    </td>
                    <td><span className={`badge badge-${a.status === 'active' ? 'danger' : a.status === 'resolved' ? 'success' : 'muted'}`}>{a.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(a.createdAt), 'dd MMM, hh:mm a')}</td>
                    <td>
                      {a.status === 'active' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => resolveAlert(a._id, 'resolved')}>Resolve</button>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}
                            onClick={() => resolveAlert(a._id, 'false-alarm')}>False Alarm</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {alerts.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No alerts found</div>}
          </div>
        </div>
      )}
    </div>
  );
}
