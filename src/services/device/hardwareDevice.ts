import { Alarm, ClockTime, DeviceStatus, DiagnosticsData, IDeviceService, SoundType } from '../../types';

export class HardwareDevice implements IDeviceService {
  private ipAddress: string;
  private port: number;
  private timeoutMs: number = 4000;
  private lastKnownStatus: DeviceStatus | null = null;

  constructor(ipAddress: string = '192.168.4.1', port: number = 80) {
    this.ipAddress = ipAddress.trim();
    this.port = port;
  }

  public setConnection(ip: string, port: number = 80): void {
    this.ipAddress = ip.trim();
    this.port = port;
  }

  public getIp(): string {
    return this.ipAddress;
  }

  private getBaseUrl(): string {
    const cleanIp = this.ipAddress.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `http://${cleanIp}${this.port !== 80 ? `:${this.port}` : ''}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errBody = await response.json();
          if (errBody?.message) errorMsg = errBody.message;
        } catch {
          // ignore json parse error on non-json error response
        }
        throw new Error(errorMsg);
      }

      const json = await response.json();
      return json;
    } catch (err: unknown) {
      clearTimeout(timer);
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error(`Connection timeout: ESP32 at ${this.ipAddress} did not respond within ${this.timeoutMs}ms.`);
        }
        if (isHttps && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
          throw new Error(
            `Mixed-Content Block: Deployed HTTPS site cannot directly reach local HTTP (${this.ipAddress}). Connect to ESP32 Wi-Fi AP or serve web app via local HTTP.`
          );
        }
        throw err;
      }
      throw new Error('Unknown network communication failure with ESP32');
    }
  }

  public async getStatus(): Promise<DeviceStatus> {
    try {
      const data = await this.request<{
        connected: boolean;
        device: string;
        clockSource: string;
        rtcStatus: string;
        alarmCount: number;
        buzzerStatus: boolean;
        firmwareVersion: string;
        wifiMode?: 'AP' | 'STA';
        wifiSSID?: string;
        rssi?: number;
        uptime?: number;
        freeHeap?: number;
      }>('/api/status');

      const status: DeviceStatus = {
        connected: data.connected !== false,
        deviceName: data.device || 'ESP32-WROOM-32',
        ipAddress: this.ipAddress,
        clockSource: (data.clockSource as any) || 'DS3231',
        rtcAvailable: data.rtcStatus === 'available' || data.rtcStatus === 'OK',
        firmwareVersion: data.firmwareVersion || '1.0.0',
        lastSeen: new Date().toISOString(),
        lastSync: new Date().toISOString(),
        buzzerActive: !!data.buzzerStatus,
        operatingMode: 'hardware',
        connectionState: 'connected',
        wifiMode: data.wifiMode || 'AP',
        wifiSSID: data.wifiSSID,
        rssi: data.rssi,
        uptimeSeconds: data.uptime,
        freeHeap: data.freeHeap,
      };

      this.lastKnownStatus = status;
      return status;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        connected: false,
        deviceName: 'ESP32-WROOM-32',
        ipAddress: this.ipAddress,
        clockSource: 'DS3231',
        rtcAvailable: false,
        firmwareVersion: this.lastKnownStatus?.firmwareVersion || 'Unknown',
        lastSeen: this.lastKnownStatus?.lastSeen || null,
        lastSync: this.lastKnownStatus?.lastSync || null,
        buzzerActive: false,
        operatingMode: 'hardware',
        connectionState: 'disconnected',
        errorMessage: msg,
      };
    }
  }

  public async getTime(): Promise<ClockTime> {
    const data = await this.request<{
      hour: number;
      minute: number;
      second: number;
      day: number;
      month: number;
      year: number;
      source: string;
      timezone?: string;
    }>('/api/time');

    return {
      hour: data.hour,
      minute: data.minute,
      second: data.second,
      day: data.day,
      month: data.month,
      year: data.year,
      source: (data.source as any) || 'DS3231',
      timezone: data.timezone || 'Asia/Kolkata',
    };
  }

  public async setTime(time: Partial<ClockTime>): Promise<{ success: boolean; message: string }> {
    const payload = {
      hour: time.hour,
      minute: time.minute,
      second: time.second ?? 0,
      day: time.day,
      month: time.month,
      year: time.year,
    };

    const res = await this.request<{ success: boolean; message: string }>('/api/time', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      success: res.success !== false,
      message: res.message || 'Time updated on ESP32 & DS3231',
    };
  }

  public async getAlarms(): Promise<Alarm[]> {
    const alarms = await this.request<any[]>('/api/alarms');
    // Normalize format
    return alarms.map((a) => ({
      id: String(a.id),
      title: a.title || 'Alarm',
      description: a.description || '',
      hour: Number(a.hour),
      minute: Number(a.minute),
      second: Number(a.second || 0),
      enabled: Boolean(a.enabled),
      repeatType: a.repeat?.type || a.repeatType || 'once',
      repeatDays: a.repeat?.days || a.repeatDays || [],
      date: a.date || null,
      soundId: a.soundId || 'buzzer-standard',
      snoozeDuration: Number(a.snoozeDuration ?? 10),
      wakeUpMission: Boolean(a.wakeUpMission),
      createdAt: a.createdAt || new Date().toISOString(),
      updatedAt: a.updatedAt || new Date().toISOString(),
      lastTriggeredAt: a.lastTriggeredAt || null,
      syncStatus: 'synced',
    }));
  }

  public async createAlarm(alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alarm> {
    const payload = {
      title: alarm.title,
      description: alarm.description,
      hour: alarm.hour,
      minute: alarm.minute,
      second: alarm.second ?? 0,
      enabled: alarm.enabled,
      repeat: {
        type: alarm.repeatType,
        days: alarm.repeatDays,
      },
      soundId: alarm.soundId,
      snoozeDuration: alarm.snoozeDuration,
      wakeUpMission: alarm.wakeUpMission,
      date: alarm.date,
    };

    const res = await this.request<any>('/api/alarms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      id: String(res.id || res.data?.id || Date.now()),
      title: alarm.title,
      description: alarm.description,
      hour: alarm.hour,
      minute: alarm.minute,
      second: alarm.second ?? 0,
      enabled: alarm.enabled,
      repeatType: alarm.repeatType,
      repeatDays: alarm.repeatDays,
      date: alarm.date,
      soundId: alarm.soundId,
      snoozeDuration: alarm.snoozeDuration,
      wakeUpMission: alarm.wakeUpMission,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggeredAt: null,
      syncStatus: 'synced',
    };
  }

  public async updateAlarm(id: string, alarm: Partial<Alarm>): Promise<Alarm> {
    const payload: any = {};
    if (alarm.title !== undefined) payload.title = alarm.title;
    if (alarm.description !== undefined) payload.description = alarm.description;
    if (alarm.hour !== undefined) payload.hour = alarm.hour;
    if (alarm.minute !== undefined) payload.minute = alarm.minute;
    if (alarm.second !== undefined) payload.second = alarm.second;
    if (alarm.enabled !== undefined) payload.enabled = alarm.enabled;
    if (alarm.repeatType !== undefined || alarm.repeatDays !== undefined) {
      payload.repeat = {
        type: alarm.repeatType,
        days: alarm.repeatDays,
      };
    }
    if (alarm.soundId !== undefined) payload.soundId = alarm.soundId;
    if (alarm.snoozeDuration !== undefined) payload.snoozeDuration = alarm.snoozeDuration;
    if (alarm.wakeUpMission !== undefined) payload.wakeUpMission = alarm.wakeUpMission;
    if (alarm.date !== undefined) payload.date = alarm.date;

    const res = await this.request<any>(`/api/alarms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return {
      id,
      title: alarm.title || 'Alarm',
      hour: alarm.hour ?? 0,
      minute: alarm.minute ?? 0,
      enabled: alarm.enabled ?? true,
      repeatType: alarm.repeatType ?? 'once',
      repeatDays: alarm.repeatDays ?? [],
      date: alarm.date ?? null,
      soundId: alarm.soundId ?? 'buzzer-standard',
      snoozeDuration: alarm.snoozeDuration ?? 10,
      wakeUpMission: alarm.wakeUpMission ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggeredAt: null,
      syncStatus: 'synced',
      ...(res.data || {}),
    };
  }

