import React from 'react';
import { Circle, GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 28.6139, lng: 77.209 }; 

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0b0b1a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111128' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050d1a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#13131f' }] },
];

const createMarkerIcon = (fillColor, label) => ({
  url:
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="48" viewBox="0 0 38 48">
        <path d="M19 47c8-10.5 15-18.2 15-28C34 8.5 27.3 2 19 2S4 8.5 4 19c0 9.8 7 17.5 15 28z" fill="${fillColor}" stroke="white" stroke-width="2"/>
        <circle cx="19" cy="19" r="9" fill="white"/>
        <text x="19" y="23" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="${fillColor}">${label}</text>
      </svg>`
    ),
  scaledSize: new window.google.maps.Size(38, 48),
});

const getPlaceIcon = (type) => {
  if (type === 'police') {
    return createMarkerIcon('#2dd4bf', 'P');
  }

  return createMarkerIcon('#ff6b6b', 'H');
};

export default function SafePlacesMap({
  location,
  isEmergency,
  places,
  selectedPlace,
  onSelectPlace,
  onMapLoad,
}) {
  const currentUserIcon = createMarkerIcon('#e91e8c', 'Y');

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={location || defaultCenter}
        zoom={14}
        onLoad={onMapLoad}
        options={{
          styles: darkMapStyle,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {location ? (
          <>
            <Marker
              position={location}
              icon={currentUserIcon}
              onClick={() => onSelectPlace({ id: 'me', name: 'Your Location', location })}
            />

            {isEmergency ? (
              <Circle
                center={location}
                radius={200}
                options={{
                  fillColor: '#e91e8c',
                  fillOpacity: 0.12,
                  strokeColor: '#e91e8c',
                  strokeOpacity: 0.45,
                  strokeWeight: 2,
                }}
              />
            ) : null}
          </>
        ) : null}

        {places.map((place) => (
          <Marker
            key={place.id}
            position={place.location}
            icon={getPlaceIcon(place.type)}
            onClick={() => onSelectPlace(place)}
          />
        ))}

        {selectedPlace ? (
          <InfoWindow
            position={selectedPlace.location}
            onCloseClick={() => onSelectPlace(null)}
          >
            <div style={{ color: '#111', maxWidth: 220 }}>
              <strong>{selectedPlace.name}</strong>
              {'address' in selectedPlace ? <div style={{ marginTop: 6 }}>{selectedPlace.address}</div> : null}
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  );
}
