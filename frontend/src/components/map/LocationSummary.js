import React from 'react';
import styles from '../../pages/MapPage.module.css';

export default function LocationSummary({ location, tracking, isEmergency, nearbyCount, locationError }) {
  return (
    <div className={`card ${styles.summaryCard}`}>
      <div className={styles.summaryGrid}>
        <div>
          <div className={styles.summaryLabel}>Latitude</div>
          <div className={styles.summaryValue}>{location ? location.lat.toFixed(6) : '--'}</div>
        </div>

        <div>
          <div className={styles.summaryLabel}>Longitude</div>
          <div className={styles.summaryValue}>{location ? location.lng.toFixed(6) : '--'}</div>
        </div>

        <div>
          <div className={styles.summaryLabel}>Nearby Safe Places</div>
          <div className={styles.summaryValue}>{nearbyCount}</div>
        </div>

        <div className={styles.badgesRow}>
          {tracking ? (
            <span className="badge badge-success">
              <span className="pulse-dot" style={{ background: 'var(--success)' }} />
              Live Tracking
            </span>
          ) : null}

          {isEmergency ? <span className="badge badge-danger">Emergency Mode</span> : null}
        </div>
      </div>

      {locationError ? <p className={styles.errorText}>{locationError}</p> : null}
    </div>
  );
}