  public async deleteAlarm(id: string): Promise<boolean> {
    await this.request<any>(`/api/alarms/${id}`, {
      method: 'DELETE',
    });
    return true;
  }

  public async toggleAlarm(id: string, enabled?: boolean): Promise<Alarm> {
    const res = await this.request<any>(`/api/alarms/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });

    const data = res.data || res;
    return {
      id: String(data.id || id),
      title: data.title || 'Alarm',
      hour: data.hour ?? 0,
      minute: data.minute ?? 0,
      enabled: data.enabled ?? Boolean(enabled),
      repeatType: data.repeat?.type || 'once',
      repeatDays: data.repeat?.days || [],
      date: data.date || null,
      soundId: data.soundId || 'buzzer-standard',
      snoozeDuration: data.snoozeDuration || 10,
      wakeUpMission: data.wakeUpMission || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggeredAt: null,
      syncStatus: 'synced',
    };
  }

  public async dismissAlarm(id: string): Promise<boolean> {
    await this.request<any>(`/api/alarms/${id}/dismiss`, {
      method: 'POST',
    });
    return true;
  }

  public async snoozeAlarm(id: string, minutes: number): Promise<boolean> {
    await this.request<any>(`/api/alarms/${id}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
    return true;
  }

  public async getDiagnostics(): Promise<DiagnosticsData> {
    const health = await this.request<any>('/api/device/health');
    const status = await this.getStatus();

    return {
      deviceStatus: status,
      i2cAddressesFound: health.i2cScan || ['0x68 (DS3231 RTC)'],
      ds3231TempCelsius: health.temperatureCelsius,
      ne555FrequencyHz: health.ne555Freq || 1.0,
      cd4518CounterSync: health.cd4518CounterSync !== false,
      logicGatesStatus: health.logicGatesStatus || 'All BCD lines stable',
      gpioConfig: health.gpioConfig || {
        buzzerPin: 25,
        i2cSdaPin: 21,
        i2cSclPin: 22,
        counterResetPin: 26,
        ppsInterruptPin: 34,
      },
      recentLogs: health.logs || [
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'ESP32 health report retrieved successfully',
        },
      ],
    };
  }

  public async testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    await this.request<any>('/api/status');
    const latency = Math.round(performance.now() - start);

    return {
      success: true,
      latencyMs: latency,
      message: `ESP32 responsive at ${this.ipAddress} (${latency}ms round-trip)`,
    };
  }

  public async triggerBuzzerTest(soundId: SoundType, durationMs: number): Promise<boolean> {
    await this.request<any>('/api/device/buzzer-test', {
      method: 'POST',
      body: JSON.stringify({ soundId, durationMs }),
    });
    return true;
  }
}
