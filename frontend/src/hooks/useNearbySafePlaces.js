import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildDirectionsUrl, fetchNearbySafePlaces } from '../services/placesService';

const DEFAULT_RADIUS = Number(process.env.REACT_APP_SAFE_PLACES_RADIUS || 3000);

export default function useNearbySafePlaces({ location, isLoaded }) {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState('');

  const refreshPlaces = useCallback(async () => {
    if (!isLoaded || !location) return;

    setLoadingPlaces(true);
    setPlacesError('');

    try {
      const results = await fetchNearbySafePlaces({
        location,
        radius: DEFAULT_RADIUS,
      });

      setPlaces(results);
      setSelectedPlace((current) =>
        current ? results.find((place) => place.id === current.id) || null : null
      );
    } catch (error) {
      setPlaces([]);
      setPlacesError(error.message || 'Unable to load nearby safe places.');
    } finally {
      setLoadingPlaces(false);
    }
  }, [isLoaded, location]);

  useEffect(() => {
    refreshPlaces();
  }, [refreshPlaces]);

  const groupedPlaces = useMemo(
    () => ({
      police: places.filter((place) => place.type === 'police'),
      hospital: places.filter((place) => place.type === 'hospital'),
    }),
    [places]
  );

  const getDirectionsUrl = useCallback(
    (place) =>
      buildDirectionsUrl({
        origin: location,
        destination: place.location,
      }),
    [location]
  );

  return {
    places,
    groupedPlaces,
    selectedPlace,
    loadingPlaces,
    placesError,
    refreshPlaces,
    setSelectedPlace,
    getDirectionsUrl,
  };
}
