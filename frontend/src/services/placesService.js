const SAFE_PLACE_TYPES = [
  { key: 'police', label: 'Police Stations', googleType: 'police' },
  { key: 'hospital', label: 'Hospitals', googleType: 'hospital' },
];

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (origin, destination) => {
  const earthRadiusKm = 6371;
  const latDiff = toRadians(destination.lat - origin.lat);
  const lngDiff = toRadians(destination.lng - origin.lng);
  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const normalizePlaceResult = (result, typeConfig, userLocation) => {
  const location = result.geometry?.location;
  if (!location) return null;

  const normalizedLocation = {
    lat: location.lat(),
    lng: location.lng(),
  };

  return {
    id: result.place_id,
    name: result.name || typeConfig.label,
    address: result.vicinity || result.formatted_address || 'Address unavailable',
    type: typeConfig.key,
    typeLabel: typeConfig.label,
    location: normalizedLocation,
    distanceKm: calculateDistanceKm(userLocation, normalizedLocation),
  };
};

const runNearbySearch = ({ map, location, radius, typeConfig }) =>
  new Promise((resolve, reject) => {
    if (!window.google?.maps?.places || !map) {
      reject(new Error('Google Places API is unavailable.'));
      return;
    }

    const placesService = new window.google.maps.places.PlacesService(map);
    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius,
      type: typeConfig.googleType,
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK || status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve(results || []);
        return;
      }

      reject(new Error(`Unable to load nearby ${typeConfig.label.toLowerCase()}.`));
    });
  });

export const fetchNearbySafePlaces = async ({ map, location, radius = 3000 }) => {
  if (!map || !location) return [];

  const groups = await Promise.all(
    SAFE_PLACE_TYPES.map(async (typeConfig) => {
      const results = await runNearbySearch({ map, location, radius, typeConfig });
      return results
        .map((result) => normalizePlaceResult(result, typeConfig, location))
        .filter(Boolean)
        .sort((left, right) => left.distanceKm - right.distanceKm)
        .slice(0, 6);
    })
  );

  return groups
    .flat()
    .sort((left, right) => left.distanceKm - right.distanceKm);
};

export const buildDirectionsUrl = ({ origin, destination }) => {
  const destinationParam = `${destination.lat},${destination.lng}`;
  const originParam = origin ? `${origin.lat},${origin.lng}` : '';
  const url = new URL('https://www.google.com/maps/dir/');

  url.searchParams.set('api', '1');
  url.searchParams.set('destination', destinationParam);
  if (originParam) {
    url.searchParams.set('origin', originParam);
  }

  return url.toString();
};

export const getSafePlaceTypes = () => SAFE_PLACE_TYPES;
