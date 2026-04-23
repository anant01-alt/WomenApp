import React, { useState, useEffect } from 'react';
import { sosAPI } from '../services/api';
import { format } from 'date-fns';
import styles from './HistoryPage.module.css';

const statusConfig = {
  active: { label: 'Active', cls: 'badge-danger', icon: '🚨' },
  resolved: { label: 'Resolved', cls: 'badge-success', icon: '✅' },
  cancelled: { label: 'Cancelled', cls: 'badge-muted', icon: '❌' },
  'false-alarm': { label: 'False Alarm', cls: 'badge-amber', icon: '⚠️' },
};

export default function HistoryPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadHistory(); }, [page, filter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter) params.status = filter;
      const { data } = await sosAPI.getHistory(params);
      setAlerts(data.alerts);
      setPagination(data.pagination);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className={`fade-in ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className="section-title">Incident History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Complete log of all SOS alerts and emergency events
          </p>
        </div>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
          style={{ width: 'auto', padding: '8px 16px' }}>
          <option value="">All Alerts</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="cancelled">Cancelled</option>
          <option value="false-alarm">False Alarm</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading history...</div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, marginBottom: 8 }}>No incidents found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {filter ? `No alerts with status "${filter}"` : 'You have no recorded SOS alerts. Stay safe!'}
          </p>
        </div>
      ) : (
        <div className={styles.alertsList}>
          {alerts.map((alert) => {
            const sc = statusConfig[alert.status] || statusConfig.cancelled;
            const isOpen = expanded === alert._id;
            return (
              <div key={alert._id} className={`card ${styles.alertCard}`}>
                <div className={styles.alertHeader} onClick={() => setExpanded(isOpen ? null : alert._id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{sc.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {alert.type.toUpperCase()} Alert
                        <span className={`badge ${sc.cls}`} style={{ marginLeft: 10, fontSize: 11 }}>{sc.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {format(new Date(alert.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                      {alert.notifiedContacts?.length || 0} notified
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className={`${styles.alertDetails} fade-in`}>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailBox}>
                        <div className={styles.detailLabel}>📍 Location</div>
                        <div className={styles.detailValue}>
                          {alert.location?.address || `${alert.location?.lat?.toFixed(4)}, ${alert.location?.lng?.toFixed(4)}`}
                        </div>
                        {alert.location?.lat && (
                          <a
                            href={`https://www.google.com/maps?q=${alert.location.lat},${alert.location.lng}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, color: 'var(--pink)', marginTop: 4, display: 'block' }}>
                            View on Google Maps ↗
                          </a>
                        )}
                      </div>
                      <div className={styles.detailBox}>
                        <div className={styles.detailLabel}>💬 Message</div>
                        <div className={styles.detailValue}>{alert.message}</div>
                      </div>
                      {alert.resolvedAt && (
                        <div className={styles.detailBox}>
                          <div className={styles.detailLabel}>✅ Resolved At</div>
                          <div className={styles.detailValue}>
                            {format(new Date(alert.resolvedAt), 'dd MMM yyyy, hh:mm a')}
                          </div>
                        </div>
                      )}
                    </div>
                    {alert.notifiedContacts?.length > 0 && (
                      <div className={styles.contactsNotified}>
                        <div className={styles.detailLabel} style={{ marginBottom: 8 }}>👥 Contacts Notified</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {alert.notifiedContacts.map((nc, i) => (
                            <span key={i} className="badge badge-muted">{nc.name} — {nc.phone}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {alert.locationHistory?.length > 1 && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                        📡 {alert.locationHistory.length} location updates tracked during this incident
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button className="btn-ghost" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Page {page} of {pagination.pages}</span>
          <button className="btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>Next →</button>
        </div>
      )}
    </div>
  );
}
