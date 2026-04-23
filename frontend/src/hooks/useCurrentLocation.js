import { useCallback, useEffect, useRef, useState } from 'react';

export default function useCurrentLocation({ initialLocation = null, onLocationChange } = {}) {
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef(null);
  const locationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    locationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (initialLocation?.lat && initialLocation?.lng) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  const handleLocationUpdate = useCallback((coords) => {
    const nextLocation = {
      lat: coords.latitude,
      lng: coords.longitude,
    };

    setLocation(nextLocation);
    setError('');

    if (locationChangeRef.current) {
      locationChangeRef.current(nextLocation);
    }
  }, []);

  const handleLocationError = useCallback((geoError) => {
    setError(geoError?.message || 'Unable to access your location.');
    setIsLocating(false);
    setTracking(false);
  }, []);

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationUpdate(position.coords);
        setIsLocating(false);
      },
      (geoError) => handleLocationError(geoError),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [handleLocationError, handleLocationUpdate]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setTracking(false);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    stopTracking();
    setTracking(true);
    setIsLocating(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        handleLocationUpdate(position.coords);
        setIsLocating(false);
      },
      (geoError) => handleLocationError(geoError),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [handleLocationError, handleLocationUpdate, stopTracking]);

  useEffect(() => () => stopTracking(), [stopTracking]);

  return {
    location,
    error,
    isLocating,
    tracking,
    requestCurrentLocation,
    startTracking,
    stopTracking,
    setLocation,
  };
}
