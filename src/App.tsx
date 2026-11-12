import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { EditorialLayout } from './components/common/EditorialLayout';

export const App: React.FC = () => {
  const { tickClock, loadAlarms, refreshDeviceStatus, refreshDeviceTime } = useAppStore();

  useEffect(() => {
    // Initial data hydration
    loadAlarms();
    refreshDeviceStatus();
    refreshDeviceTime();

    // 1-second clock ticker
    const clockInterval = setInterval(() => {
      tickClock();
    }, 1000);

    // Periodic device status poll (every 10 seconds)
    const statusInterval = setInterval(() => {
      refreshDeviceStatus();
    }, 10000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(statusInterval);
    };
  }, [tickClock, loadAlarms, refreshDeviceStatus, refreshDeviceTime]);

  return <EditorialLayout />;
};

export default App;
