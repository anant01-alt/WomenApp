import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { sosAPI } from '../services/api';
import { emitLocation, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SOSContext = createContext(null);

export const SOSProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const locationInterval = useRef(null);
  const watchId = useRef(null);

  // Check for active alert on mount
  useEffect(() => {
    if (user) checkActiveAlert();
  }, [user]);

  // Listen to socket SOS events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('alert_resolved', ({ alertId }) => {
      if (activeAlert?._id === alertId) {
        setActiveAlert(null);
        setIsEmergency(false);
        stopLocationTracking();
      }
    });
    return () => socket.off('alert_resolved');
  }, [activeAlert]);

  const checkActiveAlert = async () => {
    try {
      const { data } = await sosAPI.getActive();
      if (data.alert) {
        setActiveAlert(data.alert);
        setIsEmergency(true);
        startLocationTracking(data.alert._id);
      }
    } catch {}
  };

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

  const triggerSOS = async (customMessage = '') => {
    try {
      const pos = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = pos.coords;
      setCurrentLocation({ lat, lng });

      const payload = {
        lat,
        lng,
        message: customMessage || 'Emergency! I need help immediately!',
      };

      const { data } = await sosAPI.trigger(payload);
      setActiveAlert(data.alert);
      setIsEmergency(true);
      startLocationTracking(data.alert._id);

      toast.error(`🚨 SOS Sent! ${data.notifiedCount} contact(s) notified`, { duration: 5000 });
      return data;
    } catch (err) {
      toast.error('Failed to trigger SOS: ' + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const startLocationTracking = (alertId) => {
    stopLocationTracking();

    // Watch GPS position
    watchId.current = navigator.geolocation?.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCurrentLocation({ lat, lng });
        emitLocation(lat, lng, alertId);
      },
      null,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    // Also send via API every 30s as backup
    locationInterval.current = setInterval(async () => {
      if (currentLocation) {
        await sosAPI.updateLocation(alertId, currentLocation).catch(() => {});
      }
    }, 30000);
  };

  const stopLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation?.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  const cancelSOS = async (status = 'cancelled') => {
    if (!activeAlert) return;
    try {
      await sosAPI.resolve(activeAlert._id, { status });
      setActiveAlert(null);
      setIsEmergency(false);
      stopLocationTracking();
      toast.success('SOS cancelled. Stay safe! 💙');
    } catch (err) {
      toast.error('Failed to cancel SOS');
    }
  };

  return (
    <SOSContext.Provider value={{
      activeAlert, isEmergency, currentLocation,
      triggerSOS, cancelSOS, checkActiveAlert, setCurrentLocation
    }}>
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => useContext(SOSContext);
