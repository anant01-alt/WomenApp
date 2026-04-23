const SAFE_PLACE_TYPES = [
  {
    key: 'police',
    label: 'Police Stations',
    googleType: 'police',
    keyword: 'police station',
  },
  {
    key: 'hospital',
    label: 'Hospitals',
    googleType: 'hospital',
    keyword: 'hospital',
  },
];

const PLACES_STATUS_MESSAGES = {
  INVALID_REQUEST: 'The nearby places request was invalid.',
  NOT_FOUND: 'No valid location was found for this nearby search.',
  OVER_QUERY_LIMIT: 'The Google Places quota limit was reached.',
  REQUEST_DENIED: 'Google Places rejected the request. Check API permissions.',
  UNKNOWN_ERROR: 'Google Places failed temporarily. Please try again.',
  ZERO_RESULTS: '',
};

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

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getPlacesService = () => {
  if (!window.google?.maps?.places) {
    throw new Error('Google Places API is unavailable.');
  }

  return new window.google.maps.places.PlacesService(document.createElement('div'));
};

const normalizePlaceResult = (result, typeConfig, userLocation) => {
  const geometryLocation = result.geometry?.location;
  if (!geometryLocation) return null;

  const normalizedLocation = {
    lat: geometryLocation.lat(),
    lng: geometryLocation.lng(),
  };

  return {
    id: result.place_id,
    name: result.name || typeConfig.label,
    address: result.vicinity || result.formatted_address || 'Address unavailable',
    type: typeConfig.key,
    typeLabel: typeConfig.label,
    keyword: typeConfig.keyword,
    location: normalizedLocation,
    distanceKm: calculateDistanceKm(userLocation, normalizedLocation),
  };
};

const nearbySearch = ({ service, location, radius, typeConfig }) =>
  new Promise((resolve, reject) => {
    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius,
      type: typeConfig.googleType,
      keyword: typeConfig.keyword,
    };

    service.nearbySearch(request, (results, status) => {
      const normalizedStatus = String(status || '');

      if (
        normalizedStatus === window.google.maps.places.PlacesServiceStatus.OK ||
        normalizedStatus === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
      ) {
        resolve(results || []);
        return;
      }

      const fallbackMessage =
        PLACES_STATUS_MESSAGES[normalizedStatus] ||
        `Google Places returned ${normalizedStatus || 'an unknown status'}.`;

      reject(new Error(fallbackMessage));
    });
  });

export const fetchNearbySafePlaces = async ({ location, radius = 3000 }) => {
  if (!location) return [];

  const service = getPlacesService();

  const groupedResults = await Promise.all(
    SAFE_PLACE_TYPES.map(async (typeConfig) => {
      const results = await nearbySearch({
        service,
        location,
        radius,
        typeConfig,
      });

      return results
        .map((result) => normalizePlaceResult(result, typeConfig, location))
        .filter(Boolean)
        .sort((left, right) => left.distanceKm - right.distanceKm)
        .slice(0, 8);
    })
  );

  return groupedResults
    .flat()
    .sort((left, right) => left.distanceKm - right.distanceKm);
};

export const fetchDirections = ({ origin, destination }) =>
  new Promise((resolve, reject) => {
    if (!window.google?.maps) {
      reject(new Error('Google Maps directions are unavailable.'));
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        const normalizedStatus = String(status || '');

        if (normalizedStatus === window.google.maps.DirectionsStatus.OK) {
          resolve(result);
          return;
        }

        reject(
          new Error(
            `Unable to render directions${normalizedStatus ? ` (${normalizedStatus})` : ''}.`
          )
        );
      }
    );
  });

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
