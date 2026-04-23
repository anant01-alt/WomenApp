import { useMemo } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';

export default function useGoogleMapsLoader() {
  const libraries = useMemo(() => ['places'], []);

  const loaderState = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  return {
    ...loaderState,
    apiKeyMissing: !GOOGLE_MAPS_API_KEY,
  };
}
