import React, { useCallback, useEffect, useRef, useState } from 'react';
import MapHeader from '../components/map/MapHeader';
import LocationSummary from '../components/map/LocationSummary';
import NearbyPlacesPanel from '../components/map/NearbyPlacesPanel';
import SafePlacesMap from '../components/map/SafePlacesMap';
import useGoogleMapsLoader from '../hooks/useGoogleMapsLoader';
import useCurrentLocation from '../hooks/useCurrentLocation';
import useNearbySafePlaces from '../hooks/useNearbySafePlaces';
import { useSOS } from '../context/SOSContext';
import { emitLocation } from '../services/socket';
import { userAPI } from '../services/api';
import styles from './MapPage.module.css';

export default function MapPage() {
  const { isEmergency, activeAlert, currentLocation } = useSOS();
  const { isLoaded, loadError, apiKeyMissing } = useGoogleMapsLoader();
  const [map, setMap] = useState(null);
  const locationSyncTimeoutRef = useRef(null);
  const trackingRef = useRef(false);

  const syncTrackedLocation = useCallback(
    (nextLocation) => {
      if (!nextLocation) return;
      if (!trackingRef.current && !activeAlert?._id) return;

      emitLocation(nextLocation.lat, nextLocation.lng, activeAlert?._id || null);

      if (locationSyncTimeoutRef.current) {
        clearTimeout(locationSyncTimeoutRef.current);
      }

      locationSyncTimeoutRef.current = setTimeout(() => {
        userAPI.updateLocation(nextLocation).catch(() => {});
      }, 400);
    },
    [activeAlert]
  );

  const {
    location,
    error: locationError,
    isLocating,
    tracking,
    requestCurrentLocation,
    startTracking,
    stopTracking,
  } = useCurrentLocation({
    initialLocation: currentLocation,
    onLocationChange: syncTrackedLocation,
  });

  useEffect(() => {
    trackingRef.current = tracking;
  }, [tracking]);

  const {
    places,
    groupedPlaces,
    selectedPlace,
    loadingPlaces,
    placesError,
    refreshPlaces,
    setSelectedPlace,
    getDirectionsUrl,
  } = useNearbySafePlaces({
    map,
    location,
  });

  useEffect(() => {
    if (!location) {
      requestCurrentLocation();
    }
  }, [location, requestCurrentLocation]);

  useEffect(
    () => () => {
      if (locationSyncTimeoutRef.current) {
        clearTimeout(locationSyncTimeoutRef.current);
      }
    },
    []
  );

  const handleMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const centerMapOnUser = useCallback(() => {
    if (location && map) {
      map.panTo(location);
      map.setZoom(14);
      return;
    }

    requestCurrentLocation();
  }, [location, map, requestCurrentLocation]);

  const handleToggleTracking = useCallback(() => {
    if (tracking) {
      stopTracking();
      return;
    }

    startTracking();
  }, [startTracking, stopTracking, tracking]);

  const handleSelectPlace = useCallback(
    (place) => {
      setSelectedPlace(place);
      if (place?.location && map) {
        map.panTo(place.location);
      }
    },
    [map, setSelectedPlace]
  );

  if (apiKeyMissing) {
    return (
      <div className={`fade-in ${styles.page}`}>
        <MapHeader
          tracking={tracking}
          isLocating={isLocating}
          loadingPlaces={false}
          onToggleTracking={handleToggleTracking}
          onCenterMap={centerMapOnUser}
          onRefreshPlaces={requestCurrentLocation}
        />

        <LocationSummary
          location={location}
          tracking={tracking}
          isEmergency={isEmergency}
          nearbyCount={0}
          locationError={locationError}
        />

        <div className={styles.apiNotice}>
          Add <code>REACT_APP_GOOGLE_MAPS_KEY</code> to your frontend environment to enable Nearby Safe Places with Google Maps and Places API.
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`fade-in ${styles.page}`}>
        <div className="card">Failed to load Google Maps.</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`fade-in ${styles.page}`}>
        <div className="card">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`fade-in ${styles.page}`}>
      <MapHeader
        tracking={tracking}
        isLocating={isLocating}
        loadingPlaces={loadingPlaces}
        onToggleTracking={handleToggleTracking}
        onCenterMap={centerMapOnUser}
        onRefreshPlaces={refreshPlaces}
      />

      <LocationSummary
        location={location}
        tracking={tracking}
        isEmergency={isEmergency}
        nearbyCount={places.length}
        locationError={locationError}
      />

      <div className={styles.layout}>
        <div className={styles.mapCard}>
          <SafePlacesMap
            location={location}
            isEmergency={isEmergency}
            places={places}
            selectedPlace={selectedPlace}
            onSelectPlace={handleSelectPlace}
            onMapLoad={handleMapLoad}
          />
        </div>

        <NearbyPlacesPanel
          groupedPlaces={groupedPlaces}
          loadingPlaces={loadingPlaces}
          placesError={placesError}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
          getDirectionsUrl={getDirectionsUrl}
        />
      </div>
    </div>
  );
}
