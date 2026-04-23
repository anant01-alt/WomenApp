import React from 'react';
import styles from '../../pages/MapPage.module.css';

const SECTIONS = [
  { key: 'police', title: 'Police Stations' },
  { key: 'hospital', title: 'Hospitals' },
];

const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
};

export default function NearbyPlacesPanel({
  groupedPlaces,
  loadingPlaces,
  placesError,
  selectedPlace,
  onSelectPlace,
  getDirectionsUrl,
}) {
  return (
    <aside className={styles.placesPanel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Nearby Safe Places</h2>
        <p className={styles.panelCopy}>Quick access to help around you.</p>
      </div>

      {loadingPlaces ? <div className={styles.panelState}>Loading nearby places...</div> : null}
      {placesError ? <div className={styles.panelState}>{placesError}</div> : null}

      {!loadingPlaces && !placesError ? (
        <div className={styles.placeSections}>
          {SECTIONS.map((section) => {
            const places = groupedPlaces[section.key] || [];

            return (
              <div key={section.key} className={styles.placeSection}>
                <div className={styles.sectionHeading}>{section.title}</div>

                {places.length === 0 ? (
                  <div className={styles.emptyPlaces}>No nearby results found.</div>
                ) : (
                  places.map((place) => {
                    const isActive = selectedPlace?.id === place.id;

                    return (
                      <div
                        key={place.id}
                        className={`${styles.placeCard} ${isActive ? styles.activePlaceCard : ''}`}
                      >
                        <button
                          type="button"
                          className={styles.placeInfoButton}
                          onClick={() => onSelectPlace(place)}
                        >
                          <div className={styles.placeName}>{place.name}</div>
                          <div className={styles.placeAddress}>{place.address}</div>
                          <div className={styles.placeMeta}>{formatDistance(place.distanceKm)}</div>
                        </button>

                        <a
                          href={getDirectionsUrl(place)}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.navigateButton}
                        >
                          Navigate
                        </a>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}
