import { useCallback, useEffect, useState } from 'react';
import { fetchDirections } from '../services/placesService';

export default function usePlaceDirections({ origin, selectedPlace }) {
  const [directions, setDirections] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);

  const clearRoute = useCallback(() => {
    setDirections(null);
    setRouteError('');
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadDirections = async () => {
      if (!origin || !selectedPlace?.location || selectedPlace.id === 'me') {
        clearRoute();
        return;
      }

      setLoadingRoute(true);
      setRouteError('');

      try {
        const result = await fetchDirections({
          origin,
          destination: selectedPlace.location,
        });

        if (isActive) {
          setDirections(result);
        }
      } catch (error) {
        if (isActive) {
          setDirections(null);
          setRouteError(error.message || 'Unable to render directions.');
        }
      } finally {
        if (isActive) {
          setLoadingRoute(false);
        }
      }
    };

    loadDirections();

    return () => {
      isActive = false;
    };
  }, [clearRoute, origin, selectedPlace]);

  return {
    directions,
    routeError,
    loadingRoute,
    clearRoute,
  };
}
