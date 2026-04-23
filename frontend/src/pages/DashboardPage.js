import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSOS } from '../context/SOSContext';
import { sosAPI, userAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import styles from './DashboardPage.module.css';

// AI: simple rule-based safety assessment
const getAISafetyAssessment = (location) => {
  const hour = new Date().getHours();
  const isLateNight = hour >= 22 || hour < 5;
  const isMidnight = hour >= 0 && hour < 3;

  // Mock unsafe zones (in production use real geofencing data)
  const unsafeZones = [
    { lat: 28.6139, lng: 77.2090, radius: 0.05, name: 'High-incident area' },
  ];

  let riskLevel = 'low';
  let warnings = [];

  if (isMidnight) { riskLevel = 'high'; warnings.push('You are out very late (midnight hours). Stay in safe, well-lit areas.'); }
  else if (isLateNight) { riskLevel = 'medium'; warnings.push('It is late night. Please stay aware of your surroundings.'); }

  if (location) {
    for (const zone of unsafeZones) {
      const dist = Math.sqrt(Math.pow(location.lat - zone.lat, 2) + Math.pow(location.lng - zone.lng, 2));
      if (dist < zone.radius) {
        riskLevel = 'high';
        warnings.push(`You are near a ${zone.name}. Exercise extra caution.`);
      }
    }
  }

  return { riskLevel, warnings };
};

const riskColors = { low: 'var(--success)', medium: 'var(--amber)', high: 'var(--danger)' };
const riskLabels = { low: '✅ LOW RISK', medium: '⚠️ MEDIUM RISK', high: '🚨 HIGH RISK' };

export default function DashboardPage() {
  const { user } = useAuth();
  const { triggerSOS, isEmergency } = useSOS();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [location, setLocation] = useState(null);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    getLocation();
  }, []);

  useEffect(() => {
    if (location !== undefined) {
      setAiAssessment(getAISafetyAssessment(location));
    }
  }, [location]);

  const loadData = async () => {
    try {
      const [alertRes, contactRes] = await Promise.all([
        sosAPI.getHistory({ limit: 5 }),
        userAPI.getContacts(),
      ]);
      setAlerts(alertRes.data.alerts);
      setContacts(contactRes.data.contacts);
    } catch {}
    finally { setLoading(false); }
  };

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation(null)
    );
  };

  const stats = [
    { label: 'Emergency Contacts', value: contacts.length, max: 5, icon: '👥', color: 'var(--pink)' },
    { label: 'Total SOS Alerts', value: alerts.length, icon: '🚨', color: 'var(--danger)' },
    { label: 'Resolved Alerts', value: alerts.filter(a => a.status === 'resolved').length, icon: '✅', color: 'var(--success)' },
    { label: 'Safety Status', value: isEmergency ? 'EMERGENCY' : 'Safe', icon: '🛡️', color: isEmergency ? 'var(--danger)' : 'var(--success)' },
  ];

  return (
    <div className={`fade-in ${styles.page}`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className={`btn-primary ${styles.sosQuickBtn}`} onClick={() => navigate('/sos')}>
          🆘 SOS Emergency
        </button>
      </div>

      {/* AI Safety Assessment */}
      {aiAssessment && (
        <div className={styles.aiCard} style={{ borderColor: riskColors[aiAssessment.riskLevel] + '66' }}>
          <div className={styles.aiHeader}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                AI Safety Assessment
              </div>
              <div style={{ fontWeight: 700, color: riskColors[aiAssessment.riskLevel], fontSize: 15, marginTop: 2 }}>
                {riskLabels[aiAssessment.riskLevel]}
              </div>
            </div>
          </div>
          {aiAssessment.warnings.length > 0 ? (
            aiAssessment.warnings.map((w, i) => (
              <div key={i} className={styles.aiWarning}>{w}</div>
            ))
          ) : (
            <div className={styles.aiWarning} style={{ color: 'var(--success)' }}>
              All conditions look normal. Stay aware of your surroundings.
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={`card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: s.color + '22', color: s.color }}>{s.icon}</div>
            <div>
              <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
              {s.max && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>of {s.max} max</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom two columns */}
      <div className={styles.bottomGrid}>
        {/* Recent Alerts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16 }}>Recent Alerts</h3>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => navigate('/history')}>
              View All
            </button>
          </div>
          {loading ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p> :
            alerts.length === 0 ? (
              <div className={styles.emptyState}>
                <div style={{ fontSize: 32 }}>✅</div>
                <p>No emergency alerts. Stay safe!</p>
              </div>
            ) : (
              <div className={styles.alertList}>
                {alerts.map((a) => (
                  <div key={a._id} className={styles.alertItem}>
                    <span style={{ fontSize: 20 }}>{a.type === 'sos' ? '🚨' : '⚠️'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.message?.slice(0, 50)}...</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <span className={`badge badge-${a.status === 'active' ? 'danger' : a.status === 'resolved' ? 'success' : 'muted'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, marginBottom: 16 }}>Quick Actions</h3>
          <div className={styles.quickActions}>
            {[
              { icon: '🆘', label: 'Trigger SOS', desc: 'Send emergency alert', action: () => navigate('/sos'), color: 'var(--danger)' },
              { icon: '👥', label: 'Manage Contacts', desc: 'Add trusted contacts', action: () => navigate('/contacts'), color: 'var(--pink)' },
              { icon: '🗺', label: 'Live Map', desc: 'View your location', action: () => navigate('/map'), color: 'var(--teal)' },
              { icon: '💬', label: 'Emergency Chat', desc: 'Message your contacts', action: () => navigate('/chat'), color: 'var(--amber)' },
            ].map((q) => (
              <button key={q.label} className={styles.quickBtn} onClick={q.action}>
                <span style={{ fontSize: 24, background: q.color + '22', padding: '8px', borderRadius: 10 }}>{q.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{q.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
