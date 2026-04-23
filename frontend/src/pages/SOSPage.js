import React, { useState, useEffect } from 'react';
import { useSOS } from '../context/SOSContext';
import { userAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import styles from './SOSPage.module.css';

export default function SOSPage() {
  const { triggerSOS, cancelSOS, isEmergency, activeAlert, currentLocation } = useSOS();
  const [contacts, setContacts] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [sosHeld, setSosHeld] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdTimer, setHoldTimer] = useState(null);

  useEffect(() => {
    userAPI.getContacts().then(r => setContacts(r.data.contacts)).catch(() => {});
    return () => { if (holdTimer) clearInterval(holdTimer); };
  }, []);

  const startHold = () => {
    setSosHeld(true);
    let progress = 0;
    const timer = setInterval(() => {
      progress += 3.33;
      setHoldProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(timer);
        setSosHeld(false);
        setHoldProgress(0);
        handleTriggerSOS();
      }
    }, 100);
    setHoldTimer(timer);
  };

  const cancelHold = () => {
    setSosHeld(false);
    setHoldProgress(0);
    if (holdTimer) { clearInterval(holdTimer); setHoldTimer(null); }
  };

  const handleTriggerSOS = async () => {
    if (triggering) return;
    setTriggering(true);
    try {
      await triggerSOS(customMessage);
    } catch {}
    finally { setTriggering(false); }
  };

  const presetMessages = [
    'I am being followed. Need immediate help!',
    'I feel unsafe. Please come to my location.',
    'Emergency! I need help right now!',
    'I am in danger. Call police and come to me.',
  ];

  return (
    <div className={`fade-in ${styles.page}`}>
      <div className={styles.header}>
        <h1 className="section-title">SOS Emergency</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {isEmergency ? '🚨 Emergency alert is currently active' : 'Hold the SOS button for 3 seconds to trigger an alert'}
        </p>
      </div>

      <div className={styles.layout}>
        {/* SOS Button Section */}
        <div className={styles.sosSection}>
          {!isEmergency ? (
            <>
              <div className={styles.sosRing}>
                <div className={styles.sosRing2}>
                  <button
                    className={`${styles.sosButton} ${sosHeld ? styles.holding : ''}`}
                    onMouseDown={startHold}
                    onMouseUp={cancelHold}
                    onMouseLeave={cancelHold}
                    onTouchStart={startHold}
                    onTouchEnd={cancelHold}
                    disabled={triggering}
                    style={{
                      background: sosHeld
                        ? `conic-gradient(#ff4757 ${holdProgress * 3.6}deg, #7b0000 0deg)`
                        : undefined
                    }}
                  >
                    <div className={styles.sosInner}>
                      <span className={styles.sosIcon}>🆘</span>
                      <span className={styles.sosLabel}>SOS</span>
                      <span className={styles.sosHint}>
                        {sosHeld ? `${Math.round(holdProgress)}%` : 'Hold 3s'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
              <p className={styles.sosInstruction}>
                Press & hold the button for 3 seconds to send an emergency SOS alert to your trusted contacts.
              </p>
            </>
          ) : (
            <div className={styles.activeEmergency}>
              <div className={styles.activeIcon}>🚨</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--danger)', fontSize: 24, textAlign: 'center' }}>
                EMERGENCY ACTIVE
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                Alert sent {activeAlert?.createdAt ? formatDistanceToNow(new Date(activeAlert.createdAt), { addSuffix: true }) : ''}
              </p>
              {currentLocation && (
                <div className={styles.locationBox}>
                  <span>📍</span>
                  <span style={{ fontSize: 13 }}>
                    Sharing location: {currentLocation.lat?.toFixed(4)}, {currentLocation.lng?.toFixed(4)}
                  </span>
                </div>
              )}
              <div className={styles.notified}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                  CONTACTS NOTIFIED ({activeAlert?.notifiedContacts?.length || 0})
                </div>
                {activeAlert?.notifiedContacts?.map((nc, i) => (
                  <div key={i} className={styles.notifiedItem}>
                    <span>✅</span>
                    <span>{nc.name} — {nc.phone}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button className="btn-outline" style={{ flex: 1 }} onClick={() => cancelSOS('resolved')}>
                  ✅ I'm Safe Now
                </button>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => cancelSOS('false-alarm')}>
                  False Alarm
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          {/* Custom message */}
          {!isEmergency && (
            <div className="card">
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, marginBottom: 14 }}>
                Custom Alert Message
              </h3>
              <textarea
                placeholder="Describe your emergency situation (optional)..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                style={{ resize: 'none', marginBottom: 12 }}
              />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Quick templates:
              </div>
              <div className={styles.presets}>
                {presetMessages.map((msg) => (
                  <button key={msg} className={styles.presetBtn}
                    onClick={() => setCustomMessage(msg)}>
                    {msg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Emergency contacts list */}
          <div className="card">
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, marginBottom: 14 }}>
              Will Notify ({contacts.length} contact{contacts.length !== 1 ? 's' : ''})
            </h3>
            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
                No contacts added. Add trusted contacts to enable SOS alerts.
              </div>
            ) : (
              <div className={styles.contactsList}>
                {contacts.map((c) => (
                  <div key={c._id} className={styles.contactItem}>
                    <div className={styles.contactAvatar}>{c.name.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {c.name}
                        {c.isPrimary && <span className="badge badge-pink" style={{ marginLeft: 8, fontSize: 10 }}>PRIMARY</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.phone}</div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: 11 }}>Will be alerted</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety tips */}
          <div className="card">
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, marginBottom: 14 }}>Safety Tips</h3>
            <div className={styles.tips}>
              {[
                { icon: '📱', tip: 'Keep your phone charged at all times' },
                { icon: '👥', tip: 'Share your travel route with a trusted person' },
                { icon: '💡', tip: 'Stay in well-lit and populated areas at night' },
                { icon: '🚗', tip: 'Prefer verified transport services' },
              ].map((t) => (
                <div key={t.tip} className={styles.tipItem}>
                  <span>{t.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
