import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSOS } from '../../context/SOSContext';

export default function EmergencyBanner() {
  const { isEmergency, activeAlert, cancelSOS } = useSOS();
  const navigate = useNavigate();

  if (!isEmergency || !activeAlert) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #2d0a0a, #1a0515)',
      border: '1px solid #ff4757',
      borderRadius: 12,
      padding: '14px 20px',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      animation: 'fadeIn 0.3s ease',
      boxShadow: '0 0 30px rgba(255,71,87,0.2)'
    }}>
      <span style={{ fontSize: 28, animation: 'pulse-dot 1s ease-in-out infinite' }}>🚨</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: '#ff4757', fontFamily: 'Syne, sans-serif', fontSize: 15 }}>
          EMERGENCY ALERT ACTIVE
        </div>
        <div style={{ fontSize: 13, color: '#9896b8', marginTop: 2 }}>
          {activeAlert.notifiedContacts?.length || 0} contact(s) have been notified. Help is on the way.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 14px' }}
          onClick={() => navigate('/sos')}>
          View Details
        </button>
        <button style={{
          background: '#ff4757', color: 'white', border: 'none',
          borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer'
        }} onClick={() => cancelSOS('cancelled')}>
          Cancel SOS
        </button>
      </div>
    </div>
  );
}
