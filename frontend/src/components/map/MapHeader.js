import React from 'react';
import styles from '../../pages/MapPage.module.css';

export default function MapHeader({
  tracking,
  isLocating,
  loadingPlaces,
  onToggleTracking,
  onCenterMap,
  onRefreshPlaces,
}) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className="section-title">Nearby Safe Places</h1>
        <p className={styles.headerCopy}>
          Find police stations and hospitals near your current location.
        </p>
      </div>

      <div className={styles.headerActions}>
        <button
          type="button"
          className={tracking ? 'btn-outline' : 'btn-primary'}
          onClick={onToggleTracking}
        >
          {tracking ? 'Stop Tracking' : isLocating ? 'Locating...' : 'Start Tracking'}
        </button>

        <button type="button" className="btn-ghost" onClick={onCenterMap}>
          Center Map
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={onRefreshPlaces}
          disabled={loadingPlaces}
        >
          {loadingPlaces ? 'Refreshing...' : 'Refresh Places'}
        </button>
      </div>
    </div>
  );
}
