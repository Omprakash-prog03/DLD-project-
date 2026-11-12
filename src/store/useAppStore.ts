import { create } from 'zustand';
import { Alarm, ClockTime, DeviceStatus, OperatingMode, SoundType, TimeFormat } from '../types';
import { deviceService } from '../services/device/deviceService';
import { buzzerAudio } from '../services/audio/buzzerAudio';

export type NavigationTab = 'dashboard' | 'alarms' | 'clock-settings' | 'device' | 'diagnostics' | 'game';

interface AppState {
  // Navigation & UI View
  activeTab: NavigationTab;
  isAlarmCreatorOpen: boolean;
  editingAlarm: Alarm | null;
  timeFormat: TimeFormat;
  theme: 'light' | 'dark';
  desktopViewMode: 'editorial-frame' | 'responsive';

  // Clock & Time State
  currentTime: ClockTime;
  isClockRunning: boolean;

  // Device & Connection State
  operatingMode: OperatingMode;
  deviceStatus: DeviceStatus;
  hardwareIp: string;
  isConnecting: boolean;
  isSyncing: boolean;
  lastActionMessage: string | null;
  lastActionError: string | null;

  // Alarms State
  alarms: Alarm[];
  activeRingingAlarm: Alarm | null;
  isGameActive: boolean;

  // Actions
  setActiveTab: (tab: NavigationTab) => void;
  openAlarmCreator: (alarm?: Alarm) => void;
  closeAlarmCreator: () => void;
  setTimeFormat: (format: TimeFormat) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setDesktopViewMode: (mode: 'editorial-frame' | 'responsive') => void;
  setOperatingMode: (mode: OperatingMode) => Promise<void>;
  setHardwareIp: (ip: string) => void;

  // Clock Actions
  tickClock: () => void;
  refreshDeviceTime: () => Promise<void>;
  setDeviceTime: (time: Partial<ClockTime>) => Promise<boolean>;
  syncWithBrowserTime: () => Promise<boolean>;

  // Device Actions
  refreshDeviceStatus: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; latencyMs: number; message: string }>;
  testBuzzer: (soundId?: SoundType) => Promise<void>;
  disconnectDevice: () => void;
  reconnectDevice: () => Promise<void>;

  // Alarm Actions
  loadAlarms: () => Promise<void>;
  saveAlarm: (alarmData: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Alarm | null>;
  deleteAlarm: (id: string) => Promise<boolean>;
  toggleAlarm: (id: string, enabled?: boolean) => Promise<void>;
  dismissRingingAlarm: () => Promise<void>;
  snoozeRingingAlarm: (minutes?: number) => Promise<void>;
  openWakeUpGame: () => void;
  closeWakeUpGame: () => void;
  triggerAlarmManualTest: (alarmId: string) => void;
  clearActionMessage: () => void;
}

const initialTime = (): ClockTime => {
  const now = new Date();
  return {
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    source: 'SIMULATED',
    timezone: 'Asia/Kolkata',
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'dashboard',
  isAlarmCreatorOpen: false,
  editingAlarm: null,
  timeFormat: '24h',
  theme: 'light',
  desktopViewMode: 'editorial-frame',

  currentTime: initialTime(),
  isClockRunning: true,

  operatingMode: deviceService.getOperatingMode(),
  deviceStatus: {
    connected: true,
    deviceName: 'ESP32-WROOM-32 (Simulated)',
    ipAddress: '192.168.4.1',
    clockSource: 'DS3231',
    rtcAvailable: true,
    firmwareVersion: '1.2.0-SIM',
    lastSeen: new Date().toISOString(),
    lastSync: new Date().toISOString(),
    buzzerActive: false,
    operatingMode: 'simulation',
    connectionState: 'connected',
  },
  hardwareIp: deviceService.getHardwareIp(),
  isConnecting: false,
  isSyncing: false,
  lastActionMessage: null,
  lastActionError: null,

  alarms: [],
  activeRingingAlarm: null,
  isGameActive: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  openAlarmCreator: (alarm) =>
    set({
      isAlarmCreatorOpen: true,
      editingAlarm: alarm || null,
    }),

  closeAlarmCreator: () =>
    set({
      isAlarmCreatorOpen: false,
      editingAlarm: null,
    }),

  setTimeFormat: (format) => set({ timeFormat: format }),

  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  setDesktopViewMode: (mode) => set({ desktopViewMode: mode }),

  setOperatingMode: async (mode) => {
    deviceService.setOperatingMode(mode);
    set({ operatingMode: mode, isConnecting: true, lastActionError: null });
    try {
      const status = await deviceService.getStatus();
      const alarms = await deviceService.getAlarms();
      const time = await deviceService.getTime();
      set({
        deviceStatus: status,
        alarms,
        currentTime: time,
        isConnecting: false,
        lastActionMessage: `Switched to ${mode === 'hardware' ? 'ESP32 Hardware' : 'Simulation'} mode`,
      });
    } catch (err: any) {
      set({
        isConnecting: false,
        lastActionError: `Failed to connect in hardware mode: ${err.message}`,
      });
    }
  },

  setHardwareIp: (ip) => {
    deviceService.setHardwareIp(ip);
    set({ hardwareIp: ip });
  },

  tickClock: () => {
    const { currentTime, alarms, activeRingingAlarm } = get();

    // Increment 1 second
    let s = currentTime.second + 1;
    let m = currentTime.minute;
    let h = currentTime.hour;
    let d = currentTime.day;
    let mo = currentTime.month;
    let y = currentTime.year;

    if (s >= 60) {
      s = 0;
      m += 1;
      if (m >= 60) {
        m = 0;
        h += 1;
        if (h >= 24) {
          h = 0;
          // next day
          const nextDayObj = new Date(y, mo - 1, d + 1);
          d = nextDayObj.getDate();
          mo = nextDayObj.getMonth() + 1;
          y = nextDayObj.getFullYear();
        }
      }
    }

    const updatedTime: ClockTime = {
      ...currentTime,
      hour: h,
      minute: m,
      second: s,
      day: d,
      month: mo,
      year: y,
    };

    set({ currentTime: updatedTime });

    // Check alarm triggers (only trigger on s === 0 and when no alarm is already ringing)
    if (s === 0 && !activeRingingAlarm) {
      const currentDayOfWeek = new Date(y, mo - 1, d).getDay();

      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        if (alarm.hour !== h || alarm.minute !== m) continue;

        let shouldTrigger = false;
        if (alarm.repeatType === 'once') {
          if (!alarm.date) {
            shouldTrigger = true;
          } else {
            const todayStr = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (alarm.date === todayStr) {
              shouldTrigger = true;
            }
          }
        } else if (alarm.repeatType === 'daily') {
          shouldTrigger = true;
        } else if (alarm.repeatType === 'weekdays') {
          shouldTrigger = [1, 2, 3, 4, 5].includes(currentDayOfWeek);
        } else if (alarm.repeatType === 'weekends') {
          shouldTrigger = [0, 6].includes(currentDayOfWeek);
        } else if (alarm.repeatType === 'custom') {
          shouldTrigger = alarm.repeatDays.includes(currentDayOfWeek);
        }

        if (shouldTrigger) {
          // Trigger alarm!
          buzzerAudio.startAlarmRinging(alarm.soundId);
          set({
            activeRingingAlarm: alarm,
            isGameActive: alarm.wakeUpMission,
          });
          break;
        }
      }
    }
  },

  refreshDeviceTime: async () => {
    try {
      const time = await deviceService.getTime();
      set({ currentTime: time });
    } catch (err: any) {
      console.warn('Could not read time from device', err);
    }
  },

  setDeviceTime: async (time) => {
    set({ isSyncing: true, lastActionError: null });
    try {
      const res = await deviceService.setTime(time);
      const updated = await deviceService.getTime();
      set({
        currentTime: updated,
        isSyncing: false,
        lastActionMessage: res.message || 'Time updated successfully',
      });
      return true;
    } catch (err: any) {
      set({
        isSyncing: false,
        lastActionError: `Failed to set time: ${err.message}`,
      });
      return false;
    }
  },

  syncWithBrowserTime: async () => {
    const now = new Date();
    return get().setDeviceTime({
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      day: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  },

  refreshDeviceStatus: async () => {
    try {
      const status = await deviceService.getStatus();
      set({ deviceStatus: status });
    } catch (err: any) {
      set({
        deviceStatus: {
          ...get().deviceStatus,
          connected: false,
          connectionState: 'error',
          errorMessage: err.message,
        },
      });
    }
  },

  testConnection: async () => {
    set({ isConnecting: true });
    try {
      const res = await deviceService.testConnection();
      await get().refreshDeviceStatus();
      set({ isConnecting: false });
      return res;
    } catch (err: any) {
      set({ isConnecting: false });
      return {
        success: false,
        latencyMs: 0,
        message: err.message || 'Failed to connect to ESP32',
      };
    }
  },

  testBuzzer: async (soundId = 'buzzer-standard') => {
    buzzerAudio.playTone(soundId, 600);
    try {
      await deviceService.triggerBuzzerTest(soundId, 600);
    } catch {
      // Ignore if offline
    }
  },

  disconnectDevice: () => {
    const current = get().deviceStatus;
    set({
      deviceStatus: {
        ...current,
        connected: false,
        connectionState: 'disconnected',
        errorMessage: 'Disconnected by user',
      },
      lastActionMessage: 'Hardware link disconnected',
    });
  },

  reconnectDevice: async () => {
    set({ isConnecting: true, lastActionError: null });
    try {
      const res = await deviceService.testConnection();
      await get().refreshDeviceStatus();
      await get().refreshDeviceTime();
      await get().loadAlarms();
      set({
        isConnecting: false,
        lastActionMessage: res.message || 'Device reconnected successfully',
      });
    } catch (err: any) {
      set({
        isConnecting: false,
        lastActionError: `Reconnection failed: ${err.message}`,
      });
    }
  },

  loadAlarms: async () => {
    try {
      const alarms = await deviceService.getAlarms();
      set({ alarms });
    } catch (err: any) {
      console.warn('Failed to load alarms', err);
    }
  },

  saveAlarm: async (alarmData) => {
    const { editingAlarm } = get();
    set({ isSyncing: true, lastActionError: null });

    try {
      let saved: Alarm;
      if (editingAlarm) {
        saved = await deviceService.updateAlarm(editingAlarm.id, alarmData);
      } else {
        saved = await deviceService.createAlarm(alarmData);
      }

      const alarms = await deviceService.getAlarms();
      buzzerAudio.playConfirm();

      set({
        alarms,
        isAlarmCreatorOpen: false,
        editingAlarm: null,
        isSyncing: false,
        lastActionMessage: editingAlarm
          ? `Alarm "${saved.title}" updated`
          : `Alarm "${saved.title}" created for ${saved.hour}:${String(saved.minute).padStart(2, '0')}`,
      });

      return saved;
    } catch (err: any) {
      set({
        isSyncing: false,
        lastActionError: `Failed to save alarm: ${err.message}`,
      });
      return null;
    }
  },

  deleteAlarm: async (id) => {
    set({ isSyncing: true });
    try {
      await deviceService.deleteAlarm(id);
      const alarms = await deviceService.getAlarms();
      set({
        alarms,
        isSyncing: false,
        lastActionMessage: 'Alarm deleted',
      });
      return true;
    } catch (err: any) {
      set({
        isSyncing: false,
        lastActionError: `Failed to delete alarm: ${err.message}`,
      });
      return false;
    }
  },

  toggleAlarm: async (id, enabled) => {
    try {
      await deviceService.toggleAlarm(id, enabled);
      const alarms = await deviceService.getAlarms();
      set({ alarms });
    } catch (err: any) {
      set({ lastActionError: `Could not toggle alarm: ${err.message}` });
    }
  },

  dismissRingingAlarm: async () => {
    const { activeRingingAlarm } = get();
    buzzerAudio.stopAlarmRinging();

    if (activeRingingAlarm) {
      try {
        await deviceService.dismissAlarm(activeRingingAlarm.id);
        const alarms = await deviceService.getAlarms();
        set({ alarms });
      } catch {
        // ignore
      }
    }

    set({
      activeRingingAlarm: null,
      isGameActive: false,
    });
  },

  snoozeRingingAlarm: async (minutes = 10) => {
    const { activeRingingAlarm } = get();
    buzzerAudio.stopAlarmRinging();

    if (activeRingingAlarm) {
      try {
        await deviceService.snoozeAlarm(activeRingingAlarm.id, minutes);
      } catch {
        // ignore
      }
    }

    set({
      activeRingingAlarm: null,
      isGameActive: false,
      lastActionMessage: `Alarm snoozed for ${minutes} minutes`,
    });
  },

  openWakeUpGame: () => set({ isGameActive: true }),
  closeWakeUpGame: () => set({ isGameActive: false }),

  triggerAlarmManualTest: (alarmId: string) => {
    const alarm = get().alarms.find((a) => a.id === alarmId);
    if (alarm) {
      buzzerAudio.startAlarmRinging(alarm.soundId);
      set({
        activeRingingAlarm: alarm,
        isGameActive: alarm.wakeUpMission,
      });
    }
  },

  clearActionMessage: () => set({ lastActionMessage: null, lastActionError: null }),
}));
